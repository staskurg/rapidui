from __future__ import annotations

import time
from dataclasses import dataclass, field

import httpx
from starlette.requests import Request

from config import Settings


def trim_header(value: str | None) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    return trimmed if trimmed else None


@dataclass
class SessionState:
    validate_attempts: int = 0
    last_spec_id: str | None = None
    turn_index: int = 0
    turn_had_validate: bool = False
    turn_had_save: bool = False
    terminal_failure: bool = False
    last_error_summary: str | None = None
    session_started_at: float = field(default_factory=time.time)
    total_input_tokens: int = 0
    total_output_tokens: int = 0

    def begin_turn(self) -> None:
        self.turn_had_validate = False
        self.turn_had_save = False
        self.terminal_failure = False

    def mark_validate(self) -> None:
        self.validate_attempts += 1
        self.turn_had_validate = True

    def mark_save(self, spec_id: str) -> None:
        self.last_spec_id = spec_id
        self.turn_had_save = True


_session_states: dict[str, SessionState] = {}
# Process-local only — a uvicorn restart resets turn_index and advisory counters.
# Derive durable validate/platform counts from api_events (Observe Phase 6).


def get_session_state(session_id: str) -> SessionState:
    if session_id not in _session_states:
        _session_states[session_id] = SessionState()
    return _session_states[session_id]


DEFAULT_AGENT_ID = "rapidui-agent"
AGENT_ID_CLI = "rapidui-agent-cli"
AGENT_ID_CHAT = "rapidui-agent-chat"
AGENT_ID_EVAL = "rapidui-agent-eval"


@dataclass
class Deps:
    """Per-request dependencies for agent tools and telemetry.

    Use ``session_state`` (not ``state``) — pydantic-ai UI adapters treat any
    dataclass with a ``state`` field as ``StateHandler`` and overwrite it from
    the client request body.
    """

    session_id: str
    base_url: str
    http: httpx.AsyncClient
    settings: Settings
    session_state: SessionState
    agent_id: str = DEFAULT_AGENT_ID
    eval_case_id: str | None = None
    intent: str | None = None


def rapidui_headers(deps: Deps) -> dict[str, str]:
    headers = {
        "X-RapidUI-Session-Id": deps.session_id,
        "X-RapidUI-Agent": deps.agent_id,
    }
    if deps.eval_case_id:
        headers["X-RapidUI-Eval-Case"] = deps.eval_case_id
    if deps.intent:
        headers["X-RapidUI-Intent"] = deps.intent
    return headers


def build_deps(request: Request, settings: Settings, http: httpx.AsyncClient) -> Deps:
    session_id = trim_header(request.headers.get("X-RapidUI-Session-Id"))
    if not session_id:
        raise ValueError("MISSING_SESSION_ID")

    state = get_session_state(session_id)
    state.begin_turn()

    agent_id = trim_header(request.headers.get("X-RapidUI-Agent")) or DEFAULT_AGENT_ID

    return Deps(
        session_id=session_id,
        base_url=settings.rapidui_base_url.rstrip("/"),
        http=http,
        settings=settings,
        session_state=state,
        agent_id=agent_id,
        eval_case_id=trim_header(request.headers.get("X-RapidUI-Eval-Case")),
        intent=trim_header(request.headers.get("X-RapidUI-Intent")),
    )
