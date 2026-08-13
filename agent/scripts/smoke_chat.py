#!/usr/bin/env python3
"""Smoke tests for RapidUI Agent (Phase 4).

Usage (from agent/ with venv active):
  python scripts/smoke_chat.py
  AGENT_URL=http://localhost:8000 python scripts/smoke_chat.py

Optional live chat (requires OPENAI_API_KEY + running platform at RAPIDUI_BASE_URL):
  RUN_LIVE_CHAT=1 python scripts/smoke_chat.py
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from urllib import error, request


def http(method: str, url: str, *, headers: dict[str, str] | None = None, body: dict | None = None) -> tuple[int, str]:
    data = None
    req_headers = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")
    req = request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8")
    except error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8")


def main() -> int:
    base = os.environ.get("AGENT_URL", "http://localhost:8000").rstrip("/")
    failures = 0

    status, body = http("GET", f"{base}/health")
    if status != 200 or '"ok"' not in body:
        print(f"FAIL health status={status} body={body[:200]}")
        failures += 1
    else:
        print("OK  GET /health")
        try:
            payload = json.loads(body)
            model = payload.get("model")
            if model:
                print(f"    model={model}")
        except json.JSONDecodeError:
            pass

    status, body = http(
        "POST",
        f"{base}/chat",
        body={
            "trigger": "submit-message",
            "id": "smoke-1",
            "messages": [
                {
                    "id": "m1",
                    "role": "user",
                    "parts": [{"type": "text", "text": "hello"}],
                }
            ],
        },
    )
    if status != 400 or "MISSING_SESSION_ID" not in body:
        print(f"FAIL session gate status={status} body={body[:200]}")
        failures += 1
    else:
        print("OK  POST /chat rejects missing session")

    if os.environ.get("RUN_LIVE_CHAT") == "1":
        if not os.environ.get("OPENAI_API_KEY"):
            print("SKIP live chat — OPENAI_API_KEY not set")
        else:
            session_id = str(uuid.uuid4())
            status, body = http(
                "POST",
                f"{base}/chat",
                headers={"X-RapidUI-Session-Id": session_id},
                body={
                    "trigger": "submit-message",
                    "id": "smoke-live",
                    "messages": [
                        {
                            "id": "m-live",
                            "role": "user",
                            "parts": [
                                {
                                    "type": "text",
                                    "text": (
                                        "Build a static browse dashboard for open incidents "
                                        "with a status filter — no API wiring."
                                    ),
                                }
                            ],
                        }
                    ],
                },
            )
            if status != 200:
                print(f"FAIL live chat status={status} body={body[:300]}")
                failures += 1
            elif "data:" not in body and "error" in body.lower():
                print(f"FAIL live chat stream body={body[:300]}")
                failures += 1
            else:
                print("OK  POST /chat live stream (check platform + ingest manually)")

    if failures:
        print(f"\n{failures} smoke check(s) failed")
        return 1

    print("\nAll smoke checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
