# RapidUI

Agent-first platform for generating, validating, and storing **RUIs** (RapidUI JSON documents) — **validate → correct → save**.

**Production:** [https://rapidui.dev](https://rapidui.dev)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page. Main UI builder: [http://localhost:3000/chat](http://localhost:3000/chat). API routes are under `/api/*`.

**Local chat stack** (Phase 5):

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

Idempotent — safe to re-run (`CREATE TABLE IF NOT EXISTS`). Applies `001`–`005` (`specs`, `eval_runs`, `api_events`, `agent_runs`, `agent_turns`).

## RUI store

Persist validated RUIs to Postgres:

```bash
# Save (re-validates inline)
curl -X POST https://rapidui.dev/api/specs \
  -H "Content-Type: application/json" \
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
| `/observe` | Platform analytics (API, agent, evals) |
| `/specs/:id` | Shareable saved RUI inspector |

## Smoke tests

```bash
npm run smoke:operations # operations schema (Zod)
npm run smoke:validate   # validation engine + UC goldens
npm run smoke:docs       # agent docs payload
npm run smoke:specs      # Postgres store (requires DATABASE_URL + migration)
npm run smoke:inspector  # in-process RUI inspector render (no dev server)
npm run smoke:eval       # score UC2 golden against crud-admin-v0.2 (requires DATABASE_URL)
npm run smoke:observe    # api_events + agent ingest (requires DATABASE_URL)
```

## Agent eval harness (§6)

Repeatable proof that external agents can traverse validate → save without repo context.

```bash
# Generate agent prompt (prod or local)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod

# Deterministic pass/fail against saved spec
npm run eval:score -- --specId=<uuid> --case=crud-admin-v0.2 --validate-count=3

# Score + insert eval_runs row (prod runs)
npm run eval:log -- --specId=<uuid> --case=crud-admin-v0.2 --agent=cursor --validate-count=3
```

**Prod workflow:** generate prompt → run agent in empty dir → optional `view_url` review → `eval:log` from this repo.

**Local workflow:** use `--env=local` with `npm run dev`; agent prints `---EVAL_RESULT---` for optional personal notes. Pipe to `eval:log --stdin` to score + log from pasted output.

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
  observe/          # analytics dashboards
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
eval/               # §6 eval cases, manual wrappers, score CLI
eval/cases/         # eval case definitions (prompt + successCriteria)
```

## Documentation

**Agent discovery (production):**

- [https://rapidui.dev/llms.txt](https://rapidui.dev/llms.txt) — start here for external agents
- [https://rapidui.dev/api/docs](https://rapidui.dev/api/docs) — full agent documentation (JSON)
- [https://rapidui.dev/api/schema](https://rapidui.dev/api/schema) — operations vocabulary and schema rules

Implementation plan and MVP scope live in `.cursor/`:

- [rapidui-v0.2-implementation.md](.cursor/rapidui-v0.2-implementation.md) — phase checklists (Phase 5 complete 2026-07-22)
- [rapidui-v0.2.md](.cursor/rapidui-v0.2.md) — product reference
- [rapidui-mvp-v0.1-implementation.md](.cursor/rapidui-mvp-v0.1-implementation.md)
- [rapidui-mvp-v0.1.md](.cursor/rapidui-mvp-v0.1.md)

## Deployment

Pushes to `main` auto-deploy to Vercel at `https://rapidui.dev`.

**RapidUI Agent** (Phase 0+): separate Render web service from `agent/` — see [agent/README.md](agent/README.md).
