#!/usr/bin/env python3
"""Interactive terminal chat with the RapidUI agent (Vercel AI SSE).

Usage (from agent/ with venv active, agent + platform running):
  python scripts/chat_cli.py
  AGENT_URL=http://localhost:8000 python scripts/chat_cli.py

Commands during chat:
  /quit, /exit  — leave
  /session      — print current session id
  /new          — new session id (clears in-memory history)
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from typing import Any

import httpx

DEFAULT_AGENT_URL = "http://localhost:8000"


def new_message_id() -> str:
    return f"m-{uuid.uuid4().hex[:12]}"


def user_message(text: str) -> dict[str, Any]:
    return {
        "id": new_message_id(),
        "role": "user",
        "parts": [{"type": "text", "text": text}],
    }


def assistant_message(text: str) -> dict[str, Any]:
    return {
        "id": new_message_id(),
        "role": "assistant",
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


def stream_chat(
    client: httpx.Client,
    *,
    url: str,
    session_id: str,
    messages: list[dict[str, Any]],
) -> tuple[str, list[str]]:
    """POST /chat and return (assistant_text, tool_names)."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "X-RapidUI-Session-Id": session_id,
        "X-RapidUI-Agent": "rapidui-agent-cli",
    }
    intent = os.environ.get("RAPIDUI_INTENT")
    if intent:
        headers["X-RapidUI-Intent"] = intent

    body = {
        "trigger": "submit-message",
        "id": f"cli-{uuid.uuid4().hex[:8]}",
        "messages": messages,
    }

    text_parts: list[str] = []
    tools: list[str] = []
    finish_reason: str | None = None

    with client.stream("POST", url, headers=headers, json=body, timeout=300.0) as response:
        response.raise_for_status()
        for raw_line in response.iter_lines():
            event = parse_sse_event(raw_line)
            if event is None:
                continue

            event_type = event.get("type")
            if event_type == "text-delta":
                delta = event.get("delta") or ""
                text_parts.append(delta)
                print(delta, end="", flush=True)
            elif event_type == "tool-input-available":
                name = event.get("toolName", "?")
                tools.append(name)
                print(f"\n  → tool: {name}", flush=True)
            elif event_type == "tool-output-available":
                output = event.get("output")
                if isinstance(output, dict):
                    if output.get("valid") is False:
                        errors = output.get("errors") or []
                        codes = [
                            str(e.get("code", ""))
                            for e in errors[:3]
                            if isinstance(e, dict)
                        ]
                        hint = ", ".join(c for c in codes if c) or "validation failed"
                        print(f"    ✗ validate: {hint}", flush=True)
                    elif "viewUrl" in output:
                        print(f"    ✓ saved: {output.get('viewUrl')}", flush=True)
                    elif output.get("valid") is True:
                        print("    ✓ valid", flush=True)
            elif event_type == "tool-output-error":
                err = event.get("errorText", "tool error")
                print(f"    ✗ {err}", flush=True)
            elif event_type == "error":
                print(f"\n[error] {event.get('errorText', event)}", flush=True)
            elif event_type == "finish":
                finish_reason = event.get("finishReason")

    if text_parts and not text_parts[-1].endswith("\n"):
        print()
    if finish_reason and finish_reason != "stop":
        print(f"[finish: {finish_reason}]")

    return "".join(text_parts), tools


def main() -> int:
    base = os.environ.get("AGENT_URL", DEFAULT_AGENT_URL).rstrip("/")
    chat_url = f"{base}/chat"
    session_id = os.environ.get("RAPIDUI_SESSION_ID") or str(uuid.uuid4())
    messages: list[dict[str, Any]] = []

    print(f"RapidUI Agent CLI → {chat_url}")
    print(f"Session: {session_id}")
    print("Type a message (/quit to exit, /session, /new)\n")

    with httpx.Client() as client:
        try:
            health = client.get(f"{base}/health", timeout=10.0)
            health.raise_for_status()
        except httpx.HTTPError as exc:
            print(f"Cannot reach agent at {base}/health — {exc}", file=sys.stderr)
            return 1

        while True:
            try:
                user_input = input("you> ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break

            if not user_input:
                continue
            if user_input in {"/quit", "/exit", "/q"}:
                break
            if user_input == "/session":
                print(session_id)
                continue
            if user_input == "/new":
                session_id = str(uuid.uuid4())
                messages.clear()
                print(f"New session: {session_id}")
                continue

            messages.append(user_message(user_input))
            print("agent> ", end="", flush=True)

            try:
                assistant_text, _tools = stream_chat(
                    client,
                    url=chat_url,
                    session_id=session_id,
                    messages=messages,
                )
            except httpx.HTTPError as exc:
                print(f"\n[request failed] {exc}", file=sys.stderr)
                messages.pop()
                continue

            if assistant_text:
                messages.append(assistant_message(assistant_text))
            print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
