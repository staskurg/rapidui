# RapidUI

Agent-first platform for generating, validating, and storing **RUIs** (RapidUI JSON documents) — **validate → correct → save**.

**Production:** [https://rapidui.dev](https://rapidui.dev) · **Agent:** [https://agent.rapidui.dev](https://agent.rapidui.dev)

v0.2 is **operations-first** (schema `version: "0.2"`). Observe dashboards, the RapidUI Agent, and the eval harness close the loop from demo → telemetry → regression. **Phase 6 complete** (2026-07-31); **Phase 7** (eval lab + portfolio polish) in progress.

## Architecture

```mermaid
flowchart TB
  subgraph clients["Clients"]
    Human["Human demo /chat"]
    External["External agents Path B"]
    EvalRun["eval:run Path A Phase 7"]
  end

  subgraph platform["rapidui.dev · Next.js · Vercel"]
    API["RapidUI API /api/*"]
    UI["Main UI /chat"]
    Observe["Observe /observe/*"]
    Ingest["POST /api/observe/ingest/*"]
    API --> Neon
    Ingest --> Neon
  end

  subgraph agent_svc["agent.rapidui.dev · Render"]
    Chat["POST /chat · Pydantic AI"]
    Logfire["Logfire optional debug"]
    Chat --> Logfire
  end

  subgraph neon["Neon Postgres"]
    specs[(specs)]
    api_events[(api_events)]
    agent_runs[(agent_runs / agent_turns)]
    eval_runs[(eval_runs)]
    eval_trials[(eval_trials Phase 7)]
  end

  Human --> UI
  UI -->|SSE| Chat
  Chat -->|validate save docs| API
  Chat -->|ingest| Ingest
  External -->|curl + session headers| API
  EvalRun -->|guided script| Chat

  Observe --> api_events
  Observe --> agent_runs
  Observe --> eval_trials

  EvalCases["eval/cases/*.json"] --> Grader["Grader lib/eval/scoreRun"]
  Grader --> eval_runs
  Grader --> eval_trials
  eval_trials --> Observe

  link session_id
  API -.->|X-RapidUI-Session-Id| session_id
  Chat -.->|same session_id| session_id
  Observe -.->|drill-down| session_id
```

**Two telemetry lanes (same `session_id` join key):**

| Lane | Tables | Who writes | Observe view |
|------|--------|------------|--------------|
| **Platform API** | `api_events` | Next.js middleware on validate/save/discovery; external agents (Path B) | `/observe/api` |
| **RapidUI Agent chat** | `agent_runs`, `agent_turns` | FastAPI POST to `/api/observe/ingest/agent` after each turn | `/observe/agent` |

**Eval path (Phase 7):** `eval/cases` → deterministic grader → `npm run eval:log` (manual Path B) or `npm run eval:run` (automated Path A) → `eval_runs` / `eval_trials` → `/observe/evals`.

**Observe vs Logfire:** **Observe** is the product dashboard on `rapidui.dev` (pass rates, retries, session timelines). **Logfire** is optional engineering tracing on the agent service — use it for deep span debugging, not as the portfolio demo surface.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page. Main UI builder: [http://localhost:3000/chat](http://localhost:3000/chat). API routes are under `/api/*`.

**Local chat stack:**

```bash
# Terminal 1 — platform
npm run dev

# Terminal 2 — agent (see agent/README.md)
cd agent && uvicorn main:app --reload --port 8000
```

Set `NEXT_PUBLIC_RAPIDUI_AGENT_URL=http://localhost:8000/chat` in `.env.local`.

### Environment variables

Copy the template and pull secrets from Vercel when linked:

```bash
cp .env.example .env.local
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | **Neon Postgres** pooled connection string — fresh v0.2 database (required for RUI store + Observe tables) |
| `RAPIDUI_BASE_URL` | Canonical public URL for absolute links in API responses (e.g. `https://rapidui.dev`). Set in Vercel production. Preview/local fall back to `VERCEL_URL` / `localhost`. |
| `NEXT_PUBLIC_RAPIDUI_AGENT_URL` | Browser chat endpoint for **`/chat`** (default prod: `https://agent.rapidui.dev/chat`; local: `http://localhost:8000/chat`) |

## Database (Neon)

v0.2 uses a **fresh empty Neon database** — no migration of v0.1 production data. Provision a new Neon project/database, set `DATABASE_URL` on Vercel, then apply migrations:

```bash
npm run db:migrate
```

Idempotent — safe to re-run (`CREATE TABLE IF NOT EXISTS`). Applies **`001`–`006`**:

| Migration | Table / change |
|-----------|----------------|
| `001_specs.sql` | `specs` |
| `002_eval_runs.sql` | `eval_runs` (manual Path B eval logs) |
| `003_api_events.sql` | `api_events` |
| `004_agent_runs.sql` | `agent_runs` |
| `005_agent_turns.sql` | `agent_turns` |
| `006_api_events_http_status.sql` | `api_events.http_status` (transport vs semantic failures) |

Phase **7.4** adds `007_eval_trials.sql` for automated eval snapshots.

## Portfolio demo script

### Path A — RapidUI Agent (browser)

Requires local stack above or production (`rapidui.dev/chat` + Render agent).

```txt
1. Open /chat — click a starter chip (UC1–UC3) or paste JSON/CSV for static browse
2. Chat until validate succeeds → Draft spec in Spec tab; save → Saved badge + inspector
3. Select session id in the session bar (or click the **telemetry** icon after the first turn) → agent run detail at `/observe/agent/sessions/:id`
4. Open viewUrl → /specs/:id shareable inspector
5. Open /observe — hub overview; /observe/api for platform timeline; /observe/agent for agent run metrics
6. (Phase 7) /observe/evals — eval trial comparison
```

**Use cases:** UC1 static browse · UC2 CRUD admin · UC3 AI review queue. Golden references: `lib/operations/golden/UC*-*.rui.json`.

### Path B — External agent (terminal)

Proves the public API is agent-agnostic. Same outcome grader as Path A; process profile is single-shot.

```bash
# 1. Generate prompt (pick case + env)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod

# 2. Run in an empty directory — Cursor, Claude CLI, or Codex with curl only
#    Use the SESSION_ID and X-RapidUI-* headers from the prompt.

# 3. After save, log from this repo (scores + inserts eval_runs)
npm run eval:log -- \
  --specId=<uuid> \
  --case=crud-admin-v0.2 \
  --agent=cursor \
  --validate-count=<n>

# 4. Open viewUrl in browser; find session in Observe
open "https://rapidui.dev/observe/api?session=<SESSION_ID>"
```

Repeat for `static-browse-v0.2` and `ai-review-queue-v0.2` when verifying **S7** / **S8**. Manual runner details: `eval/manual/{cursor,claude,codex}/README.md`.

**S8 check:** After a Path B run, `/observe/api` shows the session with discovery → validate → save funnel under the same `session_id`.

## v0.2 ship criteria (S1–S9)

Verified as part of Phase 7.1 portfolio polish. Full definitions: [`.cursor/rapidui-v0.2.md`](.cursor/rapidui-v0.2.md) §15.

| # | Criterion | How to verify |
|---|-----------|---------------|
| **S1** | Fresh Neon on `@neondatabase/serverless` | `DATABASE_URL` points at v0.2 DB; `npm run db:migrate` applies `001`–`006` |
| **S2** | Operations schema 0.2 | `npm run smoke:operations` · `npm run smoke:validate` |
| **S3** | API telemetry + session id | `npm run smoke:observe-discovery` · headers documented in `/llms.txt` and `/api/docs` |
| **S4** | Observe API + Agent dashboards | `/observe/api` · `/observe/agent` · `npm run smoke:observe-agent` |
| **S5** | RapidUI Agent on Render | `agent.rapidui.dev/chat` → validate → save · `npm run smoke:agent` |
| **S6** | Main UI at `/chat` | Starter chips, session bar, tabbed Spec/JSON output, draft panel on validate |
| **S7** | UC1–UC3 end-to-end | Path A demo script above (local + prod smoke) |
| **S8** | Path B in Observe API | External agent session visible in `/observe/api` with full funnel |
| **S9** | Monorepo + Render deploy | `agent/` on Render · demo script in this README |

Eval lab (**O5**) ships with Phase **7.7** — not required for S1–S9 alone.

## RUI store

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

Open **`viewUrl`** (`/specs/{specId}`) in a browser for the human RUI inspector — operations summary + raw JSON for v0.2 specs.

## Routes (human)

| Path | Purpose |
|------|---------|
| `/` | Landing — portfolio pitch, agent discovery (`/llms.txt`) |
| `/chat` | Build a RUI — agent chat + spec inspector |
| `/observe` | Analytics hub |
| `/observe/api` | Platform API sessions + funnel |
| `/observe/api/sessions/:id` | API session drill-down |
| `/observe/agent` | RapidUI Agent run metrics |
| `/observe/agent/sessions/:id` | Agent session drill-down |
| `/observe/evals` | Eval lab (Phase 7 — trial comparison) |
| `/specs/:id` | Shareable saved RUI inspector |

## Smoke tests

Run the full bundle before demos or releases:

```bash
npm run smoke:operations      # operations schema (Zod)
npm run smoke:validate        # validation engine + UC goldens
npm run smoke:docs            # agent docs payload
npm run smoke:specs           # Postgres store (requires DATABASE_URL + migration)
npm run smoke:inspector       # in-process RUI inspector render (no dev server)
npm run smoke:eval            # score UC1–UC3 goldens (requires DATABASE_URL)
npm run smoke:observe         # api_events + agent ingest (requires DATABASE_URL)
npm run smoke:observe-api     # Observe API dashboard queries
npm run smoke:observe-discovery  # discovery funnel + session gate
npm run smoke:observe-agent   # agent_runs outcomes + Phase 6 P0 query helpers
npm run smoke:agent           # FastAPI /health + session gate (from agent/)
```

Requires `.env.local` with `DATABASE_URL` for Postgres-backed smokes.

## Agent eval harness

Repeatable proof that agents can traverse validate → save. v0.1 case `support-dashboard-v0.1` is **retired**; v0.2 cases are operations-shaped only.

**Cases:** `static-browse-v0.2` · `crud-admin-v0.2` · `ai-review-queue-v0.2` · `spec-update-v0.2` (optional UC4 — blocked until `load_spec` ships)

```bash
# Generate agent prompt (prod or local)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod

# Deterministic pass/fail against saved spec
npm run eval:score -- --specId=<uuid> --case=crud-admin-v0.2 --validate-count=3

# Score + insert eval_runs row
npm run eval:log -- --specId=<uuid> --case=crud-admin-v0.2 --agent=cursor --validate-count=3
```

**Prod workflow:** generate prompt → run agent in empty dir → optional `view_url` review → `eval:log` from this repo.

**Local workflow:** use `--env=local` with `npm run dev`. Agent prints `---EVAL_RESULT---` for optional notes. Pipe to `eval:log --stdin` to score + log from pasted output.

Automated guided runs (`npm run eval:run`, `eval:matrix`) ship in Phase **7.3–7.7**.

Eval cases live in `eval/cases/`. Manual runner docs: `eval/manual/{cursor,claude,codex}/README.md`.

## Health check

```bash
curl https://rapidui.dev/api/health
# → {"ok":true}
```

Use the apex domain (`rapidui.dev`) as the canonical API base URL. `www.rapidui.dev` redirects to the apex — that is expected Vercel behavior.

## Project structure

```txt
app/
  page.tsx          # landing
  chat/             # Main UI builder
  observe/          # analytics dashboards (api, agent, evals)
  specs/[id]/       # shareable inspector
  api/              # API route handlers (incl. /api/observe/ingest/agent)
agent/              # RapidUI Agent — FastAPI on Render (agent.rapidui.dev)
components/
  demo/             # chat shell (MainDemo, ChatPanel, OutputPanel, …)
  site/             # SiteShell, SiteHeader, GitHub link
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

## Documentation

**Agent discovery (production):**

- [https://rapidui.dev/llms.txt](https://rapidui.dev/llms.txt) — start here for external agents
- [https://rapidui.dev/api/docs](https://rapidui.dev/api/docs) — full agent documentation (JSON)
- [https://rapidui.dev/api/schema](https://rapidui.dev/api/schema) — operations vocabulary and schema rules

Implementation plan and MVP scope live in `.cursor/`:

- [rapidui-v0.2-implementation.md](.cursor/rapidui-v0.2-implementation.md) — phase checklists (Phases 0–6 complete; Phase 7 in progress)
- [rapidui-v0.2.md](.cursor/rapidui-v0.2.md) — product reference
- [rapidui-mvp-v0.1-implementation.md](.cursor/rapidui-mvp-v0.1-implementation.md)
- [rapidui-mvp-v0.1.md](.cursor/rapidui-mvp-v0.1.md)

## Deployment

Pushes to `main` auto-deploy to Vercel at `https://rapidui.dev`.

**RapidUI Agent** (Phase 0+): separate Render web service from `agent/` — see [agent/README.md](agent/README.md).
