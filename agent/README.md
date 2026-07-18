# RapidUI Agent

FastAPI service for the RapidUI v0.2 chat agent. Deployed on **Render** at `agent.rapidui.dev`.

Phase 0 ships **`GET /health`** and CORS only. `POST /chat` (Pydantic AI) lands in Phase 4.

**Python:** pin **3.12** locally and on Render (`agent/.python-version`, `runtime.txt`, `PYTHON_VERSION=3.12.0`).

**Important:** create the venv inside `agent/` only — never at the repo root.

## Local development

```bash
cd agent
python3.12 -m venv .venv    # not plain python3 (macOS default may be 3.9)
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If `python3.12` is missing: `brew install python@3.12`

Verify: `python --version` → **Python 3.12.x**

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## Render deployment

| Setting | Value |
|---------|-------|
| Root directory | `agent/` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Python version** | **3.12.0** — set env `PYTHON_VERSION=3.12.0` on Render (or use `runtime.txt`) |

Optional: use `render.yaml` in this directory as a blueprint.

### DNS

CNAME `agent.rapidui.dev` → your Render service hostname.

### CORS

Allowed origins: `https://rapidui.dev`, `http://localhost:3000` (main UI dev).

## Environment variables (Phase 4+)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Phase 4 | OpenAI API key for Pydantic AI |
| `RAPIDUI_BASE_URL` | Phase 4 | Platform API base (e.g. `https://rapidui.dev`) |
| `LOGFIRE_TOKEN` | Optional | Logfire instrumentation |
| `RAPIDUI_AGENT_MODEL` | Optional | Default `openai:o4-mini` |
| `RAPIDUI_AGENT_PROMPT_VERSION` | Optional | Default `v1` — loads `prompts/{version}.txt` |

The agent does **not** connect to Neon directly in v0.2. Telemetry POSTs to `https://rapidui.dev/api/observe/ingest/agent` (Phase 1).
