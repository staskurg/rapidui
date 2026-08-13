#!/usr/bin/env python3
"""Guided eval driver — drives POST /chat with conversationScript, preserving tool parts.

Unlike chat_cli.py, rebuilds full Vercel AI v6 assistant message parts (text, reasoning,
tool-* with input/output) so multi-turn validate/save loops work.

Usage:
  python scripts/eval_driver.py --config /path/to/config.json

Config JSON:
  session_id, case_id, prompt, conversation_script[], agent_url, max_user_turns?, timeout_s?

Stdout: human logs; final line block:
  ---EVAL_DRIVER_RESULT---
  { ... DriverResult JSON ... }
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from dataclasses import dataclass, field
from typing import Any, Literal

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from deps import AGENT_ID_EVAL

DEFAULT_AGENT_URL = "http://localhost:8000"
RESULT_MARKER = "---EVAL_DRIVER_RESULT---"


def new_message_id() -> str:
    return f"m-{uuid.uuid4().hex[:12]}"


def user_message(text: str) -> dict[str, Any]:
    return {
        "id": new_message_id(),
        "role": "user",
        "parts": [{"type": "text", "text": text}],
    }


def parse_sse_event(line: str) -> dict[str, Any] | None:
    line = line.strip()
    if not line.startswith("data:"):
        return None
    payload = line[5:].strip()
    if not payload or payload == "[DONE]":
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


@dataclass
class ToolCallState:
    tool_call_id: str
    tool_name: str
    input: Any | None = None
    output: Any | None = None
    error_text: str | None = None


@dataclass
class TurnBuilder:
    text_parts: dict[str, str] = field(default_factory=dict)
    reasoning_parts: dict[str, str] = field(default_factory=dict)
    tools: dict[str, ToolCallState] = field(default_factory=dict)
    order: list[tuple[str, str]] = field(default_factory=list)

    def _append_order(self, kind: str, key: str) -> None:
        if not any(existing == (kind, key) for existing in self.order):
            self.order.append((kind, key))

    def handle_event(self, event: dict[str, Any]) -> str | None:
        """Apply one SSE event. Returns specId when save_rui succeeds."""
        event_type = event.get("type")
        spec_id: str | None = None

        if event_type == "text-start":
            text_id = str(event["id"])
            self.text_parts.setdefault(text_id, "")
            self._append_order("text", text_id)
        elif event_type == "text-delta":
            text_id = str(event["id"])
            self.text_parts.setdefault(text_id, "")
            self._append_order("text", text_id)
            self.text_parts[text_id] += str(event.get("delta") or "")
        elif event_type == "text-end":
            text_id = str(event["id"])
            self.text_parts.setdefault(text_id, "")
            self._append_order("text", text_id)
        elif event_type == "reasoning-start":
            reasoning_id = str(event["id"])
            self.reasoning_parts.setdefault(reasoning_id, "")
            self._append_order("reasoning", reasoning_id)
        elif event_type == "reasoning-delta":
            reasoning_id = str(event["id"])
            self.reasoning_parts.setdefault(reasoning_id, "")
            self._append_order("reasoning", reasoning_id)
            self.reasoning_parts[reasoning_id] += str(event.get("delta") or "")
        elif event_type == "reasoning-end":
            reasoning_id = str(event["id"])
            self.reasoning_parts.setdefault(reasoning_id, "")
            self._append_order("reasoning", reasoning_id)
        elif event_type == "tool-input-start":
            tool_call_id = str(event["toolCallId"])
            tool_name = str(event.get("toolName") or "unknown")
            self.tools[tool_call_id] = ToolCallState(tool_call_id, tool_name)
            self._append_order("tool", tool_call_id)
        elif event_type == "tool-input-available":
            tool_call_id = str(event["toolCallId"])
            tool_name = str(event.get("toolName") or "unknown")
            state = self.tools.get(tool_call_id)
            if state is None:
                state = ToolCallState(tool_call_id, tool_name)
                self.tools[tool_call_id] = state
                self._append_order("tool", tool_call_id)
            state.tool_name = tool_name
            state.input = event.get("input")
        elif event_type == "tool-output-available":
            tool_call_id = str(event["toolCallId"])
            state = self.tools.get(tool_call_id)
            if state is None:
                state = ToolCallState(tool_call_id, "unknown")
                self.tools[tool_call_id] = state
                self._append_order("tool", tool_call_id)
            output = event.get("output")
            state.output = output
            if state.tool_name == "save_rui" and isinstance(output, dict):
                maybe_spec = output.get("specId")
                if isinstance(maybe_spec, str) and maybe_spec:
                    spec_id = maybe_spec
        elif event_type == "tool-output-error":
            tool_call_id = str(event["toolCallId"])
            state = self.tools.get(tool_call_id)
            if state is None:
                state = ToolCallState(tool_call_id, "unknown")
                self.tools[tool_call_id] = state
                self._append_order("tool", tool_call_id)
            state.error_text = str(event.get("errorText") or "tool error")

        return spec_id

    def build_assistant_message(self) -> dict[str, Any]:
        parts: list[dict[str, Any]] = []

        for kind, key in self.order:
            if kind == "text":
                text = self.text_parts.get(key, "")
                if text:
                    parts.append({"type": "text", "text": text, "state": "done"})
            elif kind == "reasoning":
                text = self.reasoning_parts.get(key, "")
                if text:
                    parts.append({"type": "reasoning", "text": text, "state": "done"})
            elif kind == "tool":
                tool = self.tools[key]
                part: dict[str, Any] = {
                    "type": f"tool-{tool.tool_name}",
                    "toolCallId": tool.tool_call_id,
                    "input": tool.input,
                }
                if tool.error_text:
                    part["state"] = "output-error"
                    part["errorText"] = tool.error_text
                else:
                    part["state"] = "output-available"
                    part["output"] = tool.output
                parts.append(part)

        if not parts:
            parts.append({"type": "text", "text": "", "state": "done"})

        return {
            "id": new_message_id(),
            "role": "assistant",
            "parts": parts,
        }


def stream_chat_turn(
    client: httpx.Client,
    *,
    url: str,
    session_id: str,
    case_id: str,
    messages: list[dict[str, Any]],
    timeout_s: float,
) -> tuple[dict[str, Any], str | None, str | None]:
    """POST /chat once; return (assistant_message, spec_id, error)."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "X-RapidUI-Session-Id": session_id,
        "X-RapidUI-Agent": AGENT_ID_EVAL,
        "X-RapidUI-Eval-Case": case_id,
    }

    body = {
        "trigger": "submit-message",
        "id": f"eval-{uuid.uuid4().hex[:8]}",
        "messages": messages,
    }

    builder = TurnBuilder()
    spec_id: str | None = None
    stream_error: str | None = None

    try:
        with client.stream(
            "POST",
            url,
            headers=headers,
            json=body,
            timeout=timeout_s,
        ) as response:
            response.raise_for_status()
            for raw_line in response.iter_lines():
                event = parse_sse_event(raw_line)
                if event is None:
                    continue
                if event.get("type") == "error":
                    stream_error = str(event.get("errorText") or "stream error")
                maybe_spec = builder.handle_event(event)
                if maybe_spec:
                    spec_id = maybe_spec
    except httpx.HTTPError as exc:
        return builder.build_assistant_message(), None, str(exc)

    return builder.build_assistant_message(), spec_id, stream_error


DriverStatus = Literal["saved", "failed", "abandoned", "error"]


def run_guided_eval(config: dict[str, Any]) -> dict[str, Any]:
    session_id = str(config["session_id"])
    case_id = str(config["case_id"])
    prompt = str(config["prompt"])
    script: list[dict[str, Any]] = list(config.get("conversation_script") or [])
    agent_url = str(config.get("agent_url") or DEFAULT_AGENT_URL).rstrip("/")
    chat_url = f"{agent_url}/chat"
    max_user_turns = config.get("max_user_turns")
    timeout_s = float(config.get("timeout_s") or 300)

    messages: list[dict[str, Any]] = [user_message(prompt)]
    user_turns = 1
    script_index = 0
    spec_id: str | None = None
    terminal_error: str | None = None
    status: DriverStatus = "abandoned"

    with httpx.Client() as client:
        try:
            health = client.get(f"{agent_url}/health", timeout=10.0)
            health.raise_for_status()
        except httpx.HTTPError as exc:
            return {
                "sessionId": session_id,
                "caseId": case_id,
                "status": "error",
                "specId": None,
                "userTurns": user_turns,
                "error": f"agent health check failed: {exc}",
                "messages": messages,
            }

        while True:
            if isinstance(max_user_turns, int) and user_turns > max_user_turns:
                terminal_error = f"maxUserTurns exceeded ({max_user_turns})"
                status = "abandoned"
                break

            assistant_message, turn_spec_id, turn_error = stream_chat_turn(
                client,
                url=chat_url,
                session_id=session_id,
                case_id=case_id,
                messages=messages,
                timeout_s=timeout_s,
            )
            messages.append(assistant_message)

            if turn_error:
                terminal_error = turn_error
                status = "failed"
                break

            if turn_spec_id:
                spec_id = turn_spec_id
                status = "saved"
                break

            if script_index >= len(script):
                status = "abandoned"
                terminal_error = "conversationScript exhausted without save"
                break

            entry = script[script_index]
            if entry.get("trigger") != "after_agent_reply":
                terminal_error = f"unsupported script trigger: {entry.get('trigger')}"
                status = "error"
                break

            content = entry.get("content")
            if not isinstance(content, str) or not content.strip():
                terminal_error = "conversationScript entry missing content"
                status = "error"
                break

            messages.append(user_message(content))
            user_turns += 1
            script_index += 1

    return {
        "sessionId": session_id,
        "caseId": case_id,
        "status": status,
        "specId": spec_id,
        "userTurns": user_turns,
        "error": terminal_error,
        "messages": messages,
    }


def emit_result(result: dict[str, Any]) -> None:
    print(RESULT_MARKER)
    print(json.dumps(result, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="RapidUI guided eval driver")
    parser.add_argument("--config", required=True, help="Path to driver config JSON")
    args = parser.parse_args()

    with open(args.config, encoding="utf-8") as handle:
        config = json.load(handle)

    result = run_guided_eval(config)
    emit_result(result)

    if result["status"] == "saved":
        return 0
    if result["status"] == "error":
        return 2
    return 1


if __name__ == "__main__":
    sys.exit(main())
