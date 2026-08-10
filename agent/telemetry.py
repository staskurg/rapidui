from __future__ import annotations

import logging
import time
from typing import Any, Literal

import httpx
from pydantic_ai.run import AgentRunResult

from config import Settings, parse_model
from deps import Deps, SessionState

logger = logging.getLogger(__name__)

TerminalOutcome = Literal["saved", "failed", "abandoned"]


async def post_ingest(
    base_url: str,
    http: httpx.AsyncClient,
    payload: dict[str, Any],
) -> None:
    url = f"{base_url.rstrip('/')}/api/observe/ingest/agent"
    try:
        response = await http.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30.0,
        )
        if response.status_code >= 400:
            logger.error(
                "Ingest failed status=%s body=%s",
                response.status_code,
                response.text[:500],
            )
    except Exception:
        logger.exception("Ingest request failed")


def _session_wall_latency_ms(state: SessionState) -> int:
    return max(0, int((time.time() - state.session_started_at) * 1000))


def _total_tokens(state: SessionState) -> int:
    return state.total_input_tokens + state.total_output_tokens


def _build_base_run_payload(
    deps: Deps,
    settings: Settings,
    state: SessionState,
) -> dict[str, Any]:
    provider, model_name = parse_model(settings.rapidui_agent_model)
    run_payload: dict[str, Any] = {
        "model": model_name,
        "provider": provider,
        "prompt_version": settings.rapidui_agent_prompt_version,
        "validate_attempts": state.validate_attempts,
        "env": settings.rapidui_env,
    }
    if deps.eval_case_id:
        run_payload["eval_case_id"] = deps.eval_case_id
    if deps.intent:
        run_payload["intent"] = deps.intent
    return run_payload


def _build_terminal_run_payload(
    deps: Deps,
    settings: Settings,
    state: SessionState,
    outcome: TerminalOutcome,
    *,
    error_summary: str | None = None,
) -> dict[str, Any]:
    run_payload = _build_base_run_payload(deps, settings, state)
    run_payload["outcome"] = outcome
    run_payload["total_tokens"] = _total_tokens(state)
    run_payload["latency_ms"] = _session_wall_latency_ms(state)

    if outcome == "saved" and state.last_spec_id:
        run_payload["spec_id"] = state.last_spec_id
    if error_summary:
        run_payload["error_summary"] = error_summary
    elif state.last_error_summary and outcome == "failed":
        run_payload["error_summary"] = state.last_error_summary

    return run_payload


async def post_terminal_outcome(
    deps: Deps,
    settings: Settings,
    outcome: TerminalOutcome,
    *,
    error_summary: str | None = None,
) -> None:
    """Post a terminal run outcome without a completed turn (handler errors, client abandon)."""
    run_payload = _build_terminal_run_payload(
        deps,
        settings,
        deps.session_state,
        outcome,
        error_summary=error_summary,
    )
    await post_ingest(
        deps.base_url,
        deps.http,
        {
            "session_id": deps.session_id,
            "run": run_payload,
        },
    )


async def handle_turn_complete(
    deps: Deps,
    settings: Settings,
    result: AgentRunResult,
    turn_started: float,
) -> None:
    state = deps.session_state
    usage = result.usage
    latency_ms = max(0, int((time.perf_counter() - turn_started) * 1000))

    state.total_input_tokens += usage.input_tokens
    state.total_output_tokens += usage.output_tokens

    turn_index = state.turn_index
    state.turn_index += 1

    turn_payload: dict[str, Any] = {
        "turn_index": turn_index,
        "latency_ms": latency_ms,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "cache_read_tokens": usage.cache_read_tokens,
        "had_validate_call": state.turn_had_validate,
        "had_save": state.turn_had_save,
    }

    run_payload = _build_base_run_payload(deps, settings, state)
    run_payload["total_tokens"] = _total_tokens(state)
    run_payload["latency_ms"] = _session_wall_latency_ms(state)

    if state.turn_had_save and state.last_spec_id:
        run_payload.update(
            _build_terminal_run_payload(deps, settings, state, "saved"),
        )
    elif state.terminal_failure and not state.last_spec_id:
        run_payload.update(
            _build_terminal_run_payload(
                deps,
                settings,
                state,
                "failed",
            ),
        )
    elif state.last_error_summary and not state.last_spec_id:
        run_payload["error_summary"] = state.last_error_summary

    await post_ingest(
        deps.base_url,
        deps.http,
        {
            "session_id": deps.session_id,
            "run": run_payload,
            "turns": [turn_payload],
        },
    )
