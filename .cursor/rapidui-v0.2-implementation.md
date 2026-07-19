# RapidUI v0.2 — Implementation Plan

Scaffold for building v0.2 **one phase at a time**. Each phase has goals, scope, and a completion checklist. When starting a phase, point an agent here **and** at the reference doc — the agent should investigate gaps and expand that phase into a detailed execution plan.

**Reference (decisions & design — do not duplicate):** [rapidui-v0.2.md](./rapidui-v0.2.md)

**v0.1 build record:** [rapidui-mvp-v0.1-implementation.md](./rapidui-mvp-v0.1-implementation.md)

---

## How to use this document

1. Pick the **next phase** in build order (see below).
2. Read the phase section here + the linked **Reference §** in `rapidui-v0.2.md`.
3. Ask the agent to: audit the repo, resolve **Open questions** for that phase, and produce a step-by-step plan before coding.
4. Check off the phase **Checklist** before moving on.

**Do not** implement later phases before dependencies are done. Area 2 (schema) is the **critical path** for agent + main UI.

---

## Build order

```txt
Phase 0  Infra
   │
   ├─► Phase 1  API telemetry
   │      │
   │      ├─► Phase 2  Operations schema + docs + eval cases  ◄── critical path
   │      │      │
   │      │      ├─► Phase 4  RapidUI Agent
   │      │      │      └─► Phase 5  Main UI
   │      │      │
   │      │      └─► Phase 5 also needs Phase 2 (inspector)
   │      │
   │      └─► Phase 3  Observe API dashboard
   │             └─► Phase 6  Observe Agent dashboard (needs Phase 4)
   │
   └─► Phase 7  Polish + eval lab (after 1–6)
```

**Recommended sequence:** `0 → 1 → 2 → 4 → 5` in parallel with `3`; then `6 → 7`.

Eval lab (Phase 7) must **not** block Phases 4–6. Ship with default `o4-mini`; matrix confirms or changes default (stretch O5).

---

## Ship criteria map

| Criterion | Primary phase(s) |
|-----------|------------------|
| S1 Fresh Neon | 0 |
| S2 Operations schema 0.2 | 2 |
| S3 API telemetry | 1 |
| S4 Observe `/observe/api` + `/observe/agent` | 3, 6 |
| S5 RapidUI Agent | 4 |
| S6 Main UI | 5 |
| S7 Use cases 1–3 E2E | 4, 5 |
| S8 Path B external agent in Observe | 1, 3 |
| S9 Monorepo + Render agent | 0, 4 |
| O5 Eval lab | 7 |

Full definitions: reference **§15**.

---

## Phase index

| Phase | Name | Reference § |
|-------|------|-------------|
| **0** | Infra baseline | §4, §9 Area 0, §10 |
| **1** | API telemetry | §4, §9 Area 1, §10, §14 |
| **2** | Operations schema + docs + eval cases | §6, §7, §9 Area 2, §14 |
| **3** | Observe hub + API dashboard | §5, §9 Area 3 |
| **4** | RapidUI Agent (FastAPI) | §4, §8, §9 Area 4, §11 |
| **5** | Main UI (chat + inspector) | §5, §6, §9 Area 5 |
| **6** | Observe Agent dashboard | §9 Area 6 |
| **7** | Polish + eval lab | §9 Area 7, §14, §15 O* |

---

# Phase 0 — Infra baseline

**Reference:** §4 (monorepo, domains), §9 Area 0, §10 (tables sketch), §15 S1/S9, §16 (deferrals)

**Status:** Complete (verified 2026-07-18 — local + prod + Render).

### Goal

Fresh Neon Postgres, monorepo layout for two deploy targets (Vercel + Render), and scaffolding so later phases can write telemetry and run the agent service.

### Depends on

Nothing.

### Unlocks

All other phases.

---

### Neon database (locked — reference §3 #11, #21, §15 S1)

v0.2 uses a **fresh, empty Neon Postgres database**. This is a locked product decision — not optional.

| Requirement | Meaning |
|-------------|---------|
| **Fresh Neon** | New empty database for v0.2. Run migrations from scratch (`001`–`005`). No v0.1 specs or eval rows carried over. |
| **No Vercel Postgres migration** | Do **not** export/import or ETL data from the v0.1 production store. Do **not** keep using the old v0.1 DB as the v0.2 store. |
| **Neon driver in code** | Replace deprecated `@vercel/postgres` with `@neondatabase/serverless` directly. Same `DATABASE_URL` env var; different npm package. |
| **Shared DB for v0.2** | One Neon database serves Vercel (Next.js) and receives agent telemetry via ingest. Render agent does **not** connect to Neon directly in v0.2 — it POSTs to the platform ingest API (Phase 1). |

**Vercel Integrations showing “Neon” is fine** — that is the expected host. The integration is how you provision and wire `DATABASE_URL`. What matters is that the connection string points at a **new database**, not the v0.1 production database that already holds old specs.

```txt
✅ Do                                    ❌ Don't
────────────────────────────────────    ────────────────────────────────────
Create new Neon project or new DB       Reuse v0.1 prod DB + migrate rows
  in existing Neon account
Point Vercel DATABASE_URL at new URL    Keep @vercel/postgres in package.json
Run npm run db:migrate (empty → 5 tables)  Assume Vercel Neon link = v0.2-ready
Use @neondatabase/serverless            Copy v0.1 eval_runs / specs into v0.2
```

**How to provision (pick one):**

1. **Neon console** — [console.neon.tech](https://console.neon.tech): new project → copy **pooled** connection string → paste into Vercel env (Production + Preview + Development) and `.env.local`.
2. **Vercel Neon integration** — add/link Neon, but create a **new database or project** for v0.2; update `DATABASE_URL` to that URL. Disconnect or leave the old v0.1 integration/database unused for v0.2.

After cutover, v0.1 production data remains in the old database for archive/reference only — v0.2 demo and Observe start clean.

---

### Repo audit (2026-07-18)

| Area | Current state | Phase 0 action |
|------|---------------|----------------|
| **Postgres driver** | `@vercel/postgres` in `lib/db/client.ts` + `package.json` | Replace with `@neondatabase/serverless`; keep tagged-template API shape so `specs.ts` / `evalRuns.ts` need minimal changes |
| **Migrations** | `001_specs.sql`, `002_eval_runs.sql`; runner in `scripts/migrate.ts` | Add `003_api_events.sql`, `004_agent_runs.sql`, `005_agent_turns.sql`; register in `MIGRATIONS` array |
| **`lib/observe/`** | Missing | Create `writes.ts` (Zod ingest schemas + stub writers) |
| **Ingest route** | Missing | Create `app/api/observe/ingest/agent/route.ts` — validate body, return 200; no DB writes until Phase 1 |
| **`agent/`** | Missing entirely | New FastAPI skeleton: `GET /health`, CORS, `prompts/` dir |
| **`.env.example`** | Still says “Vercel Postgres” | Document Neon `DATABASE_URL` + agent vars (Render) |
| **README** | References Vercel Postgres | Update DB section to Neon (minimal — full v0.2 README is Phase 7) |
| **Neon database** | v0.1 prod likely on legacy Vercel Postgres or first Neon link (has old specs) | **Manual:** new **empty** Neon DB; new `DATABASE_URL` on Vercel — see **Neon database (locked)** above |
| **Render + DNS** | Not configured | **Manual:** Render web service (`agent/` root), CNAME `agent.rapidui.dev` |
| **Golden RUIs** | UC1–UC4 staged in git | **Phase 2** — ignore for Phase 0 |

**v0.1 code that must keep working after Phase 0:** `POST/GET /api/specs`, `eval:log`, `smoke:specs`, `smoke:eval` — against the **new** Neon DB (empty store is fine).

---

### Resolved open questions

| Question | Decision |
|----------|----------|
| Migration tool / folder | Keep v0.1 pattern: SQL files in `lib/db/migrations/`, applied by `npm run db:migrate` (`scripts/migrate.ts`). Idempotent `CREATE TABLE IF NOT EXISTS`. |
| Neon driver | `@neondatabase/serverless` — `neon(process.env.DATABASE_URL!)`. Wrap in `lib/db/client.ts` so `sql` tagged templates still return `{ rows }` (matches existing `specs.ts` / `evalRuns.ts`). Update `sql.query()` for raw migration files. |
| `agent_runs` / `agent_turns` SQL | **Phase 0:** create tables with all columns from reference §4 + Phase 1 sketch (below). **Phase 1:** wire inserts + indexes tuning; **Phase 7:** `eval_runs` column extensions only. |
| CORS on Render | FastAPI `CORSMiddleware`: `allow_origins=["https://rapidui.dev", "http://localhost:3000"]`, `allow_methods=["GET","POST","OPTIONS"]`, `allow_headers=["*"]`, `allow_credentials=False`. Preflight from browser before Phase 4 `/chat` exists — test with `OPTIONS` + dummy `POST` from localhost. |
| Ingest auth | None (reference §3 #26). Stub route accepts JSON only; no API key. |
| Monorepo ignore rules | No Turborepo. Vercel deploys repo root; Render sets root directory `agent/`. Optional: add `agent/.python-version` or `runtime.txt` for Render Python pin. |
| Neon vs Vercel integration | Neon **is** the database; Vercel integration is optional provisioning UI | Must be a **new empty** Neon database (§3 #21). Integration alone does not satisfy “fresh” if it still points at v0.1 data. |
| Old v0.1 database | Keep or delete separately — out of scope | Do not migrate rows; do not point v0.2 `DATABASE_URL` at v0.1 prod unless intentionally resetting that same empty DB (prefer new DB). |

---

### Task list (build order)

#### A — Fresh Neon + driver swap (platform)

1. **Provision fresh Neon database** — new Neon project *or* new database in Neon console; must be **empty** (no v0.1 specs/eval rows). Copy **pooled** connection string.
2. **Vercel env:** set `DATABASE_URL` to the **new** URL for Production + Preview + Development. Leave old v0.1 database disconnected from this project (archive only).
3. **Local:** `vercel env pull .env.local` (or paste the new Neon URL into `.env.local`).
4. **Dependencies:** remove `@vercel/postgres`; add `@neondatabase/serverless`.
5. **Rewrite `lib/db/client.ts`:** Neon client + thin wrapper preserving `{ rows }` return shape and `sql.query(text)` for migrations.
6. **Verify store layer on fresh Neon:** run `npm run smoke:specs` and `npm run smoke:eval` (insert + read on empty DB).

#### B — v0.2 table migrations

7. Add migration files (see SQL below).
8. Extend `scripts/migrate.ts` `MIGRATIONS` array through `005`.
9. Run `npm run db:migrate` on local Neon; confirm five tables exist (`specs`, `eval_runs`, `api_events`, `agent_runs`, `agent_turns`).

#### C — Observe ingest scaffold (platform)

10. Create `lib/observe/schemas.ts` (or inline in `writes.ts`) — Zod types for agent ingest payload (minimal: `session_id`, optional `run`, optional `turns[]`).
11. Create `lib/observe/writes.ts` — export schemas + **stub** `insertAgentRun` / `insertAgentTurn` (throw `not implemented` or no-op; Phase 1 implements Neon inserts).
12. Create `app/api/observe/ingest/agent/route.ts` — `POST` parses JSON, Zod-validates, returns `{ ok: true }` with 200; 400 on bad payload.

#### D — Python agent skeleton (Render target)

13. Create `agent/pyproject.toml` — FastAPI, uvicorn, pydantic (Pydantic AI deferred to Phase 4).
14. Create `agent/main.py` — `GET /health` → `{ "status": "ok" }`; CORS middleware per above.
15. Create `agent/prompts/.gitkeep` (or empty `v1.txt` placeholder — real prompt in Phase 4).
16. Create `agent/README.md` — local run (`uvicorn main:app`), Render setup (root dir `agent/`), env vars for later phases.
17. Optional: `agent/render.yaml` blueprint (build/start commands) to speed Render setup.

#### E — Deploy + DNS (manual, after D)

18. **Render:** new Web Service, repo connected, root directory `agent/`, build `pip install -e .` or `pip install .`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
19. **DNS:** CNAME `agent.rapidui.dev` → Render hostname.
20. **Smoke:** `curl https://agent.rapidui.dev/health` → 200.
21. **CORS smoke:** from browser console on `http://localhost:3000`, `fetch("https://agent.rapidui.dev/health")` succeeds; `OPTIONS` preflight returns allowed origin.

#### F — Docs + env template

22. Update `.env.example` — Neon URL comment, `RAPIDUI_BASE_URL`, document Render-side vars (`OPENAI_API_KEY`, `RAPIDUI_BASE_URL`, optional agent overrides) as comments-only until Phase 4.
23. Update README “Database migration” + env table — Neon, five migrations, note fresh DB (no v0.1 data carry-over).

---

### Files to create / modify

**Create**

```txt
lib/db/migrations/003_api_events.sql
lib/db/migrations/004_agent_runs.sql
lib/db/migrations/005_agent_turns.sql
lib/observe/writes.ts          # + schemas (split optional)
app/api/observe/ingest/agent/route.ts
agent/pyproject.toml
agent/main.py
agent/README.md
agent/prompts/.gitkeep
agent/render.yaml              # optional
```

**Modify**

```txt
package.json                   # @neondatabase/serverless; drop @vercel/postgres
package-lock.json              # via npm install
lib/db/client.ts               # Neon driver wrapper
scripts/migrate.ts             # register 003–005
.env.example
README.md                      # Neon + migration count (minimal)
```

---

### Migration SQL (Phase 0 — minimal but complete columns)

`003_api_events.sql` — from reference §10:

```sql
CREATE TABLE IF NOT EXISTS api_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  endpoint      TEXT NOT NULL,
  session_id    TEXT,
  agent         TEXT,
  eval_case_id  TEXT,
  intent        TEXT,
  valid         BOOLEAN,
  error_codes   TEXT[],
  spec_id       UUID REFERENCES specs(id),
  duration_ms   INT
);
CREATE INDEX IF NOT EXISTS api_events_occurred_idx ON api_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS api_events_session_idx ON api_events (session_id);
```

`004_agent_runs.sql` — session summary (finalize ingest mapping in Phase 1):

```sql
CREATE TABLE IF NOT EXISTS agent_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT NOT NULL UNIQUE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at       TIMESTAMPTZ,
  outcome           TEXT,
  spec_id           UUID REFERENCES specs(id),
  validate_attempts INT,
  model             TEXT,
  provider          TEXT,
  prompt_version    TEXT,
  eval_case_id      TEXT,
  total_tokens      INT,
  latency_ms        INT,
  intent            TEXT,
  error_summary     TEXT
);
CREATE INDEX IF NOT EXISTS agent_runs_started_idx ON agent_runs (started_at DESC);
```

`005_agent_turns.sql`:

```sql
CREATE TABLE IF NOT EXISTS agent_turns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL REFERENCES agent_runs(id),
  turn_index        INT NOT NULL,
  latency_ms        INT,
  input_tokens      INT,
  output_tokens     INT,
  had_validate_call BOOLEAN NOT NULL DEFAULT FALSE,
  had_save          BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (run_id, turn_index)
);
```

**Note:** If Neon’s HTTP driver rejects multi-statement `sql.query()` files, split each `CREATE INDEX` into its own migration file or execute statements sequentially in `migrate.ts`.

---

### Ingest stub contract (Phase 0)

Phase 0 validates shape only; Phase 1 adds real inserts + shared schema doc for `agent/`.

Minimal JSON (Zod):

```json
{
  "session_id": "uuid-or-string",
  "run": {
    "outcome": "saved",
    "spec_id": "optional-uuid"
  },
  "turns": [
    { "turn_index": 0, "latency_ms": 1200, "had_validate_call": true }
  ]
}
```

Route: `POST /api/observe/ingest/agent` → 200 `{ "ok": true }` | 400 RFC 9457 problem response on validation failure.

---

### Test plan (before checking boxes)

| Step | Command / action | Expected |
|------|------------------|----------|
| Driver swap | `npm run smoke:specs` | Pass against Neon (empty or with new row) |
| Migrations | `npm run db:migrate` | All five SQL files log “applied”; re-run idempotent |
| Table check | `psql $DATABASE_URL -c '\dt'` or Neon console | Five tables listed |
| Ingest stub | `curl -X POST localhost:3000/api/observe/ingest/agent -H 'Content-Type: application/json' -d '{"session_id":"test"}'` | 200 |
| Ingest bad payload | POST `{}` | 400 |
| Agent local | `cd agent && uvicorn main:app --reload` → `curl localhost:8000/health` | `{ "status": "ok" }` |
| Agent prod | `curl https://agent.rapidui.dev/health` | 200 after Render + DNS |
| CORS | Browser `fetch` from localhost to agent health URL | No CORS error |
| Vercel | Deploy preview; POST `/api/specs` with golden JSON | 201 (confirms Neon on Vercel) |

---

### Out of scope

- Full ingest DB writes (Phase 1)
- `insertApiEvent()` / validate-save middleware (Phase 1)
- Operations schema (Phase 2)
- `POST /chat`, Pydantic AI, tools (Phase 4)
- Observe UI (Phases 3, 6)
- `eval_runs` v0.2 column extensions (Phase 7)

### Checklist

- [x] **Fresh Neon** — new empty database provisioned; `DATABASE_URL` updated on Vercel + local (not the v0.1 prod database)
- [x] Neon live; local + Vercel connect successfully against the **new** DB
- [x] `@neondatabase/serverless` replaces `@vercel/postgres`; store smokes pass on fresh DB
- [x] All five tables exist after `db:migrate` (`specs`, `eval_runs`, `api_events`, `agent_runs`, `agent_turns`)
- [x] `agent/` runs locally (`GET /health` + CORS preflight on `localhost:3000`)
- [x] Render deploy succeeds; `agent.rapidui.dev/health` responds
- [x] CORS allows `rapidui.dev` (+ localhost dev) → agent (preflight verified)
- [x] Ingest route stub returns 200 / validates payload shape (local + prod)
- [x] `.env.example` documents all required vars (platform + agent comments)

---

# Phase 1 — API telemetry foundation

**Reference:** §4 (telemetry flow), §9 Area 1, §10 (`api_events`), §12, §14 (headers)

**Status:** Complete (verified 2026-07-18 — local Neon + smoke tests).

### Goal

Platform records **every validate/save** from all agents (external + ours). Agent ingest route persists `agent_runs` / `agent_turns` from FastAPI. Satisfies ship criterion **S3** (telemetry + documented headers).

### Depends on

Phase 0 (`api_events`, `agent_runs`, `agent_turns` tables exist; ingest route stub; `lib/observe/schemas.ts`).

### Unlocks

Phase 3 (Observe API dashboard), Path B external-agent demo (**S8**), Phase 4 agent telemetry POST.

---

### Repo audit (2026-07-18)

| Area | Current state | Phase 1 action |
|------|---------------|----------------|
| **`api_events` table** | Migration `003` applied in Phase 0 | Wire `insertApiEvent()` — no schema change |
| **`agent_runs` / `agent_turns`** | Migrations `004`–`005` applied | Implement upsert inserts in `writes.ts` |
| **`lib/observe/schemas.ts`** | `agentIngestPayloadSchema` only | Add `apiEventInputSchema`, export header name constants |
| **`lib/observe/writes.ts`** | Stub `insertAgentRun` / `insertAgentTurn` throw; ingest validates only | Implement all three insert/upsert functions |
| **`lib/observe/headers.ts`** | Missing | Parse optional `X-RapidUI-*` headers from `Request` |
| **`lib/observe/telemetry.ts`** | Missing | `recordApiEvent()` helper — timing + field mapping; called from route handlers |
| **`POST /api/validate`** | Validates only; no telemetry | Call `recordApiEvent()` before every response |
| **`POST /api/specs`** | Validates + saves; no telemetry | Same — log `spec_id` on 201 |
| **`POST /api/observe/ingest/agent`** | Zod validate → `{ ok: true }`; no DB | Call `ingestAgentTelemetry()` → upsert run + turns |
| **`GET /api/docs`** | v0.1 block-tree docs; no headers | Add **`telemetry`** section + optional headers on validate/specs API entries (**header docs only** — full operations rewrite is Phase 2) |
| **`eval/manual/wrapper_*.txt`** | v0.1 workflow; no session headers | Add telemetry header block + curl `-H` examples |
| **`agent/README.md`** | Points at ingest URL (Phase 1) | Link to shared ingest schema doc |
| **`scripts/smoke-observe.ts`** | Missing | New smoke: api_events insert + ingest upsert |
| **`POST /api/eval/log`** | Does not exist; CLI `eval:log` works | **Out of scope** — defer to Phase 7 stretch **O3** |

**v0.1 behavior that must keep working:** validate/specs responses unchanged; telemetry failures must **not** break API responses.

---

### Resolved open questions

| Question | Decision |
|----------|----------|
| **“Middleware” vs route handlers** | **Route-handler instrumentation**, not root `middleware.ts`. Body must be parsed for `valid` / `error_codes`; handler owns `duration_ms`. Reference §4 “middleware” = platform layer outside the LLM — implement as shared helper called from `app/api/validate/route.ts` and `app/api/specs/route.ts`. |
| **Which endpoints log `api_events`** | **`POST /api/validate`** and **`POST /api/specs` only** — every request, including transport failures (HTTP 400). Do **not** log `GET /api/specs/:id`. |
| **Telemetry insert failure** | **Non-blocking.** Wrap insert in try/catch; `console.error`; always return the same HTTP response the route would return without telemetry. |
| **`valid` / `error_codes` mapping** | Transport failure (400): `valid: null`, `error_codes: ['INVALID_JSON']` (or first transport code). Semantic failure (200, `valid: false`): `valid: false`, codes from `errors[].code`. Success validate: `valid: true`, empty codes. Specs 201: `valid: true`, `spec_id` set. Specs 200 valid:false: same as validate failure. Specs 503: `valid: true`, `spec_id: null` (validation passed, storage failed). |
| **`duration_ms`** | `Date.now()` delta from start of route handler to just before response (includes validation + DB save). |
| **Optional headers** | Phase 1: read if present. **Phase 3B (locked):** **`X-RapidUI-Session-Id` required** on guarded routes; trim whitespace; empty → 400 `MISSING_SESSION_ID`. **`X-RapidUI-Agent`** recommended. |
| **Header names (locked)** | `X-RapidUI-Session-Id`, `X-RapidUI-Agent`, `X-RapidUI-Eval-Case`, `X-RapidUI-Intent` — per reference §12, §14. |
| **Ingest auth / rate limiting** | **None** — reference §3 #26. Public ingest endpoint; same as Phase 0 stub. |
| **Ingest upsert semantics** | `agent_runs`: **`INSERT … ON CONFLICT (session_id) DO UPDATE`** — merge non-null fields from payload; preserve `started_at` on conflict; set `finished_at` when `run.outcome` or `run.finished_at` provided. `agent_turns`: **`INSERT … ON CONFLICT (run_id, turn_index) DO UPDATE`** — replace turn metrics. Route ensures a run row exists before inserting turns (create minimal run if only `turns[]` sent). |
| **`run.outcome` values** | `'saved' \| 'failed' \| 'abandoned'` — Zod enum already in `schemas.ts`. Store as TEXT in DB. |
| **`started_at` / `finished_at` in ingest** | Optional ISO strings in payload; if omitted, DB defaults (`started_at` = first insert time; `finished_at` set only when outcome/finished_at sent). Phase 4 FastAPI may send explicit timestamps later. |
| **Shared ingest schema location** | **`lib/observe/INGEST.md`** — canonical JSON examples + field table; `agent/README.md` links here. Keeps contract in platform tree (single source of truth per §4). |
| **`POST /api/eval/log`** | **Defer to Phase 7 (O3).** Phase 1 keeps **`npm run eval:log`** CLI only. Eval runs do not need new columns until eval lab. |
| **`eval_runs` column extensions** | **Phase 7 only** — no migration in Phase 1. |
| **Docs rewrite for operations schema** | **Phase 2.** Phase 1 adds telemetry headers to existing v0.1 `/api/docs` payload only. |
| **Wrapper v0.2 case ids** | Phase 1: document headers + session id generation. Case id placeholders stay `{{CASE_ID}}` until Phase 2 eval cases land; mention v0.2 case ids in comment only. |

---

### Architecture (Phase 1)

```txt
POST /api/validate | /api/specs
        │
        ▼
  route handler (existing validate/save logic)
        │
        ├──► HTTP response to agent (unchanged)
        │
        └──► recordApiEvent() ──► insertApiEvent() ──► Neon api_events
                    ▲
                    └── parseTelemetryHeaders(request)


POST /api/observe/ingest/agent  (from Render FastAPI in Phase 4)
        │
        ▼
  Zod validate body
        │
        └──► ingestAgentTelemetry()
                  ├── upsert agent_runs (by session_id)
                  └── upsert agent_turns (by run_id + turn_index)
```

---

### Task list (build order)

#### A — Shared observe layer

1. **`lib/observe/headers.ts`** — export header name constants + `parseTelemetryHeaders(request: Request)` returning `{ sessionId, agent, evalCaseId, intent } | null fields`.
2. **Extend `lib/observe/schemas.ts`** — add `apiEventInputSchema` + exported type `ApiEventInput` (fields matching `api_events` columns except `id` / `occurred_at`).
3. **Implement `insertApiEvent(input: ApiEventInput)`** in `writes.ts` — Zod parse → `INSERT INTO api_events … RETURNING id`.
4. **`lib/observe/telemetry.ts`** — export `recordApiEvent({ request, endpoint, result, httpStatus, specId?, startedAt })` — maps `ValidationResult` → `valid` + `error_codes`, merges headers, calls `insertApiEvent` in try/catch.

#### B — Wire validate/save routes

5. **`app/api/validate/route.ts`** — `const startedAt = Date.now()` at top; after result known, `await recordApiEvent(...)` before each `return` (200 success, 200 invalid, 400 transport).
6. **`app/api/specs/route.ts`** — same pattern; pass `specId: saved.specId` on 201; handle 200 valid:false, 503, 400.

#### C — Agent ingest (full implementation)

7. **Implement `upsertAgentRun(sessionId, run?)`** — returns `{ id, sessionId }`.
8. **Implement `upsertAgentTurn(runId, turn)`** — returns `{ id }`.
9. **Implement `ingestAgentTelemetry(payload: AgentIngestPayload)`** — orchestrates run + turns array in one transaction-like sequence (sequential awaits OK for v0.2).
10. **Update `app/api/observe/ingest/agent/route.ts`** — call `ingestAgentTelemetry`; return `{ ok: true, runId }` on success; 500 only if DB throws (ingest is service path — unlike public API, a 500 on DB failure is acceptable; log error).
11. **Remove or repurpose `validateAgentIngestPayload`** — redundant with Zod; keep only if extra business rules needed.

#### D — Documentation + eval wrappers

12. **`lib/observe/INGEST.md`** — full ingest contract (JSON examples, upsert behavior, field tables for `agent_runs` + `agent_turns`).
13. **Update `lib/docs/index.ts`** — add `telemetry` object to docs payload: header names, purpose, example curl; add `optionalHeaders` array on validate/specs API sections.
14. **Update `eval/manual/wrapper_local.txt` and `wrapper_prod.txt`** — new **Telemetry** section: generate `SESSION_ID=$(uuidgen)` (or equivalent), pass four headers on every validate/save curl.
15. **Update `agent/README.md`** — link to `../lib/observe/INGEST.md`; note Phase 4 will POST this shape.

#### E — Smoke + verify

16. **`scripts/smoke-observe.ts`** — (1) POST validate with headers against local or `BASE_URL`; query `api_events` count ≥ 1; (2) POST ingest sample payload; verify `agent_runs` + `agent_turns` rows.
17. **`package.json`** — add `"smoke:observe": "tsx --env-file=.env.local scripts/smoke-observe.ts"`.

---

### Files to create / modify

**Create**

```txt
lib/observe/headers.ts
lib/observe/telemetry.ts
lib/observe/INGEST.md
scripts/smoke-observe.ts
```

**Modify**

```txt
lib/observe/schemas.ts          # apiEventInputSchema
lib/observe/writes.ts           # insertApiEvent, upsertAgentRun/Turn, ingestAgentTelemetry
app/api/validate/route.ts       # recordApiEvent calls
app/api/specs/route.ts          # recordApiEvent calls
app/api/observe/ingest/agent/route.ts
lib/docs/index.ts               # telemetry + optionalHeaders in API sections
eval/manual/wrapper_local.txt
eval/manual/wrapper_prod.txt
agent/README.md
package.json                    # smoke:observe script
```

---

### `insertApiEvent` input (Zod)

Maps 1:1 to `api_events` (Phase 0 migration — no DDL change):

| Field | Type | Source |
|-------|------|--------|
| `endpoint` | `'/api/validate' \| '/api/specs'` | Route constant |
| `session_id` | `string \| null` | `X-RapidUI-Session-Id` |
| `agent` | `string \| null` | `X-RapidUI-Agent` |
| `eval_case_id` | `string \| null` | `X-RapidUI-Eval-Case` |
| `intent` | `string \| null` | `X-RapidUI-Intent` |
| `valid` | `boolean \| null` | `true` / `false` / `null` (transport) |
| `error_codes` | `string[] \| null` | `errors[].code` or `null` when valid |
| `spec_id` | `uuid \| null` | POST /api/specs 201 only |
| `duration_ms` | `number` | Handler timing |

`id` and `occurred_at` — DB defaults.

---

### Agent ingest JSON contract (canonical — also in `INGEST.md`)

**Endpoint:** `POST /api/observe/ingest/agent`  
**Auth:** none  
**Success:** `200 { "ok": true, "runId": "<uuid>" }`  
**Validation error:** `400` with `INVALID_INGEST_PAYLOAD`

#### Minimal (run summary only — Phase 4 end-of-session)

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "run": {
    "outcome": "saved",
    "spec_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "validate_attempts": 2,
    "model": "o4-mini",
    "provider": "openai",
    "prompt_version": "v1",
    "eval_case_id": "crud-admin-v0.2",
    "total_tokens": 4200,
    "latency_ms": 18500,
    "intent": "UC2",
    "error_summary": null,
    "finished_at": "2026-07-18T20:15:00.000Z"
  }
}
```

#### Per-turn update (mid-session — Phase 4 after each assistant reply)

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "turns": [
    {
      "turn_index": 0,
      "latency_ms": 3200,
      "input_tokens": 800,
      "output_tokens": 450,
      "had_validate_call": true,
      "had_save": false
    }
  ]
}
```

#### Combined (single POST)

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "run": { "outcome": "saved", "spec_id": "…", "validate_attempts": 1 },
  "turns": [{ "turn_index": 0, "latency_ms": 5000, "had_validate_call": true, "had_save": true }]
}
```

**Upsert rules:**

- Same `session_id` across all POSTs for one chat session.
- `session_id` on `agent_runs` is **UNIQUE** — later POSTs merge into the same row.
- `(run_id, turn_index)` on `agent_turns` is **UNIQUE** — re-posting a turn overwrites metrics.
- `spec_id` in ingest must reference an existing `specs.id` if provided (FK) — Phase 4 saves before ingest.

---

### Telemetry headers (for `/api/docs` + wrappers)

| Header | Required | Example | Stored on |
|--------|----------|---------|-----------|
| `X-RapidUI-Session-Id` | **Required** (guarded routes) | `550e8400-e29b-41d4-a716-446655440000` | `api_events.session_id`; joins to `agent_runs.session_id`. **Not required on `GET /llms.txt` only.** |
| `X-RapidUI-Agent` | Recommended | `claude`, `cursor`, `codex`, `rapidui-agent` | `api_events.agent` |
| `X-RapidUI-Eval-Case` | Eval runs only | `crud-admin-v0.2` | `api_events.eval_case_id` |
| `X-RapidUI-Intent` | Optional | `UC2 users admin` | `api_events.intent` |

**Wrapper addition (sketch):**

```txt
## Telemetry (v0.2)

Generate once per session:
  SESSION_ID=<uuid>

On every POST /api/validate and POST /api/specs, include:
  -H "X-RapidUI-Session-Id: $SESSION_ID"
  -H "X-RapidUI-Agent: claude"
  -H "X-RapidUI-Eval-Case: {{CASE_ID}}"
```

---

### Test plan (before checking boxes)

| Step | Command / action | Expected |
|------|------------------|----------|
| Unit path | `npm run smoke:observe` | Pass — api_event + ingest rows |
| Validate telemetry | `curl -X POST localhost:3000/api/validate -H 'Content-Type: application/json' -H 'X-RapidUI-Session-Id: test-1' -H 'X-RapidUI-Agent: manual' -d @fixture.json` | 200 + row in `api_events` with session/agent |
| Invalid JSON | POST validate with body `{` | 400 + `api_events` row with `valid` null |
| Save telemetry | POST golden RUI to `/api/specs` with same session header | 201 + row with `spec_id` populated |
| Ingest run | `curl -X POST localhost:3000/api/observe/ingest/agent -H 'Content-Type: application/json' -d '{"session_id":"ingest-1","run":{"outcome":"saved"}}'` | 200 `{ ok: true, runId }` + `agent_runs` row |
| Ingest turns | Same session + `turns:[{turn_index:0,had_validate_call:true}]` | `agent_turns` row linked to run |
| Ingest upsert | Repeat POST with updated `validate_attempts` | Single `agent_runs` row updated |
| Ingest bad payload | POST `{}` | 400 |
| Docs | `curl localhost:3000/api/docs \| jq '.sections'` or smoke:docs | Telemetry section present |
| Non-blocking | Temporarily break `DATABASE_URL` → validate still returns 200/400 | Response unchanged; error logged |
| Prod spot-check | Repeat one curl against `rapidui.dev` | Row visible in Neon console |

**SQL spot-check:**

```sql
SELECT endpoint, session_id, agent, valid, error_codes, spec_id, duration_ms
FROM api_events ORDER BY occurred_at DESC LIMIT 5;

SELECT session_id, outcome, validate_attempts FROM agent_runs ORDER BY started_at DESC LIMIT 5;
```

---

### Out of scope

- Observe dashboards (Phases 3, 6)
- FastAPI agent / `POST /chat` (Phase 4)
- Operations schema or v0.2 `/api/docs` rewrite (Phase 2)
- `POST /api/eval/log` (Phase 7 — **O3**)
- `eval_runs` column migrations (Phase 7)
- Ingest auth, rate limiting, IP allowlists
- `POST /api/observe/ingest/api-event` (optional future — not needed for v0.2)

### Checklist

- [x] `insertApiEvent()` writes Zod-validated rows to `api_events`
- [x] `POST /api/validate` and `POST /api/specs` call `recordApiEvent()` on every response path
- [x] Telemetry insert failure does not change API HTTP responses
- [x] Optional headers persisted when present; documented in `/api/docs`
- [x] *(Amendment — Phase 3B)* Headers become **required session id** on guarded routes; Phase 1 optional behavior superseded by §3 #37–38
- [x] `ingestAgentTelemetry()` upserts `agent_runs` + `agent_turns`
- [x] Ingest contract documented in `lib/observe/INGEST.md`; linked from `agent/README.md`
- [x] `eval/manual/wrapper_*.txt` include session header instructions
- [x] `npm run smoke:observe` passes locally
- [x] Manual test: validate + save with headers → `api_events` rows; ingest POST → agent tables

---

# Phase 2 — Operations schema + docs + eval cases

**Reference:** §6 (use cases), §7 (full schema), §9 Area 2, §14 (eval cases, scoring), §18

**Status:** Complete (verified 2026-07-19 — all smokes + build pass).

### Goal

Greenfield **operations-first** RUI v0.2 — Zod schemas, semantic validator (O1–O20), agent docs, golden fixtures, and eval cases. Satisfies ship criterion **S2**. Unblocks Phase 4 agent output and Phase 5 inspector data model.

### Depends on

Phase 0 (Postgres stable). Independent of Phase 1 telemetry (can run in parallel, but Phase 1 is already complete).

### Unlocks

Phases 4, 5; all v0.2 eval cases; use cases 1–3 (+ optional UC4 / O1).

---

### Repo audit (2026-07-19)

| Area | Current state | Phase 2 action |
|------|---------------|----------------|
| **`lib/registry/*`** | v0.1 Page → Section → block model; powers validate, `/api/schema`, docs, eval scoring, RuiInspector | **Remove** after `lib/operations/*` wired; migrate all imports |
| **`lib/operations/golden/`** | **Staged** — UC1–UC4 `.rui.json` files exist (804 lines total) | Audit against O1–O20 once validator exists; fix goldens if needed |
| **`lib/validate/*`** | v0.1 pipeline: `RuiSchema`, planned-gate, semantic checks for pages/navigation/tables | **Rewrite** — operations Zod parse + O1–O20 semantic modules |
| **`GET /api/schema`** | Returns `blocks`, `layouts`, `bindings`, `planned` | Replace payload with operations vocabulary (reference §7) |
| **`lib/docs/*`** | v0.1 prose (`Page`/`Section`/blocks); `DOCS_VERSION = "0.1"` | Rewrite markdown + API section for operations-first workflow |
| **`llms.txt`** | Block-tree discovery text | Rewrite for operations + flow patterns |
| **`eval/cases/`** | Only `support-dashboard-v0.1.json` (block-based criteria) | Add 3 required v0.2 cases; retire v0.1 case |
| **`eval/score.ts` / `lib/eval/scoreRun.ts`** | Scores `requiredBlocks` / `requiredBindings` via `collectBlocks.ts` | Replace with operation-aware scoring (`requiredOperations`, etc.) |
| **`eval/manual/wrapper_*.txt`** | Telemetry headers done (Phase 1); still says “block definitions” in workflow | Update workflow steps for operations discovery |
| **`scripts/smoke-*`** | Registry, validate, docs, eval, inspector smokes all assume v0.1 golden | Rewrite against UC goldens + v0.2 schema |
| **`lib/review/RuiInspector.tsx`** | Block-tree renderer | **Not** full rewrite (Phase 5) — add minimal v0.2 JSON fallback so app compiles and `/specs/:id` shows saved JSON |
| **Golden vs validator today** | UC goldens use `"version": "0.2"` — **fail** current validator (`VERSION_MISMATCH` expects `"0.1"`) | Expected; Phase 2 flips this |

**Golden inventory (already in git):**

| File | entities | ops | transitions | Notes |
|------|----------|-----|-------------|-------|
| `UC1-static-browse-v0.2.rui.json` | 2 | 2 | 0 | Static browse + header metrics |
| `UC2-crud-admin-v0.2.rui.json` | 1 | 4 | 5 | Scope selectors, cta/cancel, embedded delete |
| `UC3-ai-review-queue-v0.2.rui.json` | 1 | 2 | 1 | Embedded approve/reject `act` |
| `UC4-hr-ops-seed-v0.2.rui.json` | 3 | 6 | 4 | Optional UC4 seed (O1 stretch) |

**Known golden fix (audit before checklist):** UC2 `op-create-user` includes `context.breadcrumb` — reference §7 says breadcrumb belongs on `read`/`update` reached via transition, **not** on create entrypoints. Remove breadcrumb from create during golden audit.

---

### Resolved open questions

| Question | Decision |
|----------|----------|
| **UC4 seed: Neon vs file-only** | **Phase 2:** golden file + optional `spec-update-v0.2.json` eval case referencing golden by filename. **No Neon pre-seed required** for Phase 2 checklist. Optional stretch script `npm run seed:uc4` (save UC4 golden → print `specId`) for Phase 4 `load_spec` demo — defer unless pursuing O1 early. |
| **Which use-case variants ship** | **Phase 2:** canonical prompts only for 3 **required** cases (`static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2`). §7 variants V1–V6 → **Phase 7** (“at least one variant per UC” for portfolio polish). |
| **Golden files vs schema** | Goldens are the **acceptance fixtures** — implement schema + rules, then run `npm run smoke:validate` until all four pass. Fix goldens or rules; do not weaken rules to match mistakes. |
| **`registryVersion` response field** | **Keep field name** `registryVersion` in validate/save responses and DB columns — value becomes `"0.2"`. Avoid rename churn in telemetry and SavedSpec shape. |
| **`VALIDATION_VERSION` / `DOCS_VERSION`** | Bump both to **`"0.2"`**. |
| **`planned-gate` / PLANNED blocks** | **Remove** — v0.2 has no planned vocabulary; strict Zod + semantic rules only. |
| **v0.1 rejection behavior** | `version: "0.1"` (page-tree shape) → `VERSION_MISMATCH` with message requiring `"0.2"`. v0.2 doc with wrong top-level keys → Zod `UNKNOWN_PROP` / structural errors. |
| **Orphan operations (O14)** | **Warning** severity (`ORPHAN_OPERATION`) — does not fail validation; include in errors with distinct code or `severity: "warning"` if we extend error type. **v0.2 MVP:** emit as non-blocking warning in `errors[]` with code `ORPHAN_OPERATION` but still return `valid: true` if no errors-only failures — **simpler:** treat as error-level for agent feedback (reference lists as “warning” but agents should fix). **Locked:** emit `ORPHAN_OPERATION` as a **validation error** (fail) for v0.2 — keeps agent loop honest. |
| **RuiInspector during Phase 2–4** | Minimal shim: if `normalizedRui.version === "0.2"`, render operations placeholder + collapsible raw JSON (no block tree). Full operations inspector = **Phase 5**. |
| **`smoke-inspector`** | Update to assert v0.2 JSON fallback renders (not Page/Section labels). |
| **Eval `mode` field** | Add to `EvalCase`: `"guided" \| "single-shot"`. Required cases use `"guided"` + `conversationScript`. External manual runs stay single-shot. |
| **Retire v0.1 eval case** | Delete `eval/cases/support-dashboard-v0.1.json`; `smoke-eval.ts` scores UC1–UC3 goldens against all three required cases; `spec-update-v0.2` smoke deferred to Phase 4 (O1). |
| **Internal golden exposure** | Goldens stay **repo-only** — never in `/api/docs`, `llms.txt`, or agent prompts (reference §14). |

---

### Architecture (Phase 2)

```txt
POST /api/validate | /api/specs
        │
        ▼
  parseTransportRequest (unchanged)
        │
        ▼
  validateSpec(body)
        │
        ├── version gate → reject v0.1 (VERSION_MISMATCH)
        ├── OperationsRuiSchema (Zod strict)
        ├── mapZodIssues → operation-centric paths
        └── runSemanticChecks (O1–O20)
                  │
                  ├── ids, entities, operations, transitions
                  ├── outcomes, data bindings, presentations
                  └── scope propagation (O19)
        │
        ▼
  normalizeRui (deterministic sort: entities, operations, transitions)
        │
        ▼
  { valid: true, registryVersion: "0.2", normalizedRui }


GET /api/schema  ← getSchemaPayload() from lib/operations
GET /api/docs    ← rewritten markdown + API examples (operations paths in errors)
eval/score       ← collectFromOperations + successCriteria checklist
```

**Module layout (target):**

```txt
lib/operations/
  index.ts              # SCHEMA_VERSION, exports, getSchemaPayload()
  rui.ts                # root document schema
  entities.ts           # entities[], scope.selectors
  operations.ts         # operation types, presentations, embedded actions
  transitions.ts
  outcomes.ts
  data.ts               # static | api bindings
  ids.ts                # ent-*, op-* patterns
  rules.ts              # O1–O20 catalog for /api/schema

lib/validate/
  pipeline.ts           # rewrite — import from @/lib/operations
  normalize.ts          # rewrite — sort entities/operations/transitions
  messages.ts           # rewrite ERROR_CATALOG for operation codes
  semantic/
    index.ts
    ids.ts
    entities.ts
    operations.ts
    transitions.ts
    outcomes.ts
    data.ts
    presentations.ts
    scope.ts
  fixtures/             # v0.1-reject, duplicate op id, invalid transition, …
```

---

### Task list (build order)

#### A — Operations schema (Zod)

1. **`lib/operations/ids.ts`** — `ent-{name}`, `op-{name}` patterns; shared `isValidId()` (reuse v0.1 kebab rules or tighten per §7).
2. **`lib/operations/outcomes.ts`** — `OutcomeNavigate`, `OutcomeStay`, mutating outcome shapes.
3. **`lib/operations/data.ts`** — `static` \| `api`; `read` / `write` / `invoke` bindings; `records[]`, `bodyMap`.
4. **`lib/operations/operations.ts`** — discriminated union on `type`: `browse` \| `read` \| `create` \| `update` \| `delete`; presentation layouts (`table`, `form`, `detail`, `confirm`); embedded `actions[]` on `read`.
5. **`lib/operations/transitions.ts`** — `trigger`: `row` \| `link` \| `cta` \| `cancel`; optional `label`, `placement`, `map`.
6. **`lib/operations/entities.ts`** — `entrypoints`, `operationIds`, optional `scope.selectors`.
7. **`lib/operations/rui.ts`** — root: `version: "0.2"`, `app`, `entities[]`, `operations[]`, `transitions[]` (all `.strict()`).
8. **`lib/operations/rules.ts`** — O1–O20 rule catalog for `/api/schema`.
9. **`lib/operations/index.ts`** — export types/schemas; **`getSchemaPayload()`** per reference §7 (`operationTypes`, `presentationLayouts`, `flowPatterns`, `embeddedActionTypes`, `transitionTriggers`, compact `examples` — no full goldens).

#### B — Validator rewrite

10. **`lib/validate/version.ts`** — `VALIDATION_VERSION = "0.2"`.
11. **Remove `planned-gate.ts`** and all imports.
12. **Rewrite `pipeline.ts`** — early `version !== "0.2"` check; parse with `OperationsRuiSchema`; semantic checks; return `registryVersion: SCHEMA_VERSION`.
13. **Rewrite `zod-mapper.ts`** — paths like `operations[3].presentation.fields[0].name`.
14. **Implement semantic modules O1–O20** (split files above) — errors cite `operationId`, transition index, entity id.
15. **Rewrite `messages.ts`** — new `RuleCode` set + `ERROR_CATALOG` templates (operation-centric hints).
16. **Rewrite `normalize.ts`** — stable sort: entity id, operation id, transition `(from,to,trigger)`, form field names, table columns.

#### C — Golden audit + acceptance

17. Run validator against UC1–UC4; fix goldens (e.g. UC2 create breadcrumb) until all pass.
18. Replace `lib/validate/fixtures/*` — v0.1 page-tree rejection, duplicate operation id, missing `cta` when create exists (O18), invalid transition map (O6).
19. Remove dependency on `lib/registry/golden/support-dashboard.rui.json`.

#### D — Agent docs + schema API

20. **Rewrite `lib/docs/content/overview.md`** — operations-first thesis; v0.2 scope table.
21. **Rewrite `lib/docs/content/workflow.md`** — plan ops → map → validate → save (reference §7); update example error paths.
22. **Replace `nesting.md`** with **`operations.md`** (or rewrite in place) — entities, operation types, transitions, outcomes, embedded actions — **not** Page/Section tree.
23. **Update `lib/docs/index.ts`** — `DOCS_VERSION = "0.2"`; API section documents `version: "0.2"`, operations error examples; inspector note = operations view (Phase 5).
24. **Update `lib/docs/llms.ts`** — operations-first discovery blurb.
25. **`app/api/schema/route.ts`** — import `getSchemaPayload` from `@/lib/operations`.
26. **Update `eval/manual/wrapper_*.txt`** — “operations vocabulary” instead of blocks; list v0.2 case ids.

#### E — Eval cases + scoring

27. **Extend `eval/types.ts`** — `mode`, `conversationScript`, new `successCriteria` fields; deprecate `requiredBlocks` / `requiredBindings`.
28. **Create eval cases:**
    - `eval/cases/static-browse-v0.2.json`
    - `eval/cases/crud-admin-v0.2.json`
    - `eval/cases/ai-review-queue-v0.2.json`
    - *(optional)* `eval/cases/spec-update-v0.2.json` with `seedGolden: "UC4-hr-ops-seed-v0.2"`
29. **Replace `lib/eval/collectBlocks.ts`** → **`lib/eval/collectOperations.ts`** — walk `operations[]`, `transitions[]`, embedded actions, API paths.
30. **Rewrite `lib/eval/scoreRun.ts`** — outcome checklist + `maxUserTurns` / `maxRetries` process caps.
31. **Delete `eval/cases/support-dashboard-v0.1.json`.**

#### F — Import migration + cleanup

32. Update **`lib/db/types.ts`**, **`lib/db/specs.ts`**, **`lib/db/hash.ts`** — import `Rui` from `@/lib/operations`.
33. **Minimal `RuiInspector` shim** — v0.2 JSON panel + “Operations inspector ships in Phase 5” notice.
34. **Delete `lib/registry/**`** (entire directory).
35. Update **`package.json`** script: `smoke:registry` → `smoke:operations` (or keep alias).

#### G — Smoke tests

36. **`scripts/smoke-operations.ts`** — schema version 0.2, strict mode, golden UC1 parses.
37. **`scripts/smoke-validate.ts`** — all UC goldens pass; v0.1 fixture rejected; normalization stable.
38. **`scripts/smoke-docs.ts`** — docs/schema version 0.2; no block vocabulary; UC1 validates.
39. **`scripts/smoke-eval.ts`** — save UC1–UC3 goldens; score against all three required v0.2 cases (`static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2`). **`spec-update-v0.2` / UC4 scoring smoke deferred to Phase 4 (O1)** — see **Eval smoke coverage** below.
40. **`scripts/smoke-inspector.ts`** — v0.2 fallback HTML includes raw JSON.
41. **`scripts/smoke-specs.ts`** — save UC3 golden to Neon (if DB available).

---

### Files to create / modify

**Create**

```txt
lib/operations/index.ts
lib/operations/rui.ts
lib/operations/entities.ts
lib/operations/operations.ts
lib/operations/transitions.ts
lib/operations/outcomes.ts
lib/operations/data.ts
lib/operations/ids.ts
lib/operations/rules.ts
lib/validate/semantic/entities.ts
lib/validate/semantic/operations.ts
lib/validate/semantic/transitions.ts
lib/validate/semantic/outcomes.ts
lib/validate/semantic/data.ts
lib/validate/semantic/presentations.ts
lib/validate/semantic/scope.ts
lib/eval/collectOperations.ts
lib/docs/content/operations.md
eval/cases/static-browse-v0.2.json
eval/cases/crud-admin-v0.2.json
eval/cases/ai-review-queue-v0.2.json
eval/cases/spec-update-v0.2.json          # optional UC4
scripts/smoke-operations.ts               # replaces smoke-registry.ts
```

**Modify**

```txt
lib/validate/pipeline.ts
lib/validate/normalize.ts
lib/validate/messages.ts
lib/validate/zod-mapper.ts
lib/validate/types.ts                     # RuleCode import from operations
lib/validate/semantic/index.ts
lib/validate/semantic/ids.ts
lib/validate/version.ts
lib/validate/fixtures/*
lib/docs/index.ts
lib/docs/llms.ts
lib/docs/content/overview.md
lib/docs/content/workflow.md
lib/docs/content/getting-started.md
eval/types.ts
lib/eval/scoreRun.ts
eval/manual/wrapper_local.txt
eval/manual/wrapper_prod.txt
lib/review/RuiInspector.tsx               # minimal v0.2 shim only
lib/db/types.ts
lib/db/specs.ts
app/api/schema/route.ts
scripts/smoke-validate.ts
scripts/smoke-docs.ts
scripts/smoke-eval.ts
scripts/smoke-inspector.ts
scripts/smoke-specs.ts
package.json
```

**Delete**

```txt
lib/registry/**                           # entire v0.1 registry
lib/validate/planned-gate.ts
lib/eval/collectBlocks.ts
eval/cases/support-dashboard-v0.1.json
scripts/smoke-registry.ts                 # replaced by smoke-operations.ts
lib/docs/content/nesting.md               # replaced by operations.md (or rewritten)
```

---

### Semantic rules → error codes (implement O1–O20)

| Rule | Code (suggested) | Fail? |
|------|------------------|-------|
| O1 version `"0.2"` | `VERSION_MISMATCH` | yes |
| O2 unique operation ids | `DUPLICATE_ID` | yes |
| O3 transition refs | `INVALID_TRANSITION_REF` | yes |
| O4 entity membership | `INVALID_ENTITY_REF` | yes |
| O5 row from browse | `INVALID_TRANSITION_TRIGGER` | yes |
| O6 map ⊆ columns | `INVALID_TRANSITION_MAP` | yes |
| O7 api bindings | `MISSING_DATA_BINDING` | yes |
| O8 static no API | `STATIC_API_CONFLICT` | yes |
| O9 route params | `ROUTE_PARAM_MISMATCH` | yes |
| O10 form fields / bodyMap | `INVALID_FORM_FIELD` | yes |
| O11 embedded actions | `INVALID_EMBEDDED_ACTION` | yes |
| O12 delete method DELETE | `INVALID_DELETE_METHOD` | yes |
| O13 breadcrumb target | `INVALID_BREADCRUMB` | yes |
| O14 orphan operations | `ORPHAN_OPERATION` | yes (locked above) |
| O15 route + params | `MISSING_ROUTE` | yes |
| O16 mutating outcomes | `MISSING_OUTCOME` | yes |
| O17 embedded outcomes | `MISSING_OUTCOME` | yes |
| O18 browse+create needs cta | `MISSING_CTA_TRANSITION` | yes |
| O19 scope placeholders | `SCOPE_PLACEHOLDER_MISSING` | yes |
| O20 trigger enum | `INVALID_TRANSITION_TRIGGER` | yes |

Error `path` examples: `operations[op-read-user].presentation.actions[0].outcomes`, `transitions[1].map.userId`.

---

### Eval cases (canonical — Phase 2)

**Required for ship (3 files):**

| Case id | UC | mode | conversationScript |
|---------|-----|------|-------------------|
| `static-browse-v0.2` | 1 | `guided` | 1–2 turns clarifying static data layout |
| `crud-admin-v0.2` | 2 | `guided` | 2 turns (API details + confirm build) |
| `ai-review-queue-v0.2` | 3 | `guided` | 2 turns (endpoints + approve/reject on detail) |

**Optional (UC4 / O1):** `spec-update-v0.2` — references `UC4-hr-ops-seed-v0.2.rui.json`; scoring checks added operations/transitions after edit. No Neon seed in Phase 2.

**Example `successCriteria` (`crud-admin-v0.2`):**

```json
{
  "mustValidate": true,
  "maxRetries": 5,
  "maxUserTurns": 4,
  "requiredOperations": ["browse", "read", "create", "update"],
  "requiredEmbeddedActions": ["delete"],
  "requiredTransitions": ["row", "cta", "cancel"],
  "requiredDataPaths": [
    "GET /api/users",
    "POST /api/users",
    "PATCH /api/users/{userId}",
    "DELETE /api/users/{userId}"
  ]
}
```

---

### Eval smoke coverage

| Case | Golden | `smoke:eval` | Notes |
|------|--------|--------------|-------|
| `static-browse-v0.2` | UC1 | **Yes** | browse-only; empty transitions/data-path criteria |
| `crud-admin-v0.2` | UC2 | **Yes** | full CRUD, scope, embedded delete, transitions |
| `ai-review-queue-v0.2` | UC3 | **Yes** | HITL pattern, embedded `act`, row transitions |
| `spec-update-v0.2` | UC4 seed | **No (Phase 4 / O1)** | Case JSON exists; scoring expects a *post-edit* spec, not the seed golden alone. UC4 **validates** in `smoke:validate`; add `smoke:eval` for `spec-update-v0.2` when Phase 4 `load_spec` lands (committed “updated UC4” golden or integration test). |

**Rationale:** All three **required** cases exercise different `collectOperations` / `scoreRun` paths — lightweight loop in `scripts/smoke-eval.ts`, no new infrastructure. Optional UC4 update-case smoke waits for agent `load_spec` and an updated fixture.

---

### Test plan (before checking boxes)

| Step | Command / action | Expected |
|------|------------------|----------|
| Schema | `npm run smoke:operations` | version 0.2 payload; strict Zod rejects extra props |
| Goldens | `npm run smoke:validate` | UC1–UC4 all `valid: true` |
| v0.1 reject | POST v0.1 page-tree fixture to `/api/validate` | `VERSION_MISMATCH` or structural fail with clear hint |
| Docs | `npm run smoke:docs` | docsVersion 0.2; operations workflow; UC1 validates |
| Eval score | `npm run smoke:eval` | UC1–UC3 goldens pass `static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2` |
| Eval prompt | `npm run eval:prompt -- --case crud-admin-v0.2 --env local` | Prompt renders; `{{CASE_ID}}` replaced |
| Schema HTTP | `curl localhost:3000/api/schema \| jq '.version'` | `"0.2"` |
| Save v0.2 | `npm run smoke:specs` (update fixture) | 201 with `registryVersion: "0.2"` |
| Inspector shim | `npm run smoke:inspector` | v0.2 JSON fallback renders |
| Registry gone | `test ! -d lib/registry` | directory removed |
| Observe unchanged | `npm run smoke:observe` | Phase 1 telemetry still passes |

**Manual spot-check:** POST UC3 golden to `/api/validate` — error messages reference operation ids, not `pages[0].children`.

---

### Out of scope

- Full **RuiInspector** operations view (Phase 5)
- Renderer / live API execution
- FastAPI agent / tools (Phase 4)
- Observe dashboards (Phases 3, 6)
- Eval matrix / variants V1–V6 (Phase 7)
- `POST /api/eval/log` (Phase 7 — O3)
- Neon UC4 seed script (optional — only if pursuing O1 before Phase 4)
- **`smoke:eval` for `spec-update-v0.2`** — deferred to Phase 4 / O1 (see **Eval smoke coverage**); UC4 golden still validated in `smoke:validate`
- `eval_runs` column extensions (Phase 7)

### Known temporary regressions (acceptable until Phase 5)

- `/specs/:id` shows JSON fallback for v0.2 specs — not a rich operations inspector
- Homepage may still be v0.1 link hub until Phase 5

### Checklist

- [x] `lib/operations/*` Zod schemas cover §7 bounded vocabulary
- [x] Validator implements O1–O20; errors cite operations/transitions
- [x] All four goldens validate (UC4 optional for ship but should pass in repo)
- [x] v0.1-shaped RUI rejected with clear `VERSION_MISMATCH` / structural errors
- [x] `lib/registry/*` removed; no imports remain
- [x] `/api/schema` returns v0.2 vocabulary (`operationTypes`, `flowPatterns`, …)
- [x] `/api/docs` + `llms.txt` describe operations-first workflow
- [x] Three required eval case JSON files exist; v0.1 case deleted
- [x] `eval/score.ts` passes goldens against all three required v0.2 criteria (UC1–UC3 via `smoke:eval`)
- [x] `npm run eval:prompt -- --case crud-admin-v0.2 --env local` works
- [x] All smoke scripts updated and passing
- [x] RuiInspector v0.2 JSON shim compiles (full inspector deferred to Phase 5)

---

# Phase 3 — Observe: hub + API dashboard

**Reference:** §5 (routes), §9 Area 3, §10 (`api_events`, `eval_runs`), §12 (external agents), §15 S3/S4/S8, §16 (deferrals)

**Status:** Complete (verified 2026-07-19 — 3A core + 3B discovery + session identity; smokes + build + Path B manual pass).

### Goal

Ship the **Observe shell** and a **demo-ready API dashboard** covering the **full agent API journey** — discovery → validate → save. Built in **two implementation stages** (3A then 3B) under one Phase 3 checklist.

| Stage | Scope |
|-------|--------|
| **3A — Core** | Hub, API dashboard (validate/save sessions), session timeline, Agent/Evals placeholders |
| **3B — Discovery & health** | Extend `api_events` for GET discovery/health routes; funnel + endpoint availability on hub + API dashboard |

Satisfies **S3 visibility** and enables **S8** Path B. Stage 3B answers the production question: *“Did the agent reach our docs before validate failed?”*

### Depends on

Phase 1 (`api_events`, headers, `lib/observe/writes.ts`). Phase 2 not required for queries.

### Unlocks

Path B demo; full-session timeline (with 3B); shared Observe shell for Phases 6–7.

---

### Implementation readiness (post–Phase 2 audit)

| Check | Status |
|-------|--------|
| Phase 0–2 complete; `api_events` write path live | ✅ |
| Phase 3 UX, metrics, route map, session policy locked | ✅ |
| All Phase 3 open questions resolved inline below | ✅ |
| `app/observe/*`, `lib/observe/queries.ts` exist | ✅ |
| Session enforcement + discovery telemetry | ✅ |
| Docs/wrappers say session **required** (not optional) | ✅ |
| Smokes send session on all guarded calls | ✅ (`smoke:observe-discovery` + route handler tests) |

**Verdict:** Phase 3 is **cohesive and implementation-ready**. No blocking open questions remain. Build **3A first** (Observe UI + queries against existing POST telemetry), then **3B** (discovery GETs + mandatory session — breaking change for curl without headers).

**Known 3B side effect:** The v0.1 link-hub homepage links to `/api/docs`, `/api/schema`, etc. without session headers — those URLs will return **400** after 3B. Acceptable until Phase 5 replaces the homepage; human spec review stays on **`/specs/:id`** (server reads Neon directly, not the guarded API route).

---

### Phase 3 build stages

```txt
Stage 3A — Core Observe (ship first)
  Hub /observe + layout/nav
  /observe/api — validate/save stats + hero sessions table
  /observe/api/sessions/[id] — timeline (validate + save only initially)
  /observe/agent + /observe/evals — placeholders
  lib/observe/queries.ts — read layer for 3A metrics
  smoke:observe-api

Stage 3B — Discovery & API health + session enforcement (after 3A)
  Extend api_events endpoint enum + recordDiscoveryEvent()
  assertSessionId() gate on guarded routes → 400 MISSING_SESSION_ID
  Instrument GET routes; llms.txt anonymous-only (no session)
  Docs + llms.txt + eval wrappers — session workflow
  queries — discovery + funnel; drop "unlabeled POST" as primary metric
  Hub + API dashboard discovery sections
  Session timeline — full journey
  smoke:observe-discovery + update smoke:validate/specs for required session
```

**Explicitly out of 3B:** homepage (`/`) stats, Vercel Web Analytics, chart libraries.

**Handoff to Phase 4:** RapidUI Agent `fetch_docs` / `fetch_schema` tools must send `X-RapidUI-*` headers on GET (document in 3B; implement in Phase 4).

---

### Session identity policy (locked — reference §3 #37–38)

**Mock auth for v0.2** — mandatory **`X-RapidUI-Session-Id`** on all agent API traffic except **`GET /llms.txt`**. Not OAuth; UUID is **identification + Observe correlation**, forgeable but sufficient for portfolio. **v0.3+** replaces with WorkOS / OAuth OBO agent tokens (same slot, cryptographic trust).

#### Route tiers

| Tier | Routes | Session required? | On missing session |
|------|--------|-------------------|---------------------|
| **Unguarded discovery** | `GET /llms.txt` | **No** | N/A — log anonymous hit to `api_events` (3B) |
| **Guarded agent API** | `GET /api/docs`, `GET /api/schema`, `GET /api/health`, `POST /api/validate`, `POST /api/specs`, `GET /api/specs/:id` | **Yes** | **400** transport error `MISSING_SESSION_ID` |
| **Human / Observe UI** | `/`, `/specs/:id`, `/observe/*` | No | N/A — browser pages |
| **Ingest / internal** | `POST /api/observe/ingest/agent` | N/A (body `session_id`) | Existing Zod validation |

#### Header rules

| Header | Required? | Notes |
|--------|-----------|--------|
| **`X-RapidUI-Session-Id`** | **Yes** (guarded routes) | Non-empty string; trim whitespace; agents generate UUID at workflow start |
| **`X-RapidUI-Agent`** | Recommended | `claude`, `cursor`, `codex`, `rapidui-agent`, … |
| **`X-RapidUI-Eval-Case`** | Eval only | Optional |
| **`X-RapidUI-Intent`** | Optional | Short label |

#### Agent onboarding (document in llms.txt + `/api/docs`)

```txt
Step 1: GET /llms.txt (no headers)
Step 2: Generate SESSION_ID=<uuid> — agent may ask user or self-generate
Step 3: All further API calls include -H "X-RapidUI-Session-Id: $SESSION_ID"
```

#### Error response (guarded routes, missing session)

HTTP **400** — same transport shape as `INVALID_JSON`:

```json
{
  "valid": false,
  "errors": [{
    "path": "",
    "code": "MISSING_SESSION_ID",
    "message": "X-RapidUI-Session-Id is required on this endpoint. Read GET /llms.txt for session rules.",
    "hint": "Generate once per session: uuidgen (or crypto.randomUUID). Send on every request after llms.txt."
  }]
}
```

Still call `recordApiEvent` / `recordDiscoveryEvent` when possible **after** gate passes (guarded routes with valid session only).

#### Phase 1 amendment

Phase 1 shipped **optional** headers (telemetry best-effort). **Stage 3B enforces** required session — contract upgrade. Update smokes, docs, wrappers, and agent tools accordingly.

#### v0.3 migration (document only — not implemented in v0.2)

```txt
v0.2  X-RapidUI-Session-Id (UUID, required)
v0.3  Authorization: Bearer <WorkOS agent-scoped token> + optional correlation header
      Same Observe tables; stronger identity claims in token
```

**Interview line:** *"Public llms.txt, then mandatory session identity — mock for WorkOS agent auth. Observe tracks discovery → validate → save from first guarded call."*

---

### Route map (Phase 3)

```txt
/observe                          ← Overview hub (default Observe entry)
├── /observe/api                  ← API dashboard (FULL — Phase 3)
│   └── /observe/api/sessions/[sessionId]   ← Session timeline drill-down
├── /observe/agent                ← Placeholder scaffold (Phase 6 implements)
└── /observe/evals                ← Placeholder scaffold (Phase 7 implements)
```

**No redirect** from `/observe` → `/observe/api`. The hub orients and routes; API is one click away.

---

### Product framing (interview/demo)

| Audience | Job to be done |
|----------|----------------|
| **Demo (Path B)** | Terminal agent run → find session in &lt;10s → walk validate retries → open saved spec |
| **Interviewer** | Prove agent-agnostic API telemetry + validate-as-feedback-loop without raw SQL |
| **Future you** | Compare agents, spot error patterns, tie eval cases to sessions |

**Primary demo narrative (after 3B):** *Agents discover via llms.txt → docs → schema → validate loop → save — all visible on one session timeline.*

**Recommended live demo script:**

```txt
1. /observe — hub shows API zone (discovery hits + validate/save pulse after 3B)
2. /observe/api — headline stats + discovery section (3B)
3. Filter agent = claude → pick session
4. Session timeline: GET llms.txt → docs → schema → validate fails → pass → save
5. Open /specs/:id
6. (After Phase 6) Same session_id on /observe/agent
```

**Production rationale (3B):** If validate/save fails mysteriously, Observe shows whether discovery endpoints were hit, whether docs/schema were fetched, and whether the session had headers from the start — not just the last POST.

---

### Repo audit (2026-07-19 — post–Phase 2)

| Area | Current state | Phase 3 action |
|------|---------------|----------------|
| **`app/observe/`** | Missing | Hub + API pages + session detail + agent/evals placeholders |
| **`lib/observe/queries.ts`** | Missing | Read layer: hub teasers, API summary, sessions, timeline |
| **`lib/observe/schemas.ts`** | `API_ENDPOINTS`: `/api/validate`, `/api/specs` only | **3B:** add `/llms.txt`, `/api/docs`, `/api/schema`, `/api/health` |
| **`lib/observe/telemetry.ts`** | `recordApiEvent()` for POST validate/specs | **3B:** add `recordDiscoveryEvent()` |
| **`lib/observe/headers.ts`** | `parseTelemetryHeaders()` — all optional | **3B:** extend with session parsing used by gate |
| **`lib/observe/session-gate.ts`** | Missing | **3B:** `assertSessionId()` + `missingSessionIdFailure()` |
| **Guarded routes** | No session gate; validate/specs always log telemetry | **3B:** gate **before** handler; no `api_events` row on missing session |
| **GET routes** | No telemetry; docs/schema cache 1h | **3B:** `recordDiscoveryEvent` after gate; llms.txt logs anonymous (no gate) |
| **`GET /api/specs/:id`** | Unguarded JSON API (Phase 4 `load_spec`) | **3B:** session gate only — **no** discovery telemetry row |
| **`api_events`** | Migration `003`; indexes on `occurred_at`, `session_id` | **3A:** query only. **3B:** no DDL — `endpoint` is TEXT |
| **`eval_runs`** | v0.1 columns; no `session_id` | Hub/evals teaser via `getEvalTeaser()` — full matrix → Phase 7 |
| **`agent_runs`** | Phase 1 ingest wired | Hub placeholder only — metrics → Phase 6 |
| **`lib/docs/index.ts`** | Telemetry = “optional headers” | **3B:** required + recommended split; GET routes need session |
| **`lib/docs/llms.ts` + `instructions.md`** | No session workflow | **3B:** steps 1–3 onboarding block |
| **`eval/manual/wrapper_*.txt`** | Session on POST only | **3B:** `SESSION_ID` before GET docs/schema |
| **`lib/operations/rules.ts`** | `RuleCode` has `INVALID_JSON`; no `MISSING_SESSION_ID` | **3B:** add transport code to `RuleCode` |
| **`scripts/smoke-*`** | No session on validate/specs/docs smokes | **3A:** `smoke:observe-api`. **3B:** update smokes + `smoke:observe-discovery` |
| **`next.config.ts`** | Empty | **No redirect** — `/observe` is a real page |
| **UI stack** | Tailwind 4 + zinc palette (`app/page.tsx`, `RuiInspector`) | Match zinc stat cards + HTML tables; no chart library |
| **Phase 2** | Operations + eval cases complete | Filters use v0.2 eval case ids in `eval_case_id` column |

---

### Resolved open questions

| Question | Decision |
|----------|----------|
| **Observe entry** | **`/observe` overview hub** — three zone cards (API · Agent · Evals). Replaces earlier “redirect to `/observe/api`” plan. Update reference §3 #22 in spirit (hub is now in v0.2). |
| **Session drill-down** | `/observe/api` summary + **`/observe/api/sessions/[sessionId]`** chronological timeline (one row per `api_events` event). |
| **API page hero** | **Recent sessions table** is the primary workspace (above-the-fold, below headline stats) — not buried under analytics. |
| **Headline metric: retries** | **Avg validate attempts before save** — average validate count among sessions with a saved spec (`final_spec_id` set). Label: “Avg tries before save”. Secondary stat: session count with headers. |
| **Validate success rate** | `valid = true` ÷ validate events where `valid IS NOT NULL`. Transport (`valid IS NULL`) excluded; show transport count separately if &gt; 0. |
| **Time window** | **Last 30 days** default (`OBSERVE_DEFAULT_WINDOW_DAYS = 30` in `queries.ts`). |
| **Filters (API page)** | URL params: **`?agent=`**, **`?evalCase=`**, **`?session=`** (exact session id search for Path B). `<form method="get">` — no client JS required. |
| **Eval pass rate on API page** | **Removed** — belongs on `/observe/evals` (Phase 7). API page shows **eval case as session metadata** (badge/filter) only. |
| **Agent / Evals pages** | **Placeholder scaffold only** in Phase 3 — title, “ships in Phase N”, what will appear, link back to hub/API. No queries against `agent_runs` yet. |
| **Hub Agent / Evals cards** | **API card:** live stats from `api_events`. **Agent card:** static copy + “—” metrics + “Phase 6”. **Evals card:** optional single pass-rate % from `eval_runs` if rows exist, else “—” + “Phase 7”. |
| **Rendering** | RSC + `force-dynamic` on Observe pages. No public JSON API for dashboard data. |
| **Auth** | None (§3 #7). |
| **Charts** | Deferred — tables + stat cards only. |
| **Cross-links** | Session detail → `/specs/:id` on save; footer link “View agent run →” `/observe/agent` (placeholder until Phase 6). |
| **Discovery telemetry (3B)** | **Extend `api_events`** — same table, same Observe queries path. New `endpoint` values: `/llms.txt`, `/api/docs`, `/api/schema`, `/api/health`. GET rows: `valid`, `error_codes`, `spec_id` always `null`; keep `session_id`, `agent`, `duration_ms`, `occurred_at`. |
| **Discovery routes to instrument** | **`/llms.txt`**, **`GET /api/docs`**, **`GET /api/schema`**, **`GET /api/health`** — agent discovery + platform health. **Not** homepage `/`, **not** `GET /api/specs/:id`. |
| **Headers on GET (3B)** | **`X-RapidUI-Session-Id` required** on guarded GETs. **`llms.txt` only** accepts anonymous requests. |
| **Session enforcement (3B)** | **`assertSessionId()`** in `session-gate.ts`; **400** `MISSING_SESSION_ID` before business logic. Add to **`RuleCode`** + **`ERROR_CATALOG`**. |
| **Unlabeled traffic metric** | **Removed as primary KPI** after enforcement — only **llms.txt anonymous hits** remain unlabeled by design. |
| **Agent identity on discovery** | **`X-RapidUI-Agent`** when provided; optional log `User-Agent` as `notes` in future — **not v0.2**. Do not rely on User-Agent for dashboard breakdown. |
| **CDN / cache caveat** | `/api/docs` + `/api/schema` use `Cache-Control: public, max-age=3600` — edge cache may reduce origin hit count. Accept for v0.2; first fetch per agent/session still logs. Mention in interview if asked. |
| **Overview hub + discovery (3B)** | **API zone card** adds discovery pulse: e.g. “847 discovery hits · llms.txt ✓ docs ✓ schema ✓” (counts in window). Signals **API availability** at a glance — feeds overview **and** API dashboard. |
| **Session timeline (3B)** | **`getSessionTimeline`** returns **all** `api_events` for session — discovery GETs first, then validate/save. Visual: neutral styling for discovery, existing colors for validate/save. |
| **Session gate response on GET JSON routes** | Same **`TransportFailure`** shape as validate (`{ valid: false, errors: [{ code: "MISSING_SESSION_ID", … }] }`) — even for `/api/docs`, `/api/schema`, `/api/health`, `/api/specs/:id`. Agents already expect validation-style errors. |
| **Shared gate helper** | **`lib/observe/session-gate.ts`**: `assertSessionId(request)` → `{ ok: true, sessionId, headers }` or `{ ok: false, error: TransportFailure }`. |
| **No telemetry on gate failure** | Missing session → 400, **no** `api_events` insert. Only successful guarded requests log. |
| **Homepage API links after 3B** | v0.1 link-hub `GET /api/docs` links break without session — **acceptable** until Phase 5. Optional tiny fix: add “Agents: start at /llms.txt” note — not required for Phase 3 checklist. |
| **Eval teaser query** | `getEvalTeaser()`: overall pass % from `eval_runs` in window; `/observe/evals` placeholder mini-table = `GROUP BY eval_case_id` (passed/total). No join to `api_events` (no `session_id` on eval_runs yet). |
| **Relative timestamps** | Use `Intl.RelativeTimeFormat` or simple “N min ago” in RSC — no `date-fns` dependency. |
| **Session search UX** | `?session=` exact match primary; optional `ILIKE` prefix for partial paste — implement prefix only if trivial. |

---

### Session gate helper (3B — implement once, wire everywhere)

```txt
lib/observe/session-gate.ts
  assertSessionId(request: Request):
    → { ok: true, sessionId: string, headers: TelemetryHeaders }
    → { ok: false, error: TransportFailure }   // use formatError("MISSING_SESSION_ID")

Guarded route pattern:
  const startedAt = Date.now()
  const gate = assertSessionId(request)
  if (!gate.ok) return NextResponse.json(gate.error, { status: 400 })
  // … handler logic …
  await recordApiEvent / recordDiscoveryEvent({ request, …, startedAt })
```

Add **`MISSING_SESSION_ID`** to **`lib/operations/rules.ts`** `RuleCode` (alongside `INVALID_JSON`) **and** **`lib/validate/messages.ts`** `ERROR_CATALOG` — not an O1–O20 semantic rule.

---

### Query layer types (`lib/observe/queries.ts`)

Export shapes for pages (keep flat — no chart library):

```typescript
type SessionOutcome = "saved" | "failed" | "in_progress";

type ObserveFilters = { agent?: string; evalCase?: string; session?: string; windowDays?: number };

type ApiEventRow = {
  id: string;
  occurred_at: Date;
  endpoint: string;
  session_id: string | null;
  agent: string | null;
  eval_case_id: string | null;
  intent: string | null;
  valid: boolean | null;
  error_codes: string[] | null;
  spec_id: string | null;
  duration_ms: number | null;
};

type SessionListRow = {
  sessionId: string;
  agent: string | null;
  evalCaseId: string | null;
  validateCount: number;
  outcome: SessionOutcome;
  finalSpecId: string | null;
  lastActivityAt: Date;
};

type ObserveHubSummary = {
  apiRequestCount: number;
  validateSuccessRate: number | null;
  specsSaved: number;
  discoveryHits?: number;        // 3B
  discoveryByEndpoint?: Record<string, number>;  // 3B
};

type ApiObserveSummary = ObserveHubSummary & {
  sessionCount: number;
  avgTriesBeforeSave: number | null;
  transportFailureCount: number;
  topErrorCodes: { code: string; count: number }[];
  savesByAgent: { agent: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
  funnel?: { llms: number; docs: number; schema: number; validate: number; save: number };  // 3B
};
```

**3A timeline filter:** `getSessionTimeline` initially filters `endpoint IN ('/api/validate', '/api/specs')`. **3B:** remove filter — all endpoints for session, sort `occurred_at ASC`.

---

### User flows — API dashboard

| # | Flow | Steps | Demo impact |
|---|------|-------|-------------|
| **F1** | **Path B session replay** | Filter agent → pick session → timeline → spec link | **Highest** — core product story |
| **F2** | **Platform health** | Land on `/observe/api` → read headline stats | Quick “telemetry works” |
| **F3** | **Validation feedback loop** | Top error codes → sessions with those codes → retries in timeline | Strong without live run |
| **F4** | **Multi-agent** | Toggle `?agent=claude` vs `cursor` vs `rapidui-agent` | After Phase 4 |
| **F5** | **Eval context** | Filter `?evalCase=crud-admin-v0.2` → session list | Lighter; full matrix on Evals page |

**Session search (F1):** When the terminal prints `SESSION_ID=…`, paste into `?session=` or dedicated search input → jump to session detail or filtered list.

---

### Architecture

```txt
GET /observe
        │
        ▼
app/observe/page.tsx
        ├── getObserveHubSummary()     ← 3A: validate/save teasers
        │                              ← 3B: + discovery hit counts / health pulse
        └── static Agent / Evals placeholders


GET /observe/api[?agent=&evalCase=&session=]
        │
        ▼
app/observe/api/page.tsx
        ├── getApiObserveSummary()     ← 3B: includes discoveryByEndpoint, funnel
        ├── listRecentSessions()       ← hero table
        └── supporting tables


GET /observe/api/sessions/[sessionId]
        │
        ▼
getSessionTimeline(sessionId)          ← 3A: validate + save
                                       ← 3B: + llms.txt, docs, schema, health


── Write path (3B) ──
GET /llms.txt | /api/docs | /api/schema | /api/health
        │
        └── recordDiscoveryEvent() ──► api_events (same table as validate/save)
```

Shared: **`app/observe/layout.tsx`** + **`components/observe/ObserveNav.tsx`** (Overview · API · Agent · Evals).

---

### Page specs

#### `/observe` — Overview hub

```txt
┌─────────────────────────────────────────────────────────────┐
│ Observe — Platform analytics                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─ API ──────────────┐ ┌─ Agent ────────────┐ ┌─ Evals ─────┐ │
│ │ 142 API requests   │ │ Phase 6            │ │ Phase 7     │ │
│ │ 87% validate OK    │ │ Runs · tokens ·    │ │ Pass rate · │ │
│ │ 12 specs saved     │ │ latency            │ │ matrix      │ │
│ │ 847 discovery hits │ │                    │ │             │ │
│ │ llms·docs·schema ✓ │ │                    │ │             │ │
│ │ [View API →]       │ │ [View Agent →]     │ │ [View →]    │ │
│ └────────────────────┘ └────────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- **API zone (3A):** validate/save stats from `getObserveHubSummary()`.
- **API zone (3B):** add **discovery pulse** — discovery GET count + per-endpoint breakdown (llms.txt, docs, schema). Overview **API health** signal: discovery endpoints are reachable and being used.
- **Agent zone:** muted card — “RapidUI Agent metrics — Phase 6” + bullet list of future metrics (runs, p95 latency, tokens, validate attempts).
- **Evals zone:** muted card — “Eval lab — Phase 7”; if `eval_runs` has rows, show overall pass rate % as teaser only.

#### `/observe/api` — API dashboard (wireframe)

```txt
Observe › API     [Agent ▼] [Eval case ▼] [Session id 🔍]

── Discovery & health (3B) ────────────────────────────────────
[Discovery hits] [llms.txt] [docs] [schema] [health checks]

| [Sessions] [Validate OK %] [Specs saved] [Avg tries→save] [Discovery hits]

── RECENT SESSIONS (hero) ───────────────────────────────────
...

── Supporting ────────────────────────────────────────────────
Session funnel (3B): llms → docs → schema → validate → save
Top error codes          │  Saves by agent
Requests by day          │
```

**Discovery stat row (3B — above validate/save cards):**

| Card | Source |
|------|--------|
| Discovery hits | COUNT where endpoint IN discovery paths |
| llms.txt | COUNT endpoint = `/llms.txt` |
| /api/docs | COUNT endpoint = `/api/docs` |
| /api/schema | COUNT endpoint = `/api/schema` |
| /api/health | COUNT endpoint = `/api/health` |

**Headline stat cards — validate/save (5):**

| Card | Source |
|------|--------|
| Sessions | Distinct `session_id` in window |
| Validate success % | See resolved questions |
| Specs saved | Events with non-null `spec_id` |
| Avg tries before save | Mean validate count where session has save |
| Discovery hits (3B) | Anonymous llms.txt + guarded discovery GETs |

**Recent sessions table (hero columns):**

| Column | Notes |
|--------|--------|
| Session | Link to detail; monospace truncate |
| Agent | Badge |
| Eval case | If present |
| Validates | Count |
| Outcome | **Saved** / **Failed** / **In progress** (heuristic: saved if `final_spec_id`; failed if last validate false and no save; else in progress) |
| Spec | Link if saved |
| Last activity | Relative time |

**Supporting tables (below fold):** session funnel (3B), top error codes, saves by agent, requests by day.

**Session funnel (3B):** For sessions with `session_id`, show counts that reached each stage:

```txt
llms.txt → /api/docs → /api/schema → validate → save
  847        612          589           214        89
```

Uses `BOOL_OR(endpoint = …)` per session — best demo metric for “agents read docs first.”

**Empty state:** Zero POST events → Path B instructions; if discovery &gt; 0 but no sessions, explain headers on validate/save.

#### `/observe/api/sessions/[sessionId]` — Session detail

```txt
┌─ Summary ───────────────────────────────────────────────────┐
│ agent · eval case · intent · duration                         │
│ N validate attempts · outcome · saved → /specs/…              │
└───────────────────────────────────────────────────────────────┘

┌─ Timeline (ascending) ──────────────────────────────────────┐
│ …      GET /llms.txt       discovery                        │
│ …      GET /api/docs       discovery                        │
│ …      GET /api/schema     discovery                        │
│ …      POST /api/validate  ✗ fail   MISSING_CTA, …     142ms │
│ …      POST /api/validate  ✓ ok                         98ms │
│ …      POST /api/specs     ✓ saved  → spec link        210ms │
└───────────────────────────────────────────────────────────────┘
```

(3A: validate + save only. 3B: full journey including discovery GETs.)

- Visual row styling: **discovery** (neutral/zinc), failed validate (amber), success validate (green), save (accent + spec link).
- Back link → `/observe/api` preserving `?agent=` when passed as `?fromAgent=`.
- Footer: “View agent run →” `/observe/agent` (placeholder).

#### `/observe/agent` — Placeholder (Phase 3)

- Title: “Agent Observe”
- Copy: metrics ship in **Phase 6** after RapidUI Agent (**Phase 4**) populates `agent_runs` / `agent_turns`.
- Bulleted preview: runs over time, success vs failed, p50/p95 latency, tokens, validate attempts, drill-down joined to API events by `session_id`.
- CTA: “View API telemetry →” `/observe/api`

#### `/observe/evals` — Placeholder (Phase 3)

- Title: “Eval lab”
- Copy: model × prompt × case matrix ships in **Phase 7** (stretch O5).
- Bulleted preview: pass rate by case, avg retries/tokens/latency/cost per matrix cell.
- Optional: if `eval_runs` rows exist, show read-only mini-table (case id, passed/total) — **teaser only**, not full lab UI.
- CTA: “View API sessions →” `/observe/api`

---

### Task list (build order)

#### Stage 3A — Core Observe

##### A1 — Query layer (`lib/observe/queries.ts`)

1. Constants: `OBSERVE_DEFAULT_WINDOW_DAYS = 30`; shared `windowStart(windowDays)`.
2. Export **`DISCOVERY_ENDPOINTS`** constant (empty in 3A; populated in 3B) for query filters.
3. **`getObserveHubSummary(windowDays?)`** — API zone: POST metrics only in 3A; 3B extends with discovery.
4. **`getApiObserveSummary({ agent?, evalCase?, windowDays })`** — validate/save headline + supporting tables.
5. **`listRecentSessions(...)`** — outcome heuristic; **`getSessionSummary`** + **`getSessionTimeline`** (POST events only in 3A).
6. **`getEvalTeaser()`**, **`listDistinctAgents`**, **`listDistinctEvalCases`** — eval teaser = overall pass % + optional case breakdown for `/observe/evals` placeholder.

##### A2 — Observe shell + pages

7. **`app/observe/layout.tsx`** + **`components/observe/ObserveNav.tsx`**.
8. **`app/observe/page.tsx`** — hub (3A: validate/save API card only).
9. **`app/observe/api/page.tsx`** + **`app/observe/api/sessions/[sessionId]/page.tsx`**.
10. **`app/observe/agent/page.tsx`** + **`app/observe/evals/page.tsx`** — placeholders.

##### A3 — Smoke (3A)

11. **`scripts/smoke-observe-api.ts`** + `package.json` script.

---

#### Stage 3B — Discovery & API health

##### B1 — Session gate + write path

12. **`lib/observe/session-gate.ts`** — **`assertSessionId(request)`** returns `{ ok, sessionId, headers }` or `{ ok: false, error: TransportFailure }`.
13. **`lib/operations/rules.ts`** — add **`MISSING_SESSION_ID`** to **`RuleCode`** (transport, not O-rule).
14. **`lib/validate/messages.ts`** — add **`MISSING_SESSION_ID`** to **`ERROR_CATALOG`**.
15. **`lib/observe/schemas.ts`** — extend endpoint union: POST + discovery paths; export **`DISCOVERY_ENDPOINTS`** + **`POST_ENDPOINTS`**.
16. **`lib/observe/telemetry.ts`** — **`recordDiscoveryEvent({ request, endpoint, startedAt })`** (non-blocking insert).
17. **Wire `assertSessionId`** — guarded routes return **400** before handler body:
    - `app/api/docs/route.ts`, `app/api/schema/route.ts`, `app/api/health/route.ts`
    - `app/api/validate/route.ts`, `app/api/specs/route.ts`, `app/api/specs/[id]/route.ts`
18. **`app/llms.txt/route.ts`** — **no session gate**; **`recordDiscoveryEvent({ endpoint: '/llms.txt' })`** only (anonymous `session_id: null` OK).

##### B2 — Agent docs + discovery content

18. **`lib/docs/llms.ts`** + **`lib/docs/content/instructions.md`** — session identity block (steps 1–3 above).
19. **`lib/docs/index.ts`** — telemetry: session **required**; rename `optionalHeaders` → split **`requiredHeaders`** + **`recommendedHeaders`** on API sections.
20. **`lib/docs/content/getting-started.md`** — session before docs/schema; remove "Telemetry (optional)".
21. **`eval/manual/wrapper_*.txt`** — `SESSION_ID` before GET docs/schema curls; all guarded calls include header.

##### B3 — Query + UI extensions

22. **`getDiscoverySummary`**, **`getSessionFunnel`**; extend hub + API pages; full session timeline.

##### B4 — Smoke (3B)

23. **`scripts/smoke-observe-discovery.ts`** + `"smoke:observe-discovery"` in `package.json`.
24. Missing session on `/api/docs` → 400 `MISSING_SESSION_ID`.
25. llms.txt without session → 200 + anonymous `api_events` row (`session_id` null).
26. Full journey: llms → docs → schema → validate → save with same `SESSION_ID` — funnel + timeline assertions.
27. Update **`smoke:validate`**, **`smoke:specs`**, **`smoke:docs`**, **`smoke:observe`** — all guarded calls include `X-RapidUI-Session-Id`.

---

### `recordDiscoveryEvent` contract (3B)

| Field | Value |
|-------|--------|
| `endpoint` | `/llms.txt` \| `/api/docs` \| `/api/schema` \| `/api/health` |
| `session_id`, `agent`, `eval_case_id`, `intent` | From headers if present |
| `valid`, `error_codes`, `spec_id` | Always `null` |
| `duration_ms` | Handler timing |

**Interview line:** *“Observe tracks from first touch — llms.txt through save — same `api_events` store, same session id.”*

---

### Files to create / modify

**Create**

```txt
lib/observe/queries.ts
lib/observe/session-gate.ts              # 3B
app/observe/layout.tsx
app/observe/page.tsx                      # Overview hub
app/observe/api/page.tsx
app/observe/api/sessions/[sessionId]/page.tsx
app/observe/agent/page.tsx                # Placeholder scaffold
app/observe/evals/page.tsx                # Placeholder scaffold
components/observe/ObserveNav.tsx
components/observe/StatCard.tsx           # optional
components/observe/SessionOutcomeBadge.tsx  # optional
scripts/smoke-observe-api.ts
scripts/smoke-observe-discovery.ts        # 3B
```

**Modify (3A)**

```txt
package.json                              # smoke:observe-api
```

**Modify (3B)**

```txt
lib/operations/rules.ts                   # MISSING_SESSION_ID on RuleCode
lib/observe/schemas.ts
lib/observe/telemetry.ts
lib/validate/messages.ts
app/llms.txt/route.ts
app/api/docs/route.ts
app/api/schema/route.ts
app/api/health/route.ts
app/api/validate/route.ts
app/api/specs/route.ts
app/api/specs/[id]/route.ts
lib/docs/index.ts
lib/docs/llms.ts
lib/docs/content/instructions.md
lib/docs/content/getting-started.md
eval/manual/wrapper_local.txt
eval/manual/wrapper_prod.txt
scripts/smoke-validate.ts
scripts/smoke-specs.ts
scripts/smoke-docs.ts
scripts/smoke-observe.ts
package.json                              # smoke:observe-discovery
```

**Do not modify**

```txt
next.config.ts                            # no /observe redirect
lib/db/migrations/*                       # no DDL — endpoint is TEXT, enum is app-layer only
app/page.tsx                              # homepage redesign is Phase 5; API links may 400 after 3B (accepted)
app/specs/[id]/page.tsx                   # reads Neon directly — unaffected by API session gate
```

---

### `smoke:observe-api` contract (3A)

Seed data via existing write path, then assert query layer + pages compile:

1. Insert 2–3 `api_events` rows (validate fail → validate pass → specs save) with shared `session_id` + agent header.
2. Call `getObserveHubSummary`, `getApiObserveSummary`, `listRecentSessions`, `getSessionTimeline` — counts match seed.
3. Optional: `next build` or import page modules to catch RSC type errors.

No HTTP server required if queries are tested directly (same pattern as `smoke:observe`).

---

### Query sketches (Neon)

**Avg tries before save (demo metric):**

```sql
SELECT AVG(validate_calls)::numeric(10,1) AS avg_tries_before_save
FROM (
  SELECT session_id,
    COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_calls
  FROM api_events
  WHERE session_id IS NOT NULL
    AND occurred_at >= :window_start
    AND (:agent IS NULL OR agent = :agent)
  GROUP BY session_id
  HAVING BOOL_OR(spec_id IS NOT NULL)   -- session ended in a save
) saved_sessions;
```

**Session outcome (listRecentSessions):**

```sql
-- saved:     BOOL_OR(spec_id IS NOT NULL)
-- failed:    NOT saved AND last validate event has valid = false
-- in_progress: otherwise
```

**Session search:**

```sql
-- When :session provided, filter listRecentSessions
WHERE session_id = :session
-- Optional: OR session_id ILIKE :session || '%' for partial terminal paste
```

**Validate success rate + transport count:**

```sql
SELECT
  COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS TRUE)::float
    / NULLIF(COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS NOT NULL), 0)
    AS validate_success_rate,
  COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS NULL) AS transport_failures
FROM api_events
WHERE occurred_at >= :window_start
  AND (:agent IS NULL OR agent = :agent);
```

**Top error codes** (unnest `error_codes` on validate events where `valid = false`):

```sql
SELECT code, COUNT(*) AS cnt
FROM api_events, UNNEST(error_codes) AS code
WHERE endpoint = '/api/validate'
  AND valid = FALSE
  AND occurred_at >= :window_start
GROUP BY code
ORDER BY cnt DESC
LIMIT 10;
```

**Saves by agent:**

```sql
SELECT agent, COUNT(DISTINCT spec_id) AS saves
FROM api_events
WHERE spec_id IS NOT NULL
  AND occurred_at >= :window_start
GROUP BY agent
ORDER BY saves DESC;
```

**Requests by day:**

```sql
SELECT DATE(occurred_at AT TIME ZONE 'UTC') AS day, COUNT(*) AS requests
FROM api_events
WHERE occurred_at >= :window_start
GROUP BY day
ORDER BY day DESC
LIMIT 14;
```

**listRecentSessions** (per-session aggregation):

```sql
SELECT
  session_id,
  MAX(agent) AS agent,
  MAX(eval_case_id) AS eval_case_id,
  COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_count,
  BOOL_OR(spec_id IS NOT NULL) AS saved,
  MAX(spec_id::text) FILTER (WHERE spec_id IS NOT NULL) AS final_spec_id,
  MAX(occurred_at) AS last_activity_at,
  (ARRAY_AGG(valid ORDER BY occurred_at DESC)
    FILTER (WHERE endpoint = '/api/validate'))[1] AS last_validate_valid
FROM api_events
WHERE session_id IS NOT NULL
  AND occurred_at >= :window_start
  AND (:agent IS NULL OR agent = :agent)
  AND (:eval_case IS NULL OR eval_case_id = :eval_case)
GROUP BY session_id
ORDER BY last_activity_at DESC
LIMIT 50;
-- Outcome in TS: saved → 'saved'; NOT saved AND last_validate_valid = false → 'failed'; else 'in_progress'
```

**Eval teaser** (`getEvalTeaser`):

```sql
SELECT
  ROUND(100.0 * COUNT(*) FILTER (WHERE passed) / NULLIF(COUNT(*), 0), 1) AS overall_pass_rate,
  COUNT(*) AS total_runs
FROM eval_runs
WHERE completed_at >= :window_start;
```

**Session funnel (3B):**

```sql
SELECT
  COUNT(*) FILTER (WHERE hit_llms) AS reached_llms,
  COUNT(*) FILTER (WHERE hit_docs) AS reached_docs,
  COUNT(*) FILTER (WHERE hit_schema) AS reached_schema,
  COUNT(*) FILTER (WHERE hit_validate) AS reached_validate,
  COUNT(*) FILTER (WHERE hit_save) AS reached_save
FROM (
  SELECT session_id,
    BOOL_OR(endpoint = '/llms.txt') AS hit_llms,
    BOOL_OR(endpoint = '/api/docs') AS hit_docs,
    BOOL_OR(endpoint = '/api/schema') AS hit_schema,
    BOOL_OR(endpoint = '/api/validate') AS hit_validate,
    BOOL_OR(spec_id IS NOT NULL) AS hit_save
  FROM api_events
  WHERE session_id IS NOT NULL
    AND occurred_at >= :window_start
  GROUP BY session_id
) s;
```

---

### Test plan (before checking boxes)

| Step | Action | Expected |
|------|--------|----------|
| Query smoke | `npm run smoke:observe-api` | Hub + API + timeline assertions pass |
| Writes | `npm run smoke:observe` | Phase 1 unchanged |
| Hub | Open `/observe` | Three cards; API stats live; Agent/Evals placeholders |
| No redirect | `curl -I localhost:3000/observe` | **200** (not 307 to /observe/api) |
| API dashboard | `/observe/api` with data | Hero sessions table + stats |
| Filters | `?agent=`, `?evalCase=`, `?session=` | List filters correctly |
| Session detail | Click session row | Timeline fail → pass → save |
| Spec link | Saved session | `/specs/:id` works |
| Placeholders | `/observe/agent`, `/observe/evals` | Scaffold loads; nav works |
| Empty DB | Fresh Neon | Hub + API empty states; no crash |
| Build | `npm run build` | All Observe routes compile |

**Stage 3B additional:**

| Step | Action | Expected |
|------|--------|----------|
| Discovery smoke | `npm run smoke:observe-discovery` (or extended api smoke) | GET events in `api_events` |
| GET tracking | `curl -H "X-RapidUI-Session-Id: …" localhost:3000/api/docs` | 200 + row |
| llms.txt anonymous | `curl localhost:3000/llms.txt` (no session) | 200 + anonymous api_events row |
| Missing session | `curl localhost:3000/api/docs` (no header) | 400 `MISSING_SESSION_ID` |
| Missing session validate | POST validate without header | 400 `MISSING_SESSION_ID` |
| Funnel | Session with discovery + validate + save | Funnel shows all stages |
| Timeline | Open session detail | Discovery rows appear before validate |
| Hub pulse | `/observe` | Discovery counts on API card |
| Docs | `/api/docs` telemetry section | Documents headers on GET |

**Manual full-journey rehearsal (after 3B):**

```txt
1. wrapper — SESSION_ID + headers on GET llms.txt, docs, schema, then validate/save
2. /observe — discovery pulse on hub
3. /observe/api — funnel + session drill-down with full timeline
```

---

### Out of scope (Phase 3)

- **`/observe/agent` metrics** — Phase 6
- **`/observe/evals` matrix UI** — Phase 7
- **`agent_runs` / `agent_turns` queries**
- **Homepage (`/`) visit tracking** — not API Observe; skip 3B
- **`GET /api/specs/:id` tracking** — inspector/human traffic; skip
- Charts, auth, CSV export, websockets
- **`eval_runs.session_id`** — Phase 7
- Vercel Web Analytics / marketing page views

### Checklist

**Stage 3A — Core**

- [x] `lib/observe/queries.ts` — hub, API summary, sessions, timeline (validate/save), filters
- [x] `/observe` hub — API card (validate/save stats) + Agent/Evals placeholders
- [x] `/observe/api` — headline stats + hero sessions table + supporting tables
- [x] Filters: `?agent=`, `?evalCase=`, `?session=`
- [x] `/observe/api/sessions/[sessionId]` — timeline (validate + save)
- [x] `/observe/agent` + `/observe/evals` — placeholder scaffolds
- [x] Observe layout nav: Overview · API · Agent · Evals
- [x] `npm run smoke:observe-api` passes
- [x] `npm run build` passes

**Stage 3B — Discovery, health & session enforcement**

- [x] `assertSessionId()` + `MISSING_SESSION_ID` on all guarded routes
- [x] `GET /llms.txt` remains unguarded; anonymous discovery telemetry only
- [x] `recordDiscoveryEvent()` on llms.txt + guarded GETs (after gate)
- [x] llms.txt + `/api/docs` document required session workflow
- [x] Eval wrappers: SESSION_ID before docs/schema/validate/save
- [x] Discovery summary + funnel on hub + API dashboard
- [x] Session timeline includes full journey
- [x] Smokes updated (400 without session; full journey with session)
- [x] Satisfies **S3** + **S8** with traceable agent identity

---

# Phase 4 — RapidUI Agent (FastAPI · Render)

**Reference:** §4, §8 (Logfire), §9 Area 4, §11 (constraints), §7 (workflow)

### Goal

Conversational agent on `agent.rapidui.dev` that generates RUIs via the **public RapidUI API** — same discovery path as external agents.

### Depends on

Phase 1 (ingest + headers), Phase 2 (schema + docs).

### Unlocks

Phase 5 (main UI chat), Phase 6 (agent dashboard data).

### Scope

- **Stack:** FastAPI + Pydantic AI + optional Logfire
- **Model:** default `openai:o4-mini`, `reasoning_effort: medium`; env `RAPIDUI_AGENT_MODEL`
- **Prompts:** `agent/prompts/v1.txt` (+ v2/v3 for eval lab later); env `RAPIDUI_AGENT_PROMPT_VERSION`
- **Tools:** `fetch_docs`, `fetch_schema`, `validate_rui`, `save_rui`; optional `load_spec` (UC4 / O1)
- **Workflow:** plan ops → map → validate → save (reference §7)
- **System prompt:** personality + workflow only — no API/schema content (§11)
- **`RunContext[Deps]`:** `session_id`, httpx client, `RAPIDUI_BASE_URL`
- **`POST /chat`:** `VercelAIAdapter` → Vercel AI Data Stream SSE
- API calls send `X-RapidUI-Session-Id` (**required**) + `X-RapidUI-Agent: rapidui-agent` on **all** RapidUI HTTP calls — including GET `fetch_docs` / `fetch_schema` (Phase 3B session policy)
- **Logfire:** env-gated — `instrument_pydantic_ai`, `instrument_fastapi`, `instrument_httpx`
- **Observe:** FastAPI handler posts to `POST /api/observe/ingest/agent` after turns/runs — **not** inside tools

### Env vars (Render)

`OPENAI_API_KEY`, `RAPIDUI_BASE_URL`, optional `LOGFIRE_TOKEN`, optional `RAPIDUI_AGENT_MODEL`, optional `RAPIDUI_AGENT_PROMPT_VERSION`

### Key paths

```txt
agent/main.py
agent/prompts/
agent/tools/ (or inline in main)
agent/README.md
```

### Out of scope

- Main UI (Phase 5) — but endpoint must be SSE-ready for integration
- Observe UI
- Eval matrix (Phase 7)
- UC4 unless pursuing stretch O1

### Open questions

- Exact Pydantic AI + o4-mini reasoning summary config for assistant-ui
- When run completes vs per-turn ingest semantics
- UC4 `load_spec` — include now or defer to O1

### Checklist

- [ ] `POST /chat` streams to browser (curl / minimal client test)
- [ ] Agent uses tools only — no schema hardcoded in prompt
- [ ] Validate loop works against Phase 2 schema
- [ ] Successful UC1 or UC2 conversation saves spec; `viewUrl` valid
- [ ] Ingest rows appear in `agent_runs` / `agent_turns`
- [ ] CORS from `rapidui.dev` works
- [ ] Logfire traces visible when token set (optional O2)
- [ ] Satisfies **S5**, **S9** (with Phase 0)

---

# Phase 5 — Main UI (chat + inspector)

**Reference:** §5, §6, §9 Area 5, §3 #2 #14 #27

### Goal

Replace link-hub homepage with portfolio demo: **chat left**, **operations inspector + JSON right**.

### Depends on

Phase 2 (inspector data model), Phase 4 (chat API).

### Unlocks

**S6**, **S7** (with Phase 4) — end-to-end demo.

### Scope

- **Rewrite `RuiInspector`** — operations list, transitions, data chips, embedded actions (not block tree)
- Split layout per reference §9 Area 5 diagram
- **assistant-ui** + `@assistant-ui/react-ai-sdk` + `@assistant-ui/react-markdown`
- Transport → `https://agent.rapidui.dev/chat` (no Next.js proxy)
- Collapsible **reasoning** + **tool call** display
- **Starter chips** for UC1–3 — canonical prompts (§6)
- On save: right panel loads `GET /api/specs/:id`
- Nav link to `/observe/*` (optional polish)
- Update `/specs/[id]` page for operations inspector

### Key paths

```txt
app/page.tsx
app/specs/[id]/
lib/review/RuiInspector.tsx (rewrite)
components/chat/ (or similar)
```

### Out of scope

- Manual JSON editor
- External agent chat in UI
- Renderer
- File attachments

### Open questions

- Inspector UX for large specs (UC4) — scroll / grouping
- How main UI learns `spec_id` after save (tool event vs polling)

### Checklist

- [ ] Chat streams from Render agent in browser
- [ ] Reasoning + tool steps visible in thread
- [ ] Starter chips send UC1–3 prompts
- [ ] Saved spec renders in operations inspector + JSON panel
- [ ] `/specs/:id` works for shared links
- [ ] Satisfies **S6**, **S7** (manual walkthrough UC1–3)

---

# Phase 6 — Observe: Agent dashboard

**Reference:** §9 Area 6

### Goal

Analytics for **RapidUI Agent** runs — complement Phase 3 API view.

### Depends on

Phase 4 (`agent_runs` data), Phase 3 (cross-links).

### Unlocks

Full Observe story for interviews; context for Phase 7 eval lab drill-down.

### Scope

- Route: **`/observe/agent`**
- MVP metrics:
  - Runs over time; success vs failed saves
  - p50 / p95 latency
  - Validate attempts per successful save
  - Tokens per run
  - Tool calls per run
  - Breakdown by use case / intent / model / prompt_version
  - Drill-down: join `api_events` by `session_id`
- Link to `/observe/api` and placeholder `/observe/evals`

### Key paths

```txt
app/observe/agent/
lib/observe/queries.ts
```

### Out of scope

- Eval lab comparison table (Phase 7)

### Checklist

- [ ] Dashboard populated from real agent sessions (Phase 4)
- [ ] Session drill-down shows validate timeline
- [ ] Token + latency numbers match ingest data
- [ ] Links to API Observe view work
- [ ] Satisfies **S4** (with Phase 3)

---

# Phase 7 — Polish + eval lab

**Reference:** §9 Area 7, §14 (full eval harness), §15 (O*), §17

### Goal

Interview-ready repo, manual evals, and **evidence-based model selection** (stretch O5).

### Depends on

Phases 1–6 substantially complete.

### Unlocks

Portfolio freeze; optional default model change via data.

### Scope

**Polish**

- README v0.2 — architecture, demo Paths A/B, env setup
- Manual eval runs: agent + external on UC1–3 cases with headers
- At least one use-case variant per UC (§7) logged to `eval_runs`
- Smoke tests: validate, telemetry, Observe, agent health
- Architecture diagram
- `npm run eval:prompt` aligned to v0.2 case ids

**Eval lab (stretch O5 — do not block ship)**

- Extend `eval_runs` columns (reference §14)
- `agent/prompts/v2.txt`, `v3.txt` for matrix
- **`scripts/eval-matrix.ts`** — model × prompt × case; **guided** mode with `conversationScript`
- **`/observe/evals`** — pass rate, cost, latency comparison table
- **`docs/model-selection-v0.2.md`** — results + chosen default + spot-check notes

### Eval matrix (when pursuing O5)

```txt
eval_cases (UC1–3) × models (3–4) × prompt_versions (2–3) × eval_mode
```

Default model shortlist: reference §14 + decision #34.

### Key paths

```txt
scripts/eval-matrix.ts
scripts/log-eval-run.ts
app/observe/evals/
docs/model-selection-v0.2.md
agent/prompts/v2.txt  v3.txt
```

### Open questions

- `conversationScript` trigger: `after_agent_reply` vs turn index
- Model price table for `estimated_cost_usd`
- Which variants required vs optional for ship
- `POST /api/eval/log` vs CLI-only

### Checklist

**Required for portfolio ship**

- [ ] README demo script: Path A + Path B reproducible
- [ ] **S8:** one external agent session visible in `/observe/api`
- [ ] All **S1–S9** verified (reference §15)
- [ ] v0.1 eval case retired; wrappers updated

**Stretch O4**

- [ ] All v0.2 eval cases logged in `eval_runs`

**Stretch O5 (eval lab)**

- [ ] `npm run eval:matrix` completes at least one matrix slice
- [ ] `/observe/evals` shows grouped results
- [ ] `docs/model-selection-v0.2.md` documents chosen model + prompt
- [ ] Spot-check notes for 2–3 runs per cell (conversation rubric)

**Stretch O1–O3**

- [ ] O1: UC4 + `load_spec` demo
- [ ] O2: Logfire on Render (Path D)
- [ ] O3: `POST /api/eval/log` if not CLI-only

---

## Appendix A — Platform routes (target)

Reference §5 — verify all exist after relevant phases:

```txt
rapidui.dev/
├── /                    Phase 5
├── /specs/[id]          Phase 5
├── /observe             Phase 3 (overview hub)
├── /observe/api         Phase 3
├── /observe/agent       Phase 3 placeholder → Phase 6 metrics
├── /observe/evals       Phase 3 placeholder → Phase 7 (O5)
├── /api/validate        Phase 1 + 2
├── /api/specs           Phase 1 + 2
├── /api/schema          Phase 2
├── /api/docs            Phase 2
├── /api/observe/ingest/agent   Phase 1

agent.rapidui.dev/
├── POST /chat           Phase 4
├── GET /health          Phase 0
```

---

## Appendix B — Phase detail expansion template

When an agent expands a phase, produce:

1. **Repo audit** — what exists vs checklist
2. **Task list** — ordered, estimable steps
3. **Files to create/modify** — explicit paths
4. **Test plan** — how to verify before checking boxes
5. **Resolved open questions** — decisions recorded inline

---

*Scaffold created: 2026-07-18. Phase 0–2 complete. Phase 3 complete 2026-07-19 (Observe hub + API dashboard, discovery telemetry, session gate).*
