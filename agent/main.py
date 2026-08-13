from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic_ai.run import AgentRunResult
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from starlette.responses import Response

from agent_factory import create_agent
from config import apply_settings_env, get_settings, parse_model, require_openai_api_key
from deps import build_deps
from telemetry import handle_turn_complete, post_terminal_outcome

logger = logging.getLogger(__name__)

try:
    import logfire
except ImportError:  # pragma: no cover
    logfire = None  # type: ignore[assignment]

_logfire_enabled = False


def setup_logfire(app: FastAPI) -> bool:
    """Configure Logfire after Settings/env are loaded (lifespan, not import time)."""
    global _logfire_enabled
    if _logfire_enabled:
        return True
    if logfire is None or not os.getenv("LOGFIRE_TOKEN"):
        return False
    logfire.configure(service_name="rapidui-agent")
    logfire.instrument_pydantic_ai()
    logfire.instrument_httpx()
    logfire.instrument_fastapi(app)
    _logfire_enabled = True
    logger.info("Logfire instrumentation enabled")
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    apply_settings_env(settings)
    require_openai_api_key(settings)
    setup_logfire(app)
    timeout = httpx.Timeout(settings.http_timeout_seconds)
    app.state.http = httpx.AsyncClient(timeout=timeout)
    app.state.agent = create_agent(settings)
    app.state.settings = settings
    try:
        yield
    finally:
        await app.state.http.aclose()


app = FastAPI(title="RapidUI Agent", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rapidui.dev",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict[str, str]:
    _, model_name = parse_model(get_settings().rapidui_agent_model)
    return {"status": "ok", "model": model_name}


@app.post("/chat")
async def chat(request: Request) -> Response:
    session_id = (request.headers.get("X-RapidUI-Session-Id") or "").strip()
    if not session_id:
        return JSONResponse(
            status_code=400,
            content={
                "error": "MISSING_SESSION_ID",
                "message": (
                    "X-RapidUI-Session-Id is required on POST /chat. "
                    "Generate once per session and send on every chat request."
                ),
            },
        )

    settings = request.app.state.settings
    http = request.app.state.http
    agent = request.app.state.agent

    try:
        deps = build_deps(request, settings, http)
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={
                "error": "MISSING_SESSION_ID",
                "message": "X-RapidUI-Session-Id is required on POST /chat.",
            },
        )

    turn_started = time.perf_counter()

    async def on_complete(result: AgentRunResult) -> None:
        try:
            await handle_turn_complete(deps, settings, result, turn_started)
        except Exception:
            logger.exception("Turn telemetry failed session_id=%s", deps.session_id)

    try:
        if _logfire_enabled:
            with logfire.span(
                "rapidui.chat",
                session_id=deps.session_id,
                prompt_version=settings.rapidui_agent_prompt_version,
            ):
                return await VercelAIAdapter.dispatch_request(
                    request,
                    agent=agent,
                    sdk_version=6,
                    deps=deps,
                    on_complete=on_complete,
                )

        return await VercelAIAdapter.dispatch_request(
            request,
            agent=agent,
            sdk_version=6,
            deps=deps,
            on_complete=on_complete,
        )
    except Exception as exc:
        logger.exception("Chat handler failed session_id=%s", deps.session_id)
        state = deps.session_state
        if not state.turn_had_save and not state.last_spec_id:
            state.terminal_failure = True
            if not state.last_error_summary:
                state.last_error_summary = str(exc)[:500]
            try:
                await post_terminal_outcome(
                    deps,
                    settings,
                    "failed",
                    error_summary=state.last_error_summary,
                )
            except Exception:
                logger.exception(
                    "Failed terminal ingest session_id=%s", deps.session_id
                )
        raise
