from __future__ import annotations

from typing import Annotated, Any

import httpx
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

from deps import Deps, rapidui_headers

MAX_VALIDATION_ERRORS = 20


class ValidationErrorItem(BaseModel):
    path: str = ""
    code: str
    message: str
    hint: str | None = None


class ValidateRuiResult(BaseModel):
    valid: bool
    errors: list[ValidationErrorItem] | None = None
    normalizedRui: dict[str, Any] | None = None


class SaveRuiResult(BaseModel):
    specId: str
    viewUrl: str
    url: str


async def _rapidui_request(
    ctx: RunContext[Deps],
    method: str,
    path: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> httpx.Response:
    url = f"{ctx.deps.base_url}{path}"
    headers = {
        **rapidui_headers(ctx.deps),
        "Accept": "application/json",
    }
    if json_body is not None:
        headers["Content-Type"] = "application/json"

    timeout = ctx.deps.settings.http_timeout_seconds
    return await ctx.deps.http.request(
        method,
        url,
        headers=headers,
        json=json_body,
        timeout=timeout,
    )


def register_rapidui_tools(agent: Agent[Deps, str]) -> None:
    @agent.tool
    async def fetch_docs(ctx: RunContext[Deps]) -> dict[str, Any]:
        """Fetch RapidUI agent documentation (workflow, API overview, telemetry rules)."""
        response = await _rapidui_request(ctx, "GET", "/api/docs")
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            return {"raw": payload}
        return payload

    @agent.tool
    async def fetch_schema(ctx: RunContext[Deps]) -> dict[str, Any]:
        """Fetch the RUI v0.2 schema vocabulary (operation types, layouts, flow patterns)."""
        response = await _rapidui_request(ctx, "GET", "/api/schema")
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            return {"raw": payload}
        return payload

    @agent.tool
    async def validate_rui(
        ctx: RunContext[Deps],
        rui: Annotated[
            dict[str, Any],
            Field(description="Complete RUI v0.2 document to validate."),
        ],
    ) -> ValidateRuiResult:
        """Validate an RUI document against RapidUI semantic rules. Fix reported errors and retry."""
        ctx.deps.session_state.mark_validate()
        response = await _rapidui_request(
            ctx,
            "POST",
            "/api/validate",
            json_body=rui,
        )

        try:
            payload = response.json()
        except ValueError as exc:
            ctx.deps.session_state.last_error_summary = f"Non-JSON validate response: {exc}"
            raise

        if not isinstance(payload, dict):
            ctx.deps.session_state.last_error_summary = "Unexpected validate response shape"
            return ValidateRuiResult(valid=False, errors=[])

        if response.status_code >= 400 and "validationVersion" not in payload:
            message = str(payload.get("message", response.text[:200]))
            ctx.deps.session_state.last_error_summary = message
            return ValidateRuiResult(
                valid=False,
                errors=[
                    ValidationErrorItem(
                        code=str(payload.get("error", "TRANSPORT_ERROR")),
                        message=message,
                    )
                ],
            )

        if payload.get("valid") is True:
            ctx.deps.session_state.last_error_summary = None
            normalized = payload.get("normalizedRui")
            return ValidateRuiResult(
                valid=True,
                normalizedRui=normalized if isinstance(normalized, dict) else None,
            )

        raw_errors = payload.get("errors") or []
        errors: list[ValidationErrorItem] = []
        codes: list[str] = []
        if isinstance(raw_errors, list):
            for item in raw_errors[:MAX_VALIDATION_ERRORS]:
                if not isinstance(item, dict):
                    continue
                code = str(item.get("code", "VALIDATION_ERROR"))
                codes.append(code)
                errors.append(
                    ValidationErrorItem(
                        path=str(item.get("path", "")),
                        code=code,
                        message=str(item.get("message", "")),
                        hint=item.get("hint"),
                    )
                )

        ctx.deps.session_state.last_error_summary = ", ".join(codes[:5]) if codes else "validation failed"
        return ValidateRuiResult(valid=False, errors=errors or None)

    @agent.tool
    async def save_rui(
        ctx: RunContext[Deps],
        rui: Annotated[
            dict[str, Any],
            Field(description="Valid RUI v0.2 document to persist."),
        ],
    ) -> SaveRuiResult:
        """Save a validated RUI to RapidUI storage. Returns specId and viewUrl for the user."""
        response = await _rapidui_request(
            ctx,
            "POST",
            "/api/specs",
            json_body=rui,
        )

        try:
            payload = response.json()
        except ValueError as exc:
            ctx.deps.session_state.last_error_summary = f"Non-JSON save response: {exc}"
            raise

        if response.status_code == 201 and isinstance(payload, dict):
            spec_id = str(payload.get("specId", ""))
            view_url = str(payload.get("viewUrl", ""))
            url = str(payload.get("url", ""))
            if spec_id:
                ctx.deps.session_state.mark_save(spec_id)
                ctx.deps.session_state.last_error_summary = None
            return SaveRuiResult(specId=spec_id, viewUrl=view_url, url=url)

        if isinstance(payload, dict):
            if payload.get("valid") is False:
                raw_errors = payload.get("errors") or []
                codes = [
                    str(item.get("code", ""))
                    for item in raw_errors
                    if isinstance(item, dict)
                ]
                ctx.deps.session_state.last_error_summary = (
                    ", ".join(c for c in codes if c) or "save validation failed"
                )
            else:
                ctx.deps.session_state.last_error_summary = str(
                    payload.get("message", payload.get("error", "save failed"))
                )

        response.raise_for_status()
        raise RuntimeError("Unexpected save response")
