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
| **3** | Observe API dashboard | §5, §9 Area 3 |
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
| **Optional headers** | Read if present; store as nullable TEXT columns. No validation of UUID format for `session_id` — agents may use any non-empty string. Trim whitespace; empty string → `null`. |
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
| `X-RapidUI-Session-Id` | Recommended | `550e8400-e29b-41d4-a716-446655440000` | `api_events.session_id`; joins to `agent_runs.session_id` |
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
- [x] `ingestAgentTelemetry()` upserts `agent_runs` + `agent_turns`
- [x] Ingest contract documented in `lib/observe/INGEST.md`; linked from `agent/README.md`
- [x] `eval/manual/wrapper_*.txt` include session header instructions
- [x] `npm run smoke:observe` passes locally
- [x] Manual test: validate + save with headers → `api_events` rows; ingest POST → agent tables

---

# Phase 2 — Operations schema + docs + eval cases

**Reference:** §6 (use cases), §7 (full schema), §9 Area 2, §14 (eval cases, scoring), §18

### Goal

Greenfield **operations-first** RUI v0.2 — validator, agent docs, goldens, and eval cases. This unblocks meaningful agent output and inspector work.

### Depends on

Phase 0 (Postgres stable).

### Unlocks

Phases 4, 5; all v0.2 eval cases; use cases 1–3 (+ optional 4).

### Scope

- **Remove** v0.1 Page/Block registry (`lib/registry/*`)
- **Add** `lib/operations/*` — Zod schemas: `entities[]`, `operations[]`, `transitions[]`, `outcomes`, presentations, embedded actions
- `version: "0.2"` only — **reject v0.1** at validate
- Semantic rules **O1–O20** (reference §7); errors cite `operationId` / `transition`
- Rewrite `lib/validate/*`
- Golden RUIs: `lib/operations/golden/UC1`–`UC4` (filenames per reference §14)
- Eval cases: `static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2`, optional `spec-update-v0.2`
  - Each: `mode`, `prompt`, optional **`conversationScript`** (guided), `successCriteria`
- Extend `eval/score.ts` — outcome checklist + process caps
- Retire `eval/cases/support-dashboard-v0.1.json`
- Rewrite agent docs: `llms.txt`, `/api/docs`, workflow — operations-first
- Update `GET /api/schema` — `operationTypes`, `presentationLayouts`, `flowPatterns`, `embeddedActionTypes`, `transitionTriggers` incl. `cta`, `cancel`

### v0.2 schema bounds (must enforce)

| Component | In scope |
|-----------|----------|
| Operations | `browse`, `read`, `create`, `update`, `delete` |
| Embedded actions | `act`, `delete` on `read.presentation.actions[]` |
| Presentations | `table`, `form`, `detail`, `confirm` |
| Transitions | `row`, `link`, `cta`, `cancel` |
| Data | `static` \| `api` |

### Key paths

```txt
lib/operations/
lib/validate/
lib/operations/golden/
eval/cases/
eval/score.ts
lib/docs/  llms.txt  app/api/schema/
```

### Out of scope

- Renderer
- Agent service (Phase 4)
- Observe UI
- Eval matrix runner (Phase 7)

### Open questions

- UC4 seed: pre-save to Neon vs file-only load (reference §16)
- Which use-case **variants** (§7) ship as required eval cases vs stretch
- Golden files already staged in git — validate against schema as implemented

### Checklist

- [ ] All four goldens validate successfully (UC4 optional)
- [ ] v0.1-shaped RUI rejected with clear error
- [ ] `/api/schema` returns v0.2 vocabulary
- [ ] `/api/docs` + `llms.txt` describe operations-first workflow
- [ ] Three required eval case JSON files + `eval/score.ts` passes goldens
- [ ] `npm run eval:prompt` (or equivalent) works for at least one v0.2 case
- [ ] v0.1 registry removed; no dead imports

---

# Phase 3 — Observe: API dashboard

**Reference:** §5 (routes), §9 Area 3

### Goal

Human-readable dashboard for **all agents** hitting validate/save — default Observe entry.

### Depends on

Phase 1 (`api_events`, `eval_runs`).

### Unlocks

Path B demo visibility; cross-links to agent dashboard (Phase 6).

### Scope

- Route: **`/observe/api`** — default Observe entry (no hub at `/observe` in v0.2)
- Optional: redirect `/observe` → `/observe/api`
- Read Neon from Next.js — no auth
- MVP metrics:
  - Requests by endpoint / day
  - Validate success rate
  - Avg retries per session
  - Top validation error codes
  - Specs saved by agent type
  - Eval pass rate (join `eval_runs`)
- Link placeholder to `/observe/evals` (Phase 7) and `/observe/agent` (Phase 6)

### Key paths

```txt
app/observe/api/
lib/observe/queries.ts (or similar)
```

### Out of scope

- Agent-specific dashboard (Phase 6)
- Eval lab dashboard (Phase 7)
- Charts beyond simple tables / counts

### Open questions

- `/observe` redirect — middleware vs `next.config` (reference §16)
- Session drill-down UX depth for v0.2 MVP

### Checklist

- [ ] `/observe/api` loads with real data from Phase 1
- [ ] Filter or view by `X-RapidUI-Agent` works
- [ ] Session timeline shows validate retries + final `spec_id`
- [ ] Link to `/observe/agent` present (even if empty until Phase 6)
- [ ] Satisfies **S3** visibility (telemetry useful without raw SQL)

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
- API calls send `X-RapidUI-Agent: rapidui-agent` + session id
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
├── /observe/api         Phase 3
├── /observe/agent       Phase 6
├── /observe/evals       Phase 7 (O5)
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

*Scaffold created: 2026-07-18. Expand phases in order; keep decisions in [rapidui-v0.2.md](./rapidui-v0.2.md).*
