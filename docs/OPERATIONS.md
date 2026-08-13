# Operations

Environment setup, database migrations, smoke tests, deployment, and release criteria for RapidUI v0.2.

## Environment variables

Copy the template and pull secrets from Vercel when linked:

```bash
cp .env.example .env.local
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

### Platform (`.env.local`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | **Neon Postgres** pooled connection string — required for RUI store + Observe |
| `RAPIDUI_BASE_URL` | Canonical public URL (e.g. `https://rapidui.dev`). Preview/local fall back to `VERCEL_URL` / `localhost`. |
| `NEXT_PUBLIC_RAPIDUI_AGENT_URL` | Browser chat endpoint for `/chat` (prod: `https://agent.rapidui.dev/chat`; local: `http://localhost:8000/chat`) |

### Agent (`agent/.env`)

See [agent/README.md](../agent/README.md#environment-variables). Key vars: `OPENAI_API_KEY`, `RAPIDUI_BASE_URL`, optional `LOGFIRE_TOKEN`.

## Database

v0.2 uses a **fresh empty Neon database** — no migration of v0.1 production data.

```bash
npm run db:migrate
```

Idempotent — safe to re-run (`CREATE TABLE IF NOT EXISTS`).

| Migration | Table / change |
|-----------|----------------|
| `001_specs.sql` | `specs` |
| `002_eval_runs.sql` | `eval_runs` |
| `003_api_events.sql` | `api_events` |
| `004_agent_runs.sql` | `agent_runs` |
| `005_agent_turns.sql` | `agent_turns` |
| `006_api_events_http_status.sql` | `api_events.http_status` |
| `009_agent_runs_transcript.sql` | agent run transcript storage |
| `010_agent_runs_env.sql` | env tag on agent runs |
| `011_agent_turns_cache_read.sql` | cache read tokens on turns |

## RUI store API

Persist validated RUIs to Postgres:

```bash
# Save (re-validates inline)
curl -X POST https://rapidui.dev/api/specs \
  -H "Content-Type: application/json" \
  -H "X-RapidUI-Session-Id: $(uuidgen)" \
  -d @lib/operations/golden/UC2-crud-admin-v0.2.rui.json

# Retrieve by specId
curl https://rapidui.dev/api/specs/{specId}
```

POST returns **201** flat SavedSpec (`specId`, `url`, `viewUrl`, `contentHash`, `normalizedRui`, …). GET returns the same shape.

Open **`viewUrl`** (`/specs/{specId}`) for the human RUI inspector.

## Health check

```bash
curl https://rapidui.dev/api/health
# → {"ok":true}
```

Use the apex domain (`rapidui.dev`) as the canonical API base. `www.rapidui.dev` redirects to apex — expected Vercel behavior.

## Smoke tests

Run before demos or releases. Requires `.env.local` with `DATABASE_URL` for Postgres-backed smokes.

```bash
npm run smoke:operations      # operations schema (Zod)
npm run smoke:validate        # validation engine + UC goldens
npm run smoke:docs            # agent docs payload
npm run smoke:specs           # Postgres store
npm run smoke:inspector       # RUI inspector render (no dev server)
npm run smoke:eval            # score UC1–UC3 goldens
npm run smoke:observe         # api_events + agent ingest
npm run smoke:observe-api     # Observe API dashboard queries
npm run smoke:observe-discovery  # discovery funnel + session gate
npm run smoke:observe-agent   # agent_runs outcomes
npm run smoke:agent           # FastAPI /health + session gate (from agent/)
```

## Deployment

| Component | Trigger | Target |
|-----------|---------|--------|
| **Platform** | Push to `main` | Vercel → `https://rapidui.dev` |
| **Agent** | Render deploy from `agent/` | `https://agent.rapidui.dev` |

Agent deploy settings: [agent/README.md#render-deployment](../agent/README.md#render-deployment)

## v0.2 ship criteria (S1–S9)

| # | Criterion | How to verify |
|---|-----------|---------------|
| **S1** | Fresh Neon on `@neondatabase/serverless` | `DATABASE_URL` points at v0.2 DB; `npm run db:migrate` |
| **S2** | Operations schema 0.2 | `npm run smoke:operations` · `npm run smoke:validate` |
| **S3** | API telemetry + session id | `npm run smoke:observe-discovery` · headers in `/llms.txt` and `/api/docs` |
| **S4** | Observe API + Agent dashboards | `/observe/api` · `/observe/agent` · `npm run smoke:observe-agent` |
| **S5** | RapidUI Agent on Render | `agent.rapidui.dev/chat` → validate → save · `npm run smoke:agent` |
| **S6** | Main UI at `/chat` | Starter chips, session bar, tabbed Spec/JSON output |
| **S7** | UC1–UC3 end-to-end | Path A demo in [README](../README.md#try-it-demo-script) |
| **S8** | Path B in Observe API | External agent session visible in `/observe/api` with full funnel |
| **S9** | Monorepo + Render deploy | `agent/` on Render · demo script in README |

## Project structure (detailed)

```txt
app/
  page.tsx          # landing
  chat/             # Main UI builder
  observe/          # analytics dashboards (api, agent, evals)
  specs/[id]/       # shareable inspector
  api/              # API route handlers (incl. /api/observe/ingest/agent)
agent/              # RapidUI Agent — FastAPI on Render
components/
  demo/             # chat shell (MainDemo, ChatPanel, OutputPanel, …)
  site/             # SiteShell, SiteHeader
  observe/          # Observe sidebar + stat cards
lib/demo/           # session, agent URL, panel listener, starter prompts
lib/operations/     # v0.2 operations-first RUI schemas + golden fixtures
lib/validate/       # validation engine (O1–O20 semantic rules)
lib/docs/           # agent documentation content + payloads
lib/db/             # Postgres client (@neondatabase/serverless)
lib/observe/        # Observe ingest schemas + write helpers
lib/review/         # RUI inspector (operations-first v0.2)
lib/eval/           # deterministic grader + eval CLI helpers
eval/               # eval cases, manual wrappers, score CLI
eval/cases/         # eval case definitions (prompt + successCriteria)
```
