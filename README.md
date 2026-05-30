# RapidUI

Agent-first platform for generating, validating, and storing **RUIs** (RapidUI JSON documents) — **validate → correct → save**.

**Production:** [https://rapidui.dev](https://rapidui.dev)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API routes are available under `/api/*`.

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
| `DATABASE_URL` | Vercel Postgres connection string (required for RUI store) |
| `RAPIDUI_BASE_URL` | Canonical public URL for absolute links in API responses (e.g. `https://rapidui.dev`). Set in Vercel production. Preview/local fall back to `VERCEL_URL` / `localhost`. |

## Database migration

Apply the specs table migration before using the store (local + production). CLI scripts load env from `.env.local` via Node's `--env-file` — run `vercel env pull .env.local` first:

```bash
npm run db:migrate
```

Idempotent — safe to re-run (`CREATE TABLE IF NOT EXISTS`). Applies `001_specs.sql` and `002_eval_runs.sql`.

## RUI store

Persist validated RUIs to Postgres:

```bash
# Save (re-validates inline)
curl -X POST https://rapidui.dev/api/specs \
  -H "Content-Type: application/json" \
  -d @lib/registry/golden/support-dashboard.rui.json

# Retrieve by specId
curl https://rapidui.dev/api/specs/{specId}
```

POST returns **201** flat SavedSpec (`specId`, `url`, `viewUrl`, `contentHash`, `normalizedRui`, …). GET returns the same shape.

Open **`viewUrl`** (`/specs/{specId}`) in a browser for the human RUI inspector — type-colored block tree for review.

## Smoke tests

```bash
npm run smoke:validate   # validation engine
npm run smoke:docs       # agent docs payload
npm run smoke:specs      # Postgres store (requires DATABASE_URL + migration)
npm run smoke:inspector  # in-process RUI inspector render (no dev server)
npm run smoke:eval       # score golden RUI against primary eval case (requires DATABASE_URL)
```

## Agent eval harness (§6)

Repeatable proof that external agents can traverse validate → save without repo context.

```bash
# Generate agent prompt (prod or local)
npm run eval:prompt -- --case=support-dashboard-v0.1 --env=prod

# Deterministic pass/fail against saved spec
npm run eval:score -- --specId=<uuid> --case=support-dashboard-v0.1 --validate-count=3

# Score + insert eval_runs row (prod runs)
npm run eval:log -- --specId=<uuid> --case=support-dashboard-v0.1 --agent=cursor --validate-count=3
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
app/api/          # API route handlers
lib/registry/     # §1 vocabulary registry (RUI schemas)
lib/validate/     # §2 validation engine
lib/docs/         # §3 agent documentation content + payloads
lib/db/           # §4 Postgres client
lib/review/       # §5 RUI inspector components (block tree)
eval/             # §6 eval cases, manual wrappers, score CLI
eval/cases/       # eval case definitions (prompt + successCriteria)
```

## Documentation

**Agent discovery (production):**

- [https://rapidui.dev/llms.txt](https://rapidui.dev/llms.txt) — start here for external agents
- [https://rapidui.dev/api/docs](https://rapidui.dev/api/docs) — full agent documentation (JSON)
- [https://rapidui.dev/api/schema](https://rapidui.dev/api/schema) — vocabulary / block definitions

Implementation plan and MVP scope live in `.cursor/`:

- [rapidui-mvp-v0.1-implementation.md](.cursor/rapidui-mvp-v0.1-implementation.md)
- [rapidui-mvp-v0.1.md](.cursor/rapidui-mvp-v0.1.md)

## Deployment

Pushes to `main` auto-deploy to Vercel at `https://rapidui.dev`.
