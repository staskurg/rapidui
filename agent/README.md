# RapidUI Agent

FastAPI + Pydantic AI chat service for RapidUI v0.2. Deployed on **Render** at `agent.rapidui.dev`.

The agent generates operations-first RUI specs by calling the **public RapidUI API** (`fetch_docs`, `fetch_schema`, `validate_rui`, `save_rui`) — the same workflow external agents use from a terminal.

**Python:** pin **3.12.13** locally and on Render (`agent/.python-version`, `PYTHON_VERSION=3.12.13`).

**Important:** create the venv inside `agent/` only — never at the repo root.

## Local development

```bash
cd agent
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Required for the LLM (OpenAI — not a separate Pydantic AI account)
export OPENAI_API_KEY=sk-...

# Platform API base (local Next.js or prod)
export RAPIDUI_BASE_URL=http://localhost:3000

uvicorn main:app --reload --port 8000
```

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok"}

python scripts/smoke_chat.py
```

Optional live chat smoke (needs `OPENAI_API_KEY` + platform running):

```bash
RUN_LIVE_CHAT=1 python scripts/smoke_chat.py
```

Interactive terminal chat (multi-turn, readable output — no raw SSE):

```bash
python scripts/chat_cli.py
# or: npm run chat:agent
```

Uses `AGENT_URL` (default `http://localhost:8000`). Sends `X-RapidUI-Agent: rapidui-agent-cli`. Session id is printed on start; `/new` starts fresh. Optional env: `RAPIDUI_SESSION_ID`, `RAPIDUI_INTENT`.

### Guided eval driver (Phase 7.3)

Automated Path A runs use `scripts/eval_driver.py` — **not** `chat_cli.py`. The driver preserves full Vercel AI v6 assistant message parts (text, reasoning, `tool-*` with input/output) so multi-turn validate/save loops work.

| Item | Value |
|------|-------|
| Script | `python scripts/eval_driver.py --config /path/to/config.json` |
| Orchestrator | `npm run eval:run` from repo root (spawns driver, scores, posts terminal outcomes) |
| Agent header | `X-RapidUI-Agent: rapidui-agent-eval` |
| Eval case header | `X-RapidUI-Eval-Case: <caseId>` |
| Output | stderr logs + stdout `---EVAL_DRIVER_RESULT---` JSON block |

**Do not use `chat_cli.py` as the eval base** — it drops tool parts and breaks scripted multi-turn runs.

Example (repo root, agent + platform running):

```bash
npm run eval:run -- --case=static-browse-v0.2
npm run eval:run -- --all-cases
npm run eval:run -- --case=static-browse-v0.2 --dry-run   # validate case only
```

Requires `OPENAI_API_KEY`, local agent (`uvicorn`), and platform (`npm run dev`) with `DATABASE_URL` in `.env.local`.

## POST /chat

| Item | Value |
|------|-------|
| URL | `http://localhost:8000/chat` (prod: `https://agent.rapidui.dev/chat`) |
| Protocol | Vercel AI Data Stream (SSE), SDK v6 |
| Required header | `X-RapidUI-Session-Id` — UUID per browser/eval session |
| Recommended | `X-RapidUI-Agent` — identifies caller in Observe (see below) |
| Optional | `X-RapidUI-Eval-Case`, `X-RapidUI-Intent` |

Missing session → **400** `{ "error": "MISSING_SESSION_ID", ... }`.

### Agent identity (`X-RapidUI-Agent`)

Recommended on every `POST /chat`; forwarded to all RapidUI API tool calls for Observe breakdown:

| Value | When |
|-------|------|
| `rapidui-agent-cli` | Terminal `scripts/chat_cli.py` / `npm run chat:agent` |
| `rapidui-agent-chat` | Phase 5 main UI (`assistant-ui` → `/chat`) |
| `rapidui-agent-eval` | Automated eval / matrix runs |
| `rapidui-agent` | Default if header omitted (curl, smoke) |

External agents (Claude, Cursor, Codex, etc.) use their own ids per platform docs.

Example request body (Vercel AI v6):

```json
{
  "trigger": "submit-message",
  "id": "chat-1",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "parts": [{ "type": "text", "text": "Build a static incidents browse table." }]
    }
  ]
}
```

Example curl:

```bash
SESSION_ID=$(uuidgen)
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -H "X-RapidUI-Session-Id: $SESSION_ID" \
  -d '{
    "trigger": "submit-message",
    "id": "1",
    "messages": [{
      "id": "m1",
      "role": "user",
      "parts": [{"type": "text", "text": "Build a static incidents browse table."}]
    }]
  }'
```

Phase 5 main UI (`assistant-ui`) sends the same headers and protocol to this endpoint — see [Phase 5 frontend transport](#phase-5-frontend-transport) below.

## Security and trust model

Pydantic AI UI adapters treat the Vercel AI `messages` array as **client-controlled** — assistant turns, tool calls, and tool results in the request body can be forged. See [Pydantic AI trust model](https://ai.pydantic.dev/ui/overview/#trust-model-for-client-submitted-messages).

| v0.2 approach | Notes |
|---------------|-------|
| **`X-RapidUI-Session-Id` required** | Correlates agent + platform + Observe; not cryptographic auth |
| **No server-side chat history** | Full history is sent by the client each turn (standard Vercel AI protocol) |
| **Agent instructions server-owned** | `prompts/v1.txt` is loaded via `Agent(instructions=...)` — injected fresh each turn, never taken from client messages |
| **CORS** | Limits browser origins to `rapidui.dev` and `localhost:3000` |

**Before production hardening (v0.3+):** authenticate `/chat` (or run it behind an authenticated BFF), and/or persist message history server-side keyed by session id and pass it via `message_history` instead of trusting client-supplied turns.

## Phase 5 frontend transport

AI SDK v6 requires custom headers on the **transport**, not on deprecated hook-level options. Phase 5 (`assistant-ui` + `@assistant-ui/react-ai-sdk`) should point at this service with `DefaultChatTransport`:

```tsx
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { DefaultChatTransport } from 'ai';

const sessionId =
  sessionStorage.getItem('rapidui-session-id') ??
  (() => {
    const id = crypto.randomUUID();
    sessionStorage.setItem('rapidui-session-id', id);
    return id;
  })();

const runtime = useChatRuntime({
  transport: new DefaultChatTransport({
    api: 'https://agent.rapidui.dev/chat', // local: http://localhost:8000/chat
    headers: {
      'X-RapidUI-Session-Id': sessionId,
      'X-RapidUI-Agent': 'rapidui-agent-chat',
    },
  }),
});
```

Per-request overrides (eval case, intent) can be passed as the second argument to `sendMessage` or via a function-valued `headers` / `body` on the transport. Docs: [AI SDK transport](https://ai-sdk.dev/docs/ai-sdk-ui/transport), [custom request options](https://ai-sdk.dev/docs/troubleshooting/use-chat-custom-request-options).

## Tools (HTTP only — no MCP)

| Tool | RapidUI API |
|------|-------------|
| `fetch_docs` | `GET /api/docs` |
| `fetch_schema` | `GET /api/schema` |
| `validate_rui` | `POST /api/validate` |
| `save_rui` | `POST /api/specs` |

All tool calls include `X-RapidUI-Session-Id` and the request's `X-RapidUI-Agent` (default `rapidui-agent`).

## Telemetry

The LLM never calls Observe. After each chat turn, the FastAPI handler POSTs summaries to:

`POST {RAPIDUI_BASE_URL}/api/observe/ingest/agent`

Contract: [lib/observe/INGEST.md](../lib/observe/INGEST.md)

On each completed turn the handler POSTs `turns[]` plus partial `run` fields. Terminal outcomes:

| Outcome | Trigger |
|---------|---------|
| `saved` | Turn completes with successful `save_rui` — sets `spec_id`, tokens, run latency |
| `failed` | Unrecoverable transport/tool error or uncaught handler exception (no save) |
| `abandoned` | Main UI New chat (prior session) or eval runner timeout |

Failed validate retries alone do **not** emit `failed` — the agent is expected to fix and retry.

**Observe session state (2026-08-10):** Agent Observe uses a single derived **`AgentSessionState`** (`saved` · `draft` · `active` · `failed` · `abandoned`) — see [chat-agent-v1.2-plan.md](../.cursor/chat-agent-v1.2-plan.md#observe-session-state-reference--locked). **`failed`** = explicit terminal ingest only, not failed validate retries. **`draft`** = passing validate, no save (v1.2 funnel). Ingest still writes `saved` / `failed` / `abandoned` to `agent_runs.outcome`; save signal authoritative from `api_events`.

**Legacy (superseded when WS2A ships):** sessions with no DB outcome and last activity **> 30 minutes** ago were shown as **Abandoned (inferred)** — only when no chat transcript was stored. Sessions with `transcript_jsonb` stayed **In progress** until explicit terminal outcome. That model is replaced by session state above.

FastAPI disconnect detection is deferred to v0.3 — rely on New chat abandon + derived session state (WS2A).

### Chat transcript API (Next.js)

Full conversation replay for live `/chat` sessions is stored separately from agent ingest — **`GET/PUT /api/chat/sessions/{sessionId}/transcript`** on the Next.js app. See [lib/chat/TRANSCRIPT.md](../lib/chat/TRANSCRIPT.md) for the contract, message shape, and client persistence rules.

### o4-mini token accounting

`result.usage.input_tokens`, `output_tokens`, and `cache_read_tokens` from pydantic-ai are ingested per turn. Observe prices cached input at $0.275/1M (o4-mini); legacy turns without `cache_read_tokens` show list-price estimates (~ prefix, upper bound). For o4-mini, reasoning tokens may be included in output counts depending on provider reporting.

### Single-instance policy (v0.2)

Run **one uvicorn worker / one Render instance** for prod and demo. A process restart clears in-memory `SessionState` (`turn_index`, advisory validate counts). Durable validate and platform API call counts come from `api_events` in Observe.

### Logfire (optional O2)

[Logfire](https://logfire.pydantic.dev/) captures deep engineering traces (model spans, tool calls, httpx latency to `rapidui.dev`) separately from Observe product metrics. Instrumentation is env-gated — no token means zero overhead.

**Setup:**

1. In the Logfire UI: **Project Settings → Write Tokens** → create a token.
2. Local: add to `agent/.env` (preferred) or export in your shell:
   ```bash
   LOGFIRE_TOKEN=lf_...
   ```
3. Render: add `LOGFIRE_TOKEN` to the agent service env vars and redeploy.
4. Restart uvicorn. Startup log should include `Logfire instrumentation enabled`.
5. Run a chat turn, then open Logfire **Live** — look for `rapidui.chat` spans with `session_id` and nested Pydantic AI / httpx spans.

Custom attributes on chat requests: `session_id`, `prompt_version` (correlate with Observe by session id).

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key (powers `o4-mini` via Pydantic AI) |
| `RAPIDUI_BASE_URL` | Yes | `http://localhost:3000` | Platform base URL |
| `RAPIDUI_AGENT_MODEL` | No | `openai:o4-mini` | Pydantic AI model string |
| `RAPIDUI_AGENT_PROMPT_VERSION` | No | `v1` | Loads `prompts/{version}.txt` into `Agent(instructions=...)` |
| `RAPIDUI_ENV` | No | `local` | Ingest env tag on `agent_runs` (`local` \| `prod`) — set `prod` on Render |
| `LOGFIRE_TOKEN` | No | — | Enables Logfire OTel instrumentation |

The agent does **not** connect to Neon directly in v0.2.

## Render deployment

| Setting | Value |
|---------|-------|
| Root directory | `agent/` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Workers** | **1** — in-memory session state; see Telemetry § single-instance |
| **Python version** | **3.12.13** — env `PYTHON_VERSION=3.12.13` |

Production env:

- `OPENAI_API_KEY`
- `RAPIDUI_BASE_URL=https://rapidui.dev`
- Optional: `LOGFIRE_TOKEN`, `RAPIDUI_AGENT_MODEL`, `RAPIDUI_AGENT_PROMPT_VERSION`

### DNS

CNAME `agent.rapidui.dev` → Render service hostname.

### CORS

Allowed origins: `https://rapidui.dev`, `http://localhost:3000`.

## Module layout

```txt
agent/
  main.py           FastAPI app, /health, /chat
  config.py         Env settings + prompt loader
  deps.py           Session deps + in-memory session state
  agent_factory.py  Pydantic AI agent + o4-mini settings
  tools/rapidui.py  fetch_docs, fetch_schema, validate_rui, save_rui
  telemetry.py      Ingest POST after each turn
  prompts/v1.txt    Agent instructions (workflow only — no schema URLs)
  scripts/smoke_chat.py
  scripts/chat_cli.py   # interactive terminal chat (alternative to /chat UI)
```
