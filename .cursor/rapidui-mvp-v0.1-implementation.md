# RapidUI MVP v0.1 — Implementation Plan

Skeleton document for building the **validate → correct → save** loop. Each section has basic scope and placeholders; we fill details **one section at a time**, in order.

**Related:** [rapidui-mvp-v0.1.md](./rapidui-mvp-v0.1.md) (product thesis & MVP scope)

---

## Decisions (locked for v0.1)

| # | Question | Decision |
|---|----------|----------|
| 1 | **Tech stack** | **Next.js (App Router) + TypeScript**, deployed on **Vercel** |
| 2 | **Demo scenario** | **Option A — Support / Ops Ticket Dashboard** (B & C added as eval cases later) |
| 3 | **Deployment** | **Hosted from day one** — domain: **rapidui.dev** |
| 4 | **API auth (v0.1)** | **None** — public endpoints for now |
| 5 | **Agents for proof** | **Cursor agent** (primary) + **Claude** + **Codex** (external agent test cases) |
| 6 | **Storage** | **Postgres** (Vercel Postgres or equivalent) — no local-only hacks |
| 7 | **Docs delivery** | **API-served** via Next.js route handlers on Vercel |

### Platform sketch

```txt
rapidui.dev
├── /                  ← §3 minimal homepage (links for humans + agents)
├── /llms.txt          ← agent discovery index + Instructions
├── /api/docs          ← agent-readable documentation
├── /api/schema        ← vocabulary / block discovery
├── /api/validate      ← RUI validation
├── /api/specs         ← §3: 501 stub → §4: persist validated RUIs
└── /specs/[id]        ← §5 RUI inspector (human review)
```

---

## Demo Scenario

**Primary (v0.1): Option A — Support / Ops Ticket Dashboard**

**Typical user prompt:** *"Build an internal support dashboard for our tickets API."*

**What the agent should produce:** a **RUI** (`*.rui.json`) — not React code. The agent reads RapidUI docs/schema, emits a validated JSON document with metrics, a filterable tickets table, and GET bindings to the tickets API.

**Agent-facing prompt (evals / docs):** *"Generate a RUI for an internal support dashboard. Bind to `GET /api/tickets` (ticket list) and `GET /api/tickets/stats` (open and urgent counts)."*

**Why this first:** Every company with a support queue wants status filters, assignee columns, priority badges, and headline metrics — and agents default to generating a fresh React admin panel every time. Option A hits table + metrics + filters without write/action bindings on day one, and proves agents can emit a valid RUI instead of code.

**UI shape (in the RUI):** Metric row (open tickets, urgent count) → filterable `Table` (id, subject, status, assignee, created) → optional status filter controls.

**API stub:** `GET /api/tickets`, `GET /api/tickets/stats`

**Blocks to support:** `Table`, `Metric`, `Text`, layout sections, list + aggregate bindings.

**Golden reference:** `lib/registry/golden/support-dashboard.rui.json`

### Future eval cases (add as we go)

| Option | Scenario | When |
|--------|----------|------|
| B — CRUD admin | List + create users/resources | Eval case #2 |
| C — Approval queue | Pending inbox + approve/reject | Eval case #3 |

---

## Agent Eval Strategy

How we evaluate whether agents can reliably speak RapidUI — now (v0.1) and as a proper eval system later.

### What we are measuring

The MVP hypothesis is **RUI reliability**, not UI aesthetics. Evals answer:

1. Did the agent produce a **valid RUI**?
2. How many **validation retries** did it take?
3. Where did it **get stuck** (which error codes recur)?
4. Does the RUI **match the prompt intent** (right blocks, right bindings)?

### Two systems (do not merge for v0.1)

| System | Purpose | v0.1 scope |
|--------|---------|------------|
| **Eval harness** (§6) | Controlled regression — known prompt, known pass/fail criteria | **Build now** |
| **Session observability** | Production telemetry — unknown user intent, analytics, enterprise ops | **Design now; implement v0.2+** |

Both share correlation primitives (`sessionId`, optional headers) later, but serve different questions:

- **Eval run:** “Can agents speak RapidUI reliably on Option A?”
- **Agent session:** “What are real users trying to build, and where does the registry fall short?”

### Three ID types (do not conflate)

| ID | Scope | Who creates | Purpose |
|----|-------|-------------|---------|
| **`sessionId`** | One agent working session | Agent (UUID at start) | Correlate validate retries + saves (v0.2+) |
| **`evalRunId`** | One controlled test attempt | Platform or human | Regression tracking (§6) |
| **`specId`** | One saved artifact | Platform on `POST /api/specs` | Inspect, render, audit (§4–§5) |

A session may emit many validate calls and zero or many saves. An **eval run** points at the **final `specId`** you score. There is no single “UI ID for the whole session.”

### Two layers of scoring

| Layer | How | When |
|-------|-----|------|
| **Deterministic** | `POST /api/validate` pass/fail, retry count, required-block checklist | v0.1 — build this first |
| **Semantic / intent** | Does the RUI include table + metrics for a dashboard prompt? Rubric or LLM judge | v0.2+ — optional |

Deterministic scoring is enough to prove the platform. Semantic scoring tells you if the RUI is *useful*, not just *valid*.

### v0.1 eval flow (manual + logged)

```txt
Eval case (prompt + mock API context)          ← eval/cases/*.json
    ↓
Agent reads GET /api/docs + GET /api/schema   ← no repo context (external prompt)
    ↓
Agent generates a RUI → POST /api/validate (loop)
    ↓
On success → POST /api/specs
    ↓
Human opens viewUrl (§5) — optional visual review
    ↓
Agent prints ---EVAL_RESULT--- block           ← local prompt only (optional paste to personal notes)
    ↓
scripts/log-eval-run.ts → Postgres eval_runs    ← prod runs only; one place for logs
    ↓
eval/score.ts verifies deterministic criteria ← required blocks, bindings, retries (authoritative pass/fail)
```

**Cursor agent** runs this during development (fast debug). **Claude** and **Codex** run the same cases headlessly to prove external agents work without Cursor context.

### Eval system building blocks (sequenced)

| Phase | What | Purpose |
|-------|------|---------|
| **v0.1 (§6)** | Eval cases as JSON + `eval/manual/` prompts | Repeatable test definitions in repo |
| **v0.1 (§6)** | `eval_runs` table in Postgres | **Prod runs only** — single source of truth |
| **v0.1 (§6)** | `eval/score.ts` + `scripts/log-eval-run.ts` | Deterministic pass/fail + insert row (no HTTP log endpoint) |
| **v0.1 (§6)** | `---EVAL_RESULT---` in **local prompt only** | Paste to personal notes while playing on localhost |
| **v0.1 (§6)** | Manual runner | Prove loop before automating |
| **v0.2** | Optional request headers + `api_events` table | Per-request correlation without agent prompts |
| **v0.2** | `POST /api/eval/run` or CLI batch runner | Trigger agent + score automatically |
| **v0.2** | Batch mode: N prompts × 3 agents | Pass rate, avg retries, regression |
| **v1** | `agent_sessions`, API keys, ops dashboard | Enterprise observability |
| **v1** | LLM judge for intent rubric | Score semantic fit beyond validation |

### Eval case shape (locked for v0.1)

```json
{
  "id": "support-dashboard-v0.1",
  "title": "Option A — Support / Ops Ticket Dashboard",
  "prompt": "Generate a RUI for an internal support dashboard. Bind to GET /api/tickets (ticket list) and GET /api/tickets/stats (open and urgent counts).",
  "mockApi": {
    "endpoints": [
      { "method": "GET", "path": "/api/tickets", "description": "Ticket list; table valuePath: items" },
      { "method": "GET", "path": "/api/tickets/stats", "description": "Open and urgent counts; scalar valuePath per metric" }
    ]
  },
  "successCriteria": {
    "mustValidate": true,
    "maxRetries": 5,
    "requiredBlocks": ["Table", "Metric"],
    "requiredBindings": ["GET /api/tickets"]
  }
}
```

### Key metrics to track

- **Pass rate** — % of cases that reach valid RUI within max retries
- **Avg retries** — lower is better; spikes mean docs or error messages need work
- **Error code frequency** — which validation errors agents hit most (feeds doc improvements)
- **Agent comparison** — Cursor vs Claude vs Codex on same cases

### Where this lives in the implementation plan

Eval cases and logging extend **§6 Agent Test Harness**. Postgres schema for `eval_runs` ships in §6 (migration `002_eval_runs.sql`). Session observability (`api_events`, headers) is **specified in §6 as Phase 2 design** but implemented post–v0.1. Full automation is explicitly **post-v0.1** unless time allows.

---

## Success Criteria (MVP v0.1)

- [x] §0 complete — app deployed at `https://rapidui.dev`, Postgres provisioned
- [ ] External agent discovers vocabulary from docs without verbal hand-holding
- [ ] Agent produces a RUI for the support ticket dashboard scenario
- [x] `POST /api/validate` returns actionable, machine-readable errors
- [ ] Agent converges to valid RUI within a bounded retry count (target: ≤5)
- [x] `POST /api/specs` persists validated RUI (flat SavedSpec)
- [x] Optional: RUI inspectable in browser via `viewUrl` (§5)

---

## Architecture Summary

```txt
Agent reads docs → generates a RUI (JSON, `*.rui.json`)
    → POST /api/validate → errors | success
    → (retry loop)
    → POST /api/specs → SavedSpec (flat, includes `viewUrl`)
    → GET /api/specs/:id (retrieve)
    → GET /specs/:id (§5 human inspect — viewUrl)
```

**Single source of truth:** Vocabulary Registry feeds validation rules and agent documentation.

**Hosted on:** `rapidui.dev` (Vercel). Agents call public API routes from day one.

**Explicitly out of scope for v0.1:** React renderer, rendered app URLs, live API execution against real backends, end-user auth, operational dashboard, analytics in rendered apps.

---

## Implementation Order

| Order | Section | Depends on | Status |
|-------|---------|------------|--------|
| 0 | [Project Setup](#0-project-setup) | Decisions locked | **Complete** |
| 1 | [Vocabulary Registry](#1-vocabulary-registry) | §0 | **Complete** |
| 2 | [Validation Engine](#2-validation-engine--post-apivalidate) | §1 | **Complete** |
| 3 | [Agent Documentation](#3-agent-documentation) | §1, §2 (`ERROR_CATALOG`, live validator) | **Complete** |
| 4 | [RUI Store](#4-rui-store--post-apispecs) | §0 (Postgres), §2 | **Complete** (production verified 2026-05-27) |
| 5 | [RUI Inspector (reviewer)](#5-rui-inspector-reviewer) | §4 | **Complete** (production verified 2026-05-28) |
| 6 | [Agent Test Harness](#6-agent-test-harness--evals) | §1–§5 | **Ready for implementation** — spec locked 2026-05-30 |

### Testing while building §0–§2 (before §3 docs)

No `GET /api/docs` or `GET /api/schema` routes until **§3**. During §0–§2, smoke-test validation manually:

- `POST /api/validate` with `lib/registry/golden/support-dashboard.rui.json` (or copy-paste body)
- A few invalid fixtures from [§2 fixture catalog](#invalid-fixture-catalog)

Agent discovery and the full eval loop wait for §3+.

---

## 0. Project Setup

**Purpose:** Bootstrap the RapidUI application, repo, hosting, and database so all later sections have a real deployment target from day one.

**Why zero:** Agents must call a live API at `rapidui.dev`. Vocabulary, validation, and spec storage all assume Next.js routes, Postgres, and Vercel are already in place.

### Prerequisites (install locally)

- [x] **Node.js** — LTS (v20+ recommended)
- [x] **Package manager** — npm (bundled) or pnpm
- [x] **Git**
- [x] **GitHub account** + repo access
- [x] **Vercel account** — linked to GitHub
- [x] **Domain** — `rapidui.dev` available for DNS configuration

**Optional but useful:**

- [ ] [GitHub CLI](https://cli.github.com/) (`gh`) — create repo from terminal
- [x] [Vercel CLI](https://vercel.com/docs/cli) — env pull, deploy checks

### Step 1 — Initialize Next.js app

Create the app in the repo root (`rapid-ui/`). Use App Router + TypeScript; keep the surface minimal.

```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir=false --import-alias "@/*"
```

**Suggested choices at prompts:**

| Prompt | Choice | Why |
|--------|--------|-----|
| TypeScript | Yes | Shared types for registry, validator, API |
| ESLint | Yes | Baseline quality |
| Tailwind CSS | Yes (optional) | Handy for §5 RUI inspector; skip if you want zero UI deps |
| `src/` directory | No | Matches [project structure sketch](#project-structure-sketch) |
| App Router | Yes | API routes + pages |
| Turbopack | Either | Dev preference |

Verify locally:

```bash
npm run dev
# → http://localhost:3000 loads
```

### Step 2 — Scaffold folder structure

Create empty placeholders aligned with later sections (no feature code yet):

```txt
app/api/health/route.ts    # smoke test (§0)
lib/registry/              # §1
lib/validate/              # §2
lib/db/                    # §4
eval/cases/                # §6
```

- [x] Folders created
- [x] `GET /api/health` returns `{ ok: true }` — proves deploy + routing work

### Step 3 — Environment variables

- [x] `.env.local` — local secrets (gitignored)
- [x] `.env.example` — committed template for required vars

**Vars to plan for (values come in Step 6):**

```txt
DATABASE_URL=           # Vercel Postgres connection string
```

Do not commit `.env.local`.

### Step 4 — Git repository

- [x] `git init` (if not already a repo)
- [x] Initial commit: Next.js scaffold + folder structure + `.env.example`
- [x] `.gitignore` includes `.env*.local`, `node_modules`, `.next`

### Step 5 — GitHub remote

- [x] Create GitHub repo (e.g. `rapid-ui` or `rapidui` under your org/user)
- [x] Add remote: `git remote add origin git@github.com:<org>/<repo>.git`
- [x] Push default branch: `git push -u origin main`

**Via GitHub CLI (optional):**

```bash
gh repo create <org>/<repo> --private --source=. --push
```

### Step 6 — Vercel project

- [x] Import GitHub repo in [Vercel dashboard](https://vercel.com/new)
- [x] Framework preset: **Next.js** (auto-detected)
- [x] Production branch: `main`
- [x] First deploy succeeds (default `*.vercel.app` URL)

**Post-deploy check:**

- [x] `https://<project>.vercel.app/api/health` returns `{ ok: true }`

### Step 7 — Vercel Postgres (provision only)

- [x] Create **Postgres** storage in Vercel project (Storage tab → Connect Store)
- [x] Link `DATABASE_URL` to project env vars (Production + Preview + Development)
- [x] Pull env locally: `vercel env pull .env.local` (requires Vercel CLI + linked project)

**Note:** No app code touches the database until **§4**. For §0: add Postgres, wire env vars, move on. Tables, `lib/db/` client, and queries come in §4.

### Step 8 — Custom domain (`rapidui.dev`)

- [x] Add domain in Vercel project → Settings → Domains
- [x] Configure DNS at registrar (Vercel nameservers or A/CNAME records as instructed)
- [x] SSL certificate issued
- [x] `https://rapidui.dev/api/health` works

### Step 9 — README & agent-facing base URL

- [x] Root `README.md` — project one-liner, local dev commands, link to `.cursor/` docs
- [x] Document public base URL: `https://rapidui.dev` (used in §3 agent docs)

### Deliverables

- [x] Next.js app runs locally (`npm run dev`)
- [x] Repo on GitHub with `main` pushed
- [x] Vercel project deploys on push
- [x] `rapidui.dev` resolves with HTTPS
- [x] Vercel Postgres provisioned; `DATABASE_URL` in Vercel + `.env.local`
- [x] Folder scaffold: `lib/registry`, `lib/validate`, `lib/db`, `eval/cases`
- [x] `GET /api/health` live on production
- [x] `.env.example` committed

### Details to fill in later

- ORM choice — **decided in §4:** `@vercel/postgres` + raw SQL (no ORM for v0.1)
- CI workflow (GitHub Actions lint/test) — optional for v0.1
- Branch protection / preview deploy policy
- Monorepo vs single app — staying single app for v0.1

### Done when

- Pushing to `main` auto-deploys to `https://rapidui.dev`
- `/api/health` returns success in production
- Vercel Postgres attached; `DATABASE_URL` in Vercel + `.env.local` (no connection test or `lib/db/` code in §0)
- Empty scaffold folders exist and match the [project structure sketch](#project-structure-sketch)
- **Ready to start §1 Vocabulary Registry**

---

## 1. Vocabulary Registry

**Purpose:** Single source of truth for what agents may emit — blocks, layouts, bindings, and cross-cutting rules.

**Why first (after §0):** Validation, docs, and examples all derive from this. No registry → nothing to validate or document.

**Target scenario:** Option A — Support ticket dashboard (metrics row + filterable tickets table).

**Design principle:** **A-complete, B/C-ready.** v0.1 validates only what Option A needs. `Form`, `Button`, `write`, and `action` are documented as `planned` in `/api/schema` so agents see the roadmap without emitting half-supported RUIs.

### Terminology

| Term | Meaning |
|------|---------|
| **RUI** | The artifact agents produce — a JSON document describing an app (screens, blocks, bindings). Pronounced "ROO-ee". |
| **`.rui.json`** | Conventional file extension (content is JSON). Example: `support-dashboard.rui.json`. |
| **`RuiSchema`** | Zod schema for the RUI root document (`lib/registry/rui.ts`). |

### Decisions (locked for §1)

| Decision | Choice |
|----------|--------|
| Filters | Static options on `Table.filter` (no separate `Select` block) |
| Planned features | Exposed in `/api/schema` as `planned[]` |
| Column types | `"string"`, `"number"`, `"date"`, `"badge"` — use `badge` for status |
| Labels / copy | Both `Section.title` and `Text` block supported |
| Registry format | TypeScript + **Zod** schemas in `lib/registry/` (single source for types + validation) |
| Registry version | `"0.1"` — must match top-level RUI `version` |
| Multi-page RUIs | **`pages[]` + `navigation`** supported; Option A uses one page |
| `meta` scope | **App-level** title & description (whole application, not a single page) |
| Unknown properties | **Strict mode** — reject extra props anywhere (`UNKNOWN_PROP`) |
| Node `id` | **Agent-generated** (v0.1 simplest); validate format + uniqueness only — see [Node IDs](#node-ids) |

---

### RUI document

Every **RUI** is a single JSON document (conventionally saved as `*.rui.json`). **`meta` describes the application**; each entry in **`pages`** is a routable screen (future renderer uses `navigation` for routing).

```txt
{
  "version": "0.1",              // required — must match registry version
  "meta": {                      // required — app-level (whole application)
    "title": string,             // required — application name
    "description": string        // optional — what the application is for
  },
  "navigation": {                // required — sidebar / nav (min 1 item)
    "items": NavigationItem[]
  },
  "pages": Page[]                // required — min 1 page; Option A uses exactly 1
}
```

**NavigationItem:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `pageId` | string | yes | Must match a `pages[].id` |
| `label` | string | yes | Nav label (e.g. "Support") |

**Multi-page (future):** left nav from `navigation.items`; renderer routes between `pages`. Option A golden RUI uses one nav item + one page — no uplift for v0.1 eval, but the model supports growth.

---

### Node IDs (v0.1 — simplest)

**v0.1 approach:** The **agent generates every node `id`**. RapidUI only validates — no platform assignment or normalization yet.

| Rule | Value |
|------|--------|
| Who assigns | **Agent** (required on every Page, Section, block) |
| Pattern | `^[a-z][a-z0-9-]*$` (lowercase kebab-case) |
| Length | 1–64 characters |
| Uniqueness | Unique across **entire RUI** (all pages, sections, blocks) |
| Style | Semantic slugs encouraged (e.g. `page-support`, `table-tickets`) — not UUIDs |

**Recommended prefixes** (hints in validation messages / §3 docs — not enforced):

| Node type | Example |
|-----------|---------|
| Page | `page-support` |
| Section | `section-metrics` |
| Metric | `metric-open` |
| Table | `table-tickets` |
| Text | `text-all-tickets` |

**Deferred (v0.2+):** Platform-constructed deterministic ids, analytics event keys, id preservation on spec updates.

**§2 normalization (v0.1):** On successful validate, return `normalizedRui` with deterministic sibling order and canonical JSON key order — **agent `id` strings are preserved**. See [§2 Normalization](#normalization-v01).

---

### Layouts (validated in v0.1)

#### `Page` — screen container

One `Page` per routable screen. RUIs contain one or more pages; Option A uses one.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Stable node id (e.g. `page-support`) |
| `type` | `"Page"` | yes | Discriminator |
| `title` | string | yes | Page title (screen headline — distinct from app `meta.title`) |
| `description` | string | no | Optional page subtitle |
| `children` | `Section[]` | yes | One or more sections (min 1) |

#### `Section` — grouping container

Groups blocks vertically or horizontally.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique node id |
| `type` | `"Section"` | yes | Discriminator |
| `title` | string | no | Section heading |
| `direction` | `"stack"` \| `"row"` | yes | `row` for side-by-side (metrics); `stack` for vertical |
| `children` | Block[] | yes | One or more blocks (min 1) |

**Layout conventions for Option A:**

- Metrics row → `Section` with `direction: "row"` containing `Metric` blocks
- Table area → `Section` with `direction: "stack"` containing optional `Text` + `Table`

---

### Blocks (validated in v0.1)

#### `Metric` — single numeric or text KPI

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique node id |
| `type` | `"Metric"` | yes | Discriminator |
| `label` | string | yes | Display label (e.g. "Open Tickets") |
| `binding` | ReadBinding | yes | GET binding; **`valuePath` required** (scalar) |
| `format` | `"number"` \| `"text"` | no | Display hint (default: `"number"`) |

#### `Table` — tabular list with optional static filter

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique node id |
| `type` | `"Table"` | yes | Discriminator |
| `title` | string | no | Table heading |
| `binding` | ReadBinding | yes | GET binding; response is array at `valuePath` |
| `columns` | Column[] | yes | Min 1 column |
| `filter` | TableFilter | no | Single static filter (v0.1) |

**Column:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | string | yes | Field key in row data; unique within table |
| `label` | string | yes | Column header |
| `type` | `"string"` \| `"number"` \| `"date"` \| `"badge"` | no | Display hint (default: `"string"`); use `badge` for status |

**TableFilter** (static options only in v0.1):

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `field` | string | yes | Must match a column `key` |
| `label` | string | yes | Filter label (e.g. "Status") |
| `options` | `{ value, label }[]` | yes | Static enum; min 1 option |

**Deferred table features** (document in schema `planned`, do not validate): sorting, pagination, row selection, row actions, dynamic filter options from API.

#### `Text` — static copy

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | yes | Unique node id |
| `type` | `"Text"` | yes | Discriminator |
| `content` | string | yes | Static text (headers, helper copy, empty-state notes) |

---

### Blocks & bindings (planned — documented, not validated in v0.1)

Exposed via `/api/schema` → `planned.blocks` and `planned.bindings`. Validator returns `PLANNED_NOT_SUPPORTED` if an agent emits these before v0.2.

| Kind | Name | Needed for | Notes |
|------|------|------------|-------|
| Block | `Form` | Option B — CRUD admin | Create/edit with field schema |
| Block | `Button` | Option C — approval queue | Triggers action binding |
| Binding | `write` | Option B | `POST` + `bodyMap` |
| Binding | `action` | Option C | `POST` + `pathTemplate` (e.g. `/api/requests/{id}/approve`) |

---

### Bindings (validated in v0.1)

One binding family: **`read`** — fetch data via GET. v0.1 describes *intent*; no live API execution.

#### `ReadBinding`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `"read"` | yes | Discriminator |
| `method` | `"GET"` | yes | Only `GET` allowed in v0.1 |
| `path` | string | yes | Must start with `/` (e.g. `"/api/tickets"`) |
| `valuePath` | string | no | Dot-path into JSON response |

**`valuePath` usage:**

| Block | `valuePath` | Required? | Example response shape |
|-------|-------------|-----------|--------------------------|
| `Table` | Path to array | no (omit if root is array) | `{ "items": [...] }` → `"items"` |
| `Metric` | Path to scalar | **yes** | `{ "openCount": 42 }` → `"openCount"` |

**v0.1 binding constraints:**

- No headers, auth, query params, or pagination cursors
- No JSONPath — simple dot segments only (e.g. `"data.items"`)
- Path format validated as string only (no OpenAPI / live URL checks)
- `path` must start with `/` (R24); invalid → `INVALID_BINDING`
- `valuePath` (when present): dot-segments only, no JSONPath (R23); invalid → `INVALID_VALUE_PATH`

---

### Nesting matrix

```txt
RUI
├── navigation.items[]  →  pageId references pages[].id
└── pages: Page[]
    └── children: Section[]
        └── children: Block[]   (Metric | Table | Text)
```

| Parent | Allowed children | Max depth |
|--------|------------------|-----------|
| RUI | `version`, `meta`, `navigation`, `pages` only (strict) | — |
| `pages[]` | `Page` nodes (min 1) | — |
| `Page` | `Section` only | — |
| `Section` | `Metric`, `Table`, `Text` only | — |
| Blocks | *(leaf nodes — no children)* | — |
| Overall | Page → Section → Block | 3 levels per page |

**Not allowed in v0.1:** Section inside Section, Block as direct child of Page, nested blocks, extra top-level keys.

---

### Rules & error codes

Validator (§2) implements these rules. Each maps to a stable error `code` for agent self-correction.

**Strict mode:** Unknown properties at any level → `UNKNOWN_PROP`. Implement via Zod `.strict()` on all object schemas.

#### Structural

| # | Rule | Code |
|---|------|------|
| R0 | Payload must be valid JSON (parse failure) | `INVALID_JSON` |
| R1 | `version` must equal registry version (`"0.1"`) | `VERSION_MISMATCH` |
| R2 | Required top-level keys `version`, `meta`, `navigation`, `pages` must be present | `MISSING_REQUIRED_PROP` |
| R3 | Every node with an `id` must be globally unique across the RUI | `DUPLICATE_ID` |
| R4 | Every node `id` must match `^[a-z][a-z0-9-]*$` (1–64 chars) | `INVALID_ID_FORMAT` |
| R5 | Node `type` must be a registered layout or block | `UNKNOWN_TYPE` |
| R6 | Required props present per type | `MISSING_REQUIRED_PROP` |
| R7 | Prop types must match registry; no unknown props (strict) | `INVALID_PROP_TYPE` / `UNKNOWN_PROP` |

#### Composition

| # | Rule | Code |
|---|------|------|
| R8 | `pages.length >= 1` | `EMPTY_PAGES` |
| R9 | `navigation.items.length >= 1` | `EMPTY_NAVIGATION` |
| R10 | Every `navigation.items[].pageId` must match a `pages[].id` | `INVALID_NAV_PAGE_ID` |
| R11 | Every `pages[].id` must appear in at least one navigation item | `ORPHAN_PAGE` |
| R12 | `Page.children` must contain only `Section` nodes | `INVALID_PAGE_CHILD` |
| R13 | `Section.children` must contain only block nodes | `INVALID_SECTION_CHILD` |
| R14 | No Section-in-Section nesting | `INVALID_NESTING` |

#### Semantic

| # | Rule | Code |
|---|------|------|
| R15 | `Page.children.length >= 1` | `EMPTY_PAGE` |
| R16 | `Section.children.length >= 1` | `EMPTY_SECTION` |
| R17 | `Table.columns.length >= 1`; column `key` unique | `INVALID_COLUMNS` |
| R18 | `Table.binding` required; `Metric.binding` required | `MISSING_BINDING` |
| R19 | `Metric.binding.valuePath` required | `MISSING_VALUE_PATH` |
| R20 | Binding `type` must be `read`; `method` must be `GET` | `INVALID_BINDING` |
| R21 | If `Table.filter` present, `filter.field` must match a column `key` | `INVALID_FILTER_FIELD` |
| R22 | Planned block/binding types → reject | `PLANNED_NOT_SUPPORTED` |
| R23 | If `valuePath` present, must be valid dot-segments (`^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$`) | `INVALID_VALUE_PATH` |
| R24 | `ReadBinding.path` must start with `/` | `INVALID_BINDING` |

**§2 implements:** R0–R24. R24 overlaps R20 for binding shape; use `INVALID_BINDING` for path/method/type violations on bindings.

**R2 + strict RUI root:** Missing top-level key → `MISSING_REQUIRED_PROP` (path = key name or `""`). Extra top-level key → `UNKNOWN_PROP` (strict / R7).

---

### Golden example — Option A (support dashboard)

Reference RUI agents should converge toward for the primary eval case:

```json
{
  "version": "0.1",
  "meta": {
    "title": "Support Operations",
    "description": "Internal support tooling for ticket queue management"
  },
  "navigation": {
    "items": [
      { "pageId": "page-support", "label": "Support" }
    ]
  },
  "pages": [
    {
      "id": "page-support",
      "type": "Page",
      "title": "Support Dashboard",
      "children": [
        {
          "id": "section-metrics",
          "type": "Section",
          "title": "Overview",
          "direction": "row",
          "children": [
            {
              "id": "metric-open",
              "type": "Metric",
              "label": "Open Tickets",
              "format": "number",
              "binding": {
                "type": "read",
                "method": "GET",
                "path": "/api/tickets/stats",
                "valuePath": "openCount"
              }
            },
            {
              "id": "metric-urgent",
              "type": "Metric",
              "label": "Urgent",
              "format": "number",
              "binding": {
                "type": "read",
                "method": "GET",
                "path": "/api/tickets/stats",
                "valuePath": "urgentCount"
              }
            }
          ]
        },
        {
          "id": "section-tickets",
          "type": "Section",
          "direction": "stack",
          "children": [
            {
              "id": "text-tickets-heading",
              "type": "Text",
              "content": "All tickets"
            },
            {
              "id": "table-tickets",
              "type": "Table",
              "title": "Tickets",
              "binding": {
                "type": "read",
                "method": "GET",
                "path": "/api/tickets",
                "valuePath": "items"
              },
              "columns": [
                { "key": "id", "label": "ID", "type": "string" },
                { "key": "subject", "label": "Subject", "type": "string" },
                { "key": "status", "label": "Status", "type": "badge" },
                { "key": "assignee", "label": "Assignee", "type": "string" },
                { "key": "created", "label": "Created", "type": "date" }
              ],
              "filter": {
                "field": "status",
                "label": "Status",
                "options": [
                  { "value": "open", "label": "Open" },
                  { "value": "pending", "label": "Pending" },
                  { "value": "closed", "label": "Closed" }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**Mock API context for evals:**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/tickets/stats` | Returns `{ openCount, urgentCount }` |
| `GET /api/tickets` | Returns `{ items: [{ id, subject, status, assignee, created }] }` |

---

### Registry module layout

```txt
lib/registry/
├── index.ts           # exports registry version + full schema
├── version.ts         # "0.1"
├── rui.ts        # RUI root schema — navigation, meta (Zod)
├── layouts.ts         # Page, Section definitions (Zod)
├── blocks.ts          # Metric, Table, Text (+ planned metadata)
├── bindings.ts        # ReadBinding (+ planned write/action)
├── ids.ts             # id format regex + validation helpers (agent-provided ids)
├── rules.ts           # rule definitions + error codes (R0–R24)
├── planned.ts         # Form, Button, write, action stubs for schema
└── golden/
    └── support-dashboard.rui.json
```

`GET /api/schema` (§3) generates from these modules:

```txt
{
  "version": "0.1",
  "layouts": [...],
  "blocks": [...],
  "bindings": [...],
  "rules": [...],
  "planned": {
    "blocks": ["Form", "Button"],
    "bindings": ["write", "action"]
  }
}
```

---

### Scope summary

| Category | Validated in v0.1 | Planned (schema only) |
|----------|-------------------|------------------------|
| Layouts | `Page`, `Section` | — |
| App structure | `navigation` + multi-`pages` | — |
| Blocks | `Metric`, `Table`, `Text` | `Form`, `Button` |
| Bindings | `read` (GET) | `write`, `action` |
| Filters | Static `Table.filter` | Dynamic filter from API |
| Table features | columns + types | sort, pagination, row actions |

---

### Implementation steps

**Prerequisites:** §0 complete; `lib/registry/` folder exists; Zod available.

```bash
npm install zod
```

### Step 1 — Scaffold registry modules

Create the file structure under `lib/registry/`:

```txt
lib/registry/
├── index.ts
├── version.ts
├── rui.ts
├── layouts.ts
├── blocks.ts
├── bindings.ts
├── ids.ts
├── rules.ts
├── planned.ts
└── golden/
    └── support-dashboard.rui.json
```

- [x] All files created (empty exports OK initially)
- [x] `lib/registry/index.ts` re-exports public API

### Step 2 — Registry version

In `version.ts`:

- [x] Export `REGISTRY_VERSION = "0.1"`
- [x] Used by RUI root Zod schema and rule R1

### Step 3 — ID helpers

In `ids.ts`:

- [x] Export id regex: `^[a-z][a-z0-9-]*$` (1–64 chars)
- [x] Export helper `isValidId(id: string): boolean`
- [x] Export helper `collectIdsFromRui()` to collect all ids from a parsed RUI (for uniqueness check in §2)

### Step 4 — Bindings schema

In `bindings.ts`:

- [x] Define `ReadBindingSchema` (Zod, `.strict()`): `type`, `method`, `path`, optional `valuePath`
- [x] Export `ReadBinding` type via `z.infer`
- [x] Constrain `type: "read"`, `method: "GET"`, `path` starts with `/`

### Step 5 — Layouts schema

In `layouts.ts`:

- [x] Define `SectionSchema` — `id`, `type`, optional `title`, `direction`, `children` (blocks, min 1)
- [x] Define `PageSchema` — `id`, `type`, `title`, optional `description`, `children` (sections, min 1)
- [x] Use `.strict()` on both
- [x] Wire block union into `SectionSchema.children` (import from `blocks.ts` once ready)

### Step 6 — Blocks schema

In `blocks.ts`:

- [x] Define `MetricSchema`, `TableSchema`, `TextSchema` (all `.strict()`)
- [x] Table: `columns[]` (key, label, optional type enum), optional `filter` (field, label, options)
- [x] Metric: require `binding` with `valuePath` (refine or document for §2 rule R19)
- [x] Export `BlockSchema` as discriminated union on `type`
- [x] Connect to `SectionSchema.children`

### Step 7 — RUI root schema

In `rui.ts`:

- [x] Define `MetaSchema`, `NavigationItemSchema`, `NavigationSchema`, `RuiSchema`
- [x] Top-level: `version`, `meta`, `navigation`, `pages` — `.strict()`, no extra keys
- [x] `pages`: array of `PageSchema`, min length 1
- [x] `navigation.items`: min length 1; each item has `pageId`, `label`
- [x] Export `Rui` type via `z.infer`

### Step 8 — Planned metadata

In `planned.ts`:

- [x] Export `PLANNED_BLOCKS = ["Form", "Button"]`
- [x] Export `PLANNED_BINDINGS = ["write", "action"]`
- [x] Export shape for `/api/schema` → `planned` key (used in §3)

### Step 9 — Rules catalog

In `rules.ts`:

- [x] Export `RULES` array: R0–R24 with `code`, `description` (see [Rules & error codes](#rules--error-codes))
- [x] Semantic rules (nav ↔ pages, duplicate ids, filter field) implemented in §2 validator — catalog documents them here for `/api/schema`

### Step 10 — Golden RUI

In `golden/support-dashboard.rui.json`:

- [x] Copy the [golden example](#golden-example--option-a-support-dashboard) JSON verbatim
- [x] Confirm: one nav item, one page, two metrics, one table with filter

### Step 11 — Wire `index.ts` + local smoke test

In `index.ts`:

- [x] Re-export: `REGISTRY_VERSION`, all schemas, `RULES`, planned metadata
- [x] Export `getSchemaPayload()` — builds JSON object for future `GET /api/schema`
- [x] Export `RUI_FILE_EXTENSION = ".rui.json"`

**Smoke test** (`npm run smoke:registry`):

```bash
npm run smoke:registry
# Parses golden/support-dashboard.rui.json with RuiSchema; rejects extra top-level prop (strict mode)
```

- [x] Golden RUI passes `RuiSchema.safeParse()` (structural)
- [x] Invalid fixture (extra prop) fails with Zod error (strict mode)

### Step 12 — Commit

- [x] Commit: `feat(registry): v0.1 vocabulary — RUI, layouts, blocks, bindings` (`f2ce571`)

---

### Deliverables

- [x] `lib/registry/` module structure as above
- [x] **Zod schemas** for RUI root, navigation, layouts, blocks, bindings (`.strict()` on all objects)
- [x] RUI document — `meta` (app-level), `navigation`, `pages[]`
- [x] Layout definitions — `Page`, `Section`
- [x] Block definitions — `Metric`, `Table`, `Text`
- [x] Binding definition — `ReadBinding`
- [x] Node ID format — regex + helpers in `ids.ts`
- [x] Planned registry — `Form`, `Button`, `write`, `action` metadata
- [x] Rule catalog with error codes (R0–R24)
- [x] Nesting matrix enforced in Zod schemas
- [x] Golden RUI — `golden/support-dashboard.rui.json` (one page + one nav item)
- [x] Registry importable by §2 validator and §3 schema route

### Done when

- [x] All [implementation steps](#implementation-steps) checked off
- [x] Registry exists in `lib/registry/` and exports version `"0.1"`
- [x] All layouts, blocks, bindings, and rules enumerated without reading validator code
- [x] Golden RUI validates against registry types (`npm run smoke:registry`)
- [x] `/api/schema` can be generated from registry modules (`getSchemaPayload()` ready; route in §3)
- [x] Vocabulary fully covers Option A and documents the path to Options B & C

**§1 status: Complete** — ready for §2 Validation Engine.

> **Not in §1 (by design):** Semantic rules R3–R4, R10–R11, R14, R17, R19, R21–R22 are cataloged in `rules.ts` but implemented in §2. `GET /api/schema` route ships in §3.

---

## 2. Validation Engine + `POST /api/validate`

**Purpose:** Accept a RUI JSON payload; return success (with a **canonical normalized RUI**) or a list of agent-actionable errors. Same engine powers `POST /api/specs` (§4).

**Why second:** This is the core hypothesis — agents must self-correct from stable, multi-error validation feedback.

**Rules source:** [§1 Rules & error codes](#rules--error-codes) — implement **R0–R24**.

---

### Decisions (locked for §2)

| Decision | Choice |
|----------|--------|
| Endpoint | `POST /api/validate` |
| Request body | **Raw RUI JSON** (not wrapped in `{ rui: ... }`) |
| HTTP on validation failure | **200** + `{ valid: false, errors[] }` — semantic failures are not transport errors |
| HTTP on transport failure | **400** — invalid JSON, wrong Content-Type, empty body, body too large |
| Multiple errors | **Return all** findings in one response (cap **50**; if more, set `truncated: true`) |
| Error `path` root | **`""`** (empty string = document root; JSON Pointer / RFC 6901 convention) |
| Error `path` format | Bracket indices: `pages[0].children[1].binding.valuePath` |
| Planned types | **Pre-Zod gate** → `PLANNED_NOT_SUPPORTED` (not `UNKNOWN_TYPE`) |
| Invalid RUI on failure | **Echo input unchanged** — no normalization until valid |
| Valid RUI on success | Return **`normalizedRui`** — deterministic order + canonical object key order |
| Node `id` values (v0.1) | **Preserve agent ids** on normalize (validate format + uniqueness only) |
| Node `id` assignment (v0.2+) | Platform-generated ids — deferred; §4 may re-normalize later |
| `validationVersion` | `"0.1"` — exported as `VALIDATION_VERSION` (saved spec field in §4) |
| `registryVersion` | `"0.1"` — from `REGISTRY_VERSION` (§1) |
| Max request body | **256 KB** |
| Automated tests (v0.1) | **Minimal** — golden pass + 2–3 invalid fixtures; expand in §6 / CI later |

---

### Validation pipeline

Runs in order. **Do not skip phases** except: stop after phase 1 on transport failure; stop after phase 4 if any errors (no normalize on invalid).

```txt
Phase 1 — Transport
    Content-Type, size, JSON parse                    → R0

Phase 2 — Planned gate (pre-Zod)
    Walk tree; detect planned block/binding types       → R22

Phase 3 — Structural (Zod)
    RuiSchema.safeParse (strict, from §1)              → R1–R9, R12–R13, R15–R18, R20, R23–R24 (+ mapped R6–R7)

Phase 4 — Semantic (custom)
    Only if phase 3 succeeded (parsed RUI available) → R3–R4, R10–R11, R14, R17, R19, R21

Phase 5 — Normalize (success only)
    Canonical key order + deterministic sibling order   → normalizedRui
```

**Planned gate (phase 2):** Before Zod, depth-first walk any object with `type` string. If `type` ∈ `PLANNED_BLOCKS` or binding `type` ∈ `PLANNED_BINDINGS` → single error `PLANNED_NOT_SUPPORTED` at that node’s path (agents see roadmap hint, not generic unknown type).

**R14 note:** Section-in-Section is usually impossible after Zod (children are blocks only). Keep R14 check in semantic phase for defense-in-depth if parse shape loosens later.

---

### Normalization (v0.1)

Normalization runs **only on successful validation** (phase 5). Purpose: **deterministic specs** for content hashing (§4), diffing, and eval comparisons — agents may emit siblings in any order; stored artifact is always canonical.

**v0.1 does not rewrite `id` strings** — only order and JSON key order. Platform-assigned ids are **v0.2+** (see [§1 Node IDs](#node-ids-v0.1--simplest)).

#### Sibling array ordering (stable sort)

| Array | Sort key | Order |
|-------|----------|-------|
| `pages[]` | `id` | ascending (lexicographic) |
| `navigation.items[]` | `pageId` | ascending |
| `Page.children` (sections) | `id` | ascending |
| `Section.children` (blocks) | `id` | ascending |
| `Table.columns[]` | `key` | ascending |
| `Table.filter.options[]` | `value` | ascending |

#### Object key ordering (canonical)

Emit object keys in this order (omit optional keys if absent):

| Object | Key order |
|--------|-----------|
| RUI root | `version`, `meta`, `navigation`, `pages` |
| `meta` | `title`, `description` |
| `navigation` | `items` |
| NavigationItem | `pageId`, `label` |
| `Page` | `id`, `type`, `title`, `description`, `children` |
| `Section` | `id`, `type`, `title`, `direction`, `children` |
| `Metric` | `id`, `type`, `label`, `format`, `binding` |
| `Table` | `id`, `type`, `title`, `binding`, `columns`, `filter` |
| `Text` | `id`, `type`, `content` |
| `Column` | `key`, `label`, `type` |
| `TableFilter` | `field`, `label`, `options` |
| filter option | `value`, `label` |
| `ReadBinding` | `type`, `method`, `path`, `valuePath` |

**Deferred (v0.2+):** slug normalization for ids, auto-prefix hints, dedupe nav items, strip empty optional strings.

---

### `POST /api/validate` — API contract

#### Request

```http
POST /api/validate
Content-Type: application/json

<body> = RUI JSON (§1)
```

| Check | Failure |
|-------|---------|
| `Content-Type` includes `application/json` | 400 `INVALID_JSON` |
| Body non-empty | 400 |
| Body ≤ 256 KB | 400 |
| Valid JSON object (not array/primitive) | 400 `INVALID_JSON` |

#### Response — success (HTTP 200)

```json
{
  "valid": true,
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

`normalizedRui` is the canonical RUI agents should treat as the validated artifact (use this for `POST /api/specs` in §4).

#### Response — validation failed (HTTP 200)

```json
{
  "valid": false,
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "errors": [
    {
      "path": "pages[0].children[0].binding",
      "code": "MISSING_VALUE_PATH",
      "message": "Metric binding requires valuePath.",
      "hint": "Add valuePath for the scalar field, e.g. \"openCount\" from GET /api/tickets/stats."
    }
  ],
  "truncated": false
}
```

- Return **all** errors from phases 2–4 (dedupe identical `path`+`code` pairs).
- Sort errors by `path` then `code` for stable responses.
- If more than 50 errors: return first 50, `"truncated": true`.

#### Response — transport failure (HTTP 400)

```json
{
  "valid": false,
  "errors": [
    {
      "path": "",
      "code": "INVALID_JSON",
      "message": "Request body must be valid JSON.",
      "hint": "Send Content-Type: application/json with the spec object as the body."
    }
  ]
}
```

Transport responses omit `validationVersion` / `registryVersion` (optional; if included, still `"0.1"`).

---

### Error model

```txt
ValidationError {
  path: string      // "" = root; e.g. pages[0].children[1].columns[2].key
  code: string      // stable machine code from §1 (R0–R24)
  message: string   // human-readable, one sentence
  hint?: string     // how to fix (agent-facing)
}
```

**Path rules:**

- Root = `""` (not `"$"` — JSON Pointer convention, matches AJV/OpenAPI tooling).
- Arrays use bracket notation: `pages[0]`, not `pages.0`.
- Use the **most specific** path (deepest failing node).
- For `DUPLICATE_ID`, path = **second** occurrence’s `id` field (e.g. `pages[0].children[1].id`).

---

### Zod issue → stable code mapping

Map every Zod `ZodIssue` to exactly one RapidUI `code`. Implementation: `lib/validate/zod-mapper.ts`.

| Zod issue kind | RapidUI `code` | Notes |
|----------------|----------------|-------|
| `invalid_literal` on `version` | `VERSION_MISMATCH` | Expected `0.1` |
| `unrecognized_keys` | `UNKNOWN_PROP` | Strict mode |
| `invalid_type`, `invalid_enum_value` | `INVALID_PROP_TYPE` | Includes bad `direction`, `format`, column `type` |
| `invalid_string` (regex) on `id` | `INVALID_ID_FORMAT` | If checked in Zod |
| `too_small` on `pages` | `EMPTY_PAGES` | |
| `too_small` on `navigation.items` | `EMPTY_NAVIGATION` | |
| `too_small` on `Page.children` | `EMPTY_PAGE` | |
| `too_small` on `Section.children` | `EMPTY_SECTION` | |
| `too_small` on `columns` | `INVALID_COLUMNS` | |
| `too_small` on `filter.options` | `INVALID_PROP_TYPE` | Min 1 option |
| `invalid_union`, `invalid_literal` on `type` | `UNKNOWN_TYPE` | After planned gate |
| missing required field | `MISSING_REQUIRED_PROP` | Include field name in `message` |
| custom refine: binding path | `INVALID_BINDING` | R24 |
| custom refine: valuePath | `INVALID_VALUE_PATH` | R23 |
| custom refine: Metric valuePath required | `MISSING_VALUE_PATH` | R19 |

**R2 (RUI root):** Missing required top-level key → `MISSING_REQUIRED_PROP` at the key path (e.g. `navigation`) or `""` if the root object is empty. Extra top-level key → `UNKNOWN_PROP` at that key (e.g. `foo`).

**R6:** Do not implement separately — always map Zod required errors → `MISSING_REQUIRED_PROP`.

---

### Rule implementation map (R0–R24)

| Rule | Phase | Path example | Primary `code` |
|------|-------|--------------|----------------|
| R0 | 1 | `""` | `INVALID_JSON` |
| R1 | 3 | `version` | `VERSION_MISMATCH` |
| R2 | 3 | `navigation`, `pages`, etc. | `MISSING_REQUIRED_PROP` |
| R3 | 4 | second `id` field | `DUPLICATE_ID` |
| R4 | 3/4 | `pages[0].id` | `INVALID_ID_FORMAT` |
| R5 | 2/3 | node `type` | `PLANNED_NOT_SUPPORTED` / `UNKNOWN_TYPE` |
| R6 | 3 | prop path | `MISSING_REQUIRED_PROP` |
| R7 | 3 | prop path | `INVALID_PROP_TYPE` / `UNKNOWN_PROP` |
| R8–R9 | 3 | `pages` / `navigation.items` | `EMPTY_PAGES` / `EMPTY_NAVIGATION` |
| R10 | 4 | `navigation.items[0].pageId` | `INVALID_NAV_PAGE_ID` |
| R11 | 4 | `pages[1].id` | `ORPHAN_PAGE` |
| R12–R13 | 3 | child path | `INVALID_PAGE_CHILD` / `INVALID_SECTION_CHILD` |
| R14 | 4 | nested section path | `INVALID_NESTING` |
| R15–R16 | 3 | `pages[0].children` | `EMPTY_PAGE` / `EMPTY_SECTION` |
| R17 | 4 | `...columns[1].key` | `INVALID_COLUMNS` |
| R18 | 3 | `...binding` | `MISSING_BINDING` |
| R19 | 3/4 | `...binding` | `MISSING_VALUE_PATH` |
| R20 | 3 | `...binding` | `INVALID_BINDING` |
| R21 | 4 | `...filter.field` | `INVALID_FILTER_FIELD` |
| R22 | 2 | planned node | `PLANNED_NOT_SUPPORTED` |
| R23 | 3 | `...binding.valuePath` | `INVALID_VALUE_PATH` |
| R24 | 3 | `...binding.path` | `INVALID_BINDING` |

---

### Message & hint catalog

Templates for `lib/validate/messages.ts`. §3 `/api/docs` re-exports this catalog.

| Code | Message (template) | Hint (template) |
|------|-------------------|-----------------|
| `INVALID_JSON` | Request body must be valid JSON. | Send `Content-Type: application/json` with the spec object as the raw body. |
| `VERSION_MISMATCH` | RUI version must be "0.1". | Set `version` to `"0.1"` to match the registry. |
| `DUPLICATE_ID` | Duplicate node id "{id}". | Each Page, Section, and block id must be unique across the entire spec. |
| `INVALID_ID_FORMAT` | Invalid id "{id}". | Use lowercase kebab-case: `^[a-z][a-z0-9-]*$`, 1–64 chars (e.g. `table-tickets`). |
| `UNKNOWN_TYPE` | Unknown node type "{type}". | Use Page, Section, Metric, Table, or Text for v0.1. |
| `MISSING_REQUIRED_PROP` | Missing required property "{prop}". | Add the property per the spec shape (top-level: `version`, `meta`, `navigation`, `pages`; see §3 schema when live). |
| `INVALID_PROP_TYPE` | Invalid value for "{prop}". | Check type and allowed enum values in the schema. |
| `UNKNOWN_PROP` | Unknown property "{prop}". | Remove extra properties; v0.1 uses strict schemas. |
| `EMPTY_PAGES` | RUI must include at least one page. | Add a `pages` array with one or more Page nodes. |
| `EMPTY_NAVIGATION` | Navigation must include at least one item. | Add `navigation.items` linking to each page via `pageId`. |
| `INVALID_NAV_PAGE_ID` | Navigation pageId "{pageId}" does not match any page. | Set `pageId` to an existing `pages[].id`. |
| `ORPHAN_PAGE` | Page "{id}" is not linked from navigation. | Add a navigation item with `pageId` matching this page. |
| `INVALID_PAGE_CHILD` | Page children must be Section nodes. | Only Section nodes allowed under Page. |
| `INVALID_SECTION_CHILD` | Section children must be Metric, Table, or Text. | Blocks only under Section — no nested sections. |
| `INVALID_NESTING` | Sections cannot be nested inside sections. | Use Page → Section → Block structure only. |
| `EMPTY_PAGE` | Page must contain at least one section. | Add a Section to `children`. |
| `EMPTY_SECTION` | Section must contain at least one block. | Add Metric, Table, or Text to `children`. |
| `INVALID_COLUMNS` | Table must have at least one column with unique keys. | Define `columns[]` with unique `key` per column. |
| `MISSING_BINDING` | {blockType} requires a read binding. | Add `binding` with `type: "read"`, `method: "GET"`, and `path`. |
| `MISSING_VALUE_PATH` | Metric binding requires valuePath. | Set `valuePath` to the scalar field (e.g. `"openCount"`). |
| `INVALID_BINDING` | Invalid read binding. | Use `type: "read"`, `method: "GET"`, `path` starting with `/`. |
| `INVALID_FILTER_FIELD` | Filter field "{field}" does not match a column key. | Set `filter.field` to an existing column `key`. |
| `PLANNED_NOT_SUPPORTED` | "{type}" is planned for a future version. | v0.1 supports Metric, Table, Text and read (GET) bindings only. |
| `INVALID_VALUE_PATH` | Invalid valuePath "{valuePath}". | Use dot segments only (e.g. `"data.items"`), no JSONPath or brackets. |

---

### Invalid fixture catalog

Under `lib/validate/fixtures/`. Used for minimal smoke tests and §6 eval debugging.

| File | Trigger | Expected primary `code` | Path (example) |
|------|---------|-------------------------|----------------|
| `golden-valid.rui.json` | §1 golden RUI (any sibling order) | *(pass)* | — |
| `invalid-json.txt` | non-JSON body | `INVALID_JSON` | `""` |
| `wrong-version.json` | `version: "0.2"` | `VERSION_MISMATCH` | `version` |
| `extra-top-level.json` | `"foo": 1` at root | `UNKNOWN_PROP` | `foo` |
| `duplicate-id.json` | same `id` on two nodes | `DUPLICATE_ID` | second id path |
| `bad-id-format.json` | `id: "Table_1"` | `INVALID_ID_FORMAT` | offending `id` |
| `orphan-page.json` | page not in nav | `ORPHAN_PAGE` | `pages[1].id` |
| `bad-nav-page-id.json` | bad `pageId` | `INVALID_NAV_PAGE_ID` | `navigation.items[0].pageId` |
| `metric-no-value-path.json` | Metric without valuePath | `MISSING_VALUE_PATH` | `...binding` |
| `filter-bad-field.json` | filter.field ≠ column | `INVALID_FILTER_FIELD` | `...filter.field` |
| `planned-form.json` | `type: "Form"` | `PLANNED_NOT_SUPPORTED` | form node path |
| `invalid-value-path.json` | `valuePath: "items[0]"` | `INVALID_VALUE_PATH` | `...valuePath` |
| `binding-path-relative.json` | `path: "api/tickets"` | `INVALID_BINDING` | `...binding.path` |

**Minimal v0.1 test scope:** assert `golden-valid.json` → pass + `normalizedRui` stable; assert `wrong-version.json`, `duplicate-id.json`, `planned-form.json` → expected codes.

---

### Module layout

```txt
lib/validate/
├── index.ts              # validateSpec(input): ValidationResult
├── version.ts            # VALIDATION_VERSION = "0.1"
├── pipeline.ts           # phases 1–5 orchestration
├── transport.ts          # Content-Type, size, JSON parse
├── planned-gate.ts       # phase 2 — R22
├── zod-mapper.ts         # ZodIssue → ValidationError
├── semantic/
│   ├── index.ts          # runSemanticChecks(spec)
│   ├── ids.ts            # R3, R4 (uses registry collectIds)
│   ├── navigation.ts     # R10, R11
│   ├── table.ts          # R17, R21
│   └── nesting.ts        # R14
├── normalize.ts          # phase 5 — canonical order
├── messages.ts           # ERROR_CATALOG — codes, templates
└── fixtures/             # JSON fixtures (table above)

app/api/validate/route.ts # POST handler → validateSpec
```

**Public exports for cross-section hooks:**

| Export | Used by |
|--------|---------|
| `validateSpec(body: unknown)` | `/api/validate`, §4 `POST /api/specs` |
| `VALIDATION_VERSION` | Receipts, API responses |
| `ERROR_CATALOG` | §3 `/api/docs` error section |
| `ValidationResult` type | §4 store only if `valid === true` |

---

### Implementation steps

**Prerequisites:** §0 complete; §1 registry + Zod schemas; `lib/validate/` folder exists.

### Step 1 — Scaffold validate modules

- [x] Create `lib/validate/` tree per [module layout](#module-layout-1)
- [x] `version.ts` → `VALIDATION_VERSION = "0.1"`
- [x] `index.ts` exports `validateSpec`, types

### Step 2 — Transport (phase 1)

- [x] `transport.ts` — parse JSON, 256 KB limit, object root check
- [x] Map failures → `INVALID_JSON` at `path: ""`

### Step 3 — Planned gate (phase 2)

- [x] `planned-gate.ts` — walk tree, compare to `PLANNED_BLOCKS` / `PLANNED_BINDINGS`
- [x] Return early with `PLANNED_NOT_SUPPORTED` + hint

### Step 4 — Zod structural (phase 3)

- [x] `RuiSchema.safeParse` from §1
- [x] Add Zod refines: `ReadBinding.path` starts with `/` (R24), `valuePath` regex (R23), Metric `valuePath` required (R19) — in §1 schemas
- [x] `zod-mapper.ts` — map all issues per [Zod mapping table](#zod-issue--stable-code-mapping)

### Step 5 — Semantic checks (phase 4)

- [x] `semantic/ids.ts` — global uniqueness (R3), format (R4) via registry helpers
- [x] `semantic/navigation.ts` — R10, R11
- [x] `semantic/table.ts` — duplicate column keys (R17), filter field (R21)
- [x] `semantic/nesting.ts` — R14 (if applicable)

### Step 6 — Normalize (phase 5)

- [x] `normalize.ts` — sibling sorts + canonical key order per [normalization](#normalization-v01)
- [x] Unit smoke: two specs differing only in sibling order → identical `normalizedRui`

### Step 7 — Messages catalog

- [x] `messages.ts` — `ERROR_CATALOG` from [message & hint catalog](#message--hint-catalog)
- [x] `formatError(code, context)` for template interpolation

### Step 8 — Pipeline + fixtures

- [x] `pipeline.ts` wires phases; caps errors at 50; stable sort of errors
- [x] Copy fixtures into `lib/validate/fixtures/` (minimal v0.1 set)
- [x] Minimal script or test: golden pass; 3 invalid codes (`npm run smoke:validate`)

### Step 9 — API route

- [x] `app/api/validate/route.ts` — POST only; call `validateFromRequest` / `validateSpec`
- [x] Return 200/400 per [API contract](#post-apivalidate--api-contract)

### Step 10 — Smoke on production

- [x] `POST https://rapidui.dev/api/validate` with golden RUI (manual body from `golden/support-dashboard.rui.json`) → `valid: true` + `normalizedRui`
- [x] Invalid body → 400

### Step 11 — Commit

- [x] Commit: `feat(validate): v0.1 pipeline, normalize, POST /api/validate` (`0fddb09`)

---

### Deliverables

- [x] `lib/validate/` module (pipeline, semantic, normalize, messages)
- [x] `validateSpec()` — shared by `/api/validate` and §4
- [x] `POST /api/validate` route with documented contracts
- [x] `ERROR_CATALOG` for §3
- [x] `normalizedRui` on success (deterministic order)
- [x] Fixture files + minimal smoke coverage
- [x] R0–R24 implemented per rule map

### Done when

- [x] Golden RUI passes and `normalizedRui` is stable across input order permutations
- [x] Fixture invalid RUIs return expected `code` at expected `path` (minimal set: version, duplicate id, planned Form)
- [x] Multi-error response returns several issues in one call (e.g. duplicate id + bad nav)
- [x] `PLANNED_NOT_SUPPORTED` fires before `UNKNOWN_TYPE` for `Form` / `Button`
- [x] §4 can import `validateSpec` without duplicating logic
- [x] **Ready to start §3 Agent Documentation** (error catalog + real validator)

**§2 status: Complete** — ready for §3 Agent Documentation.

> **Not in §2 (by design):** Full fixture catalog (§6 eval debugging), `GET /api/docs` / `GET /api/schema` (§3), remaining invalid fixtures from [fixture catalog](#invalid-fixture-catalog).

---

## 3. Agent Documentation

**Purpose:** Everything an external agent needs to produce valid RUIs without out-of-band instructions.

**Why third:** Write docs against a **real** validator and registry — avoids doc/implementation drift.

**Research basis:** Industry patterns for agent-facing APIs (llms.txt, dual JSON + markdown docs, structured errors, MCP/A2A as adjacent standards) — see [Agent-facing API research (reference)](#agent-facing-api-research-reference).

---

### Decisions (locked for §3)

| Decision | Choice |
|----------|--------|
| Discovery index | **`GET /llms.txt`** at site root (Markdown index → `/api/docs`, `/api/schema`, workflow) |
| Narrative + workflow | **`GET /api/docs`** — JSON envelope with markdown sections + embedded JSON for errors/API |
| Vocabulary | **`GET /api/schema`** — `getSchemaPayload()` from §1 (no hand-maintained duplicate) |
| Error catalog | Re-export **`ERROR_CATALOG`** from `lib/validate/messages.ts` (single source with validator) |
| Golden example | Embed **`support-dashboard.rui.json`** in docs `examples` section |
| **`POST /api/specs` in §3** | **Stub only** — route exists, returns **501** + machine-readable `planned` body (full store in §4) |
| Auth | None (v0.1) — no `auth.md` until post–v0.1 |
| MCP server | Out of §3 — optional post–v0.1 wrapper around validate/schema |
| Narrative doc content | **`lib/docs/content/*.md`** — loaded via `readDoc()` in server code (not inline TS strings, not pasted from `.cursor/` plan) |
| Homepage `/` | **§3 minimal hub** — human one-liner + “For agents” links; full marketing / §5 inspector link **later** |
| Base URL | `https://rapidui.dev` |

#### Naming: RUI vs `specs` (locked)

| Term | Use for |
|------|---------|
| **RUI** | The artifact — JSON document, `.rui.json`, blocks, bindings. All **prose** in docs and agent instructions. |
| **spec** (API only) | HTTP resource for a **stored** RUI — paths stay **`/api/specs`**, response is flat **`SavedSpec`** with `specId` |

**Do not rename routes to `/api/ruis` for v0.1.** “Spec” is the persisted document handle (common in API design); “RUI” is the format name. Docs must state explicitly: *“A spec is a stored RUI.”* Request/response bodies for validate and store use the **RUI JSON shape** (raw document), not a wrapper `{ "rui": … }`.

---

### Agent discovery surface

```txt
https://rapidui.dev/
├── /                           ← §3: minimal homepage (humans + link hub for agents)
├── llms.txt                    ← §3: agent entry (index + Instructions) — well-known URL
├── api/
│   ├── docs                    ← §3: overview, workflow, errors, examples, API contracts
│   ├── schema                  ← §3: vocabulary (registry-generated)
│   ├── validate                ← §2: POST (live)
│   └── specs                   ← §3 stub (501) → §4 full implementation
```

#### How agents find `llms.txt` (no homepage required)

Agents discover docs by **URL convention**, not by parsing the marketing page:

- Eval prompts and README should say: *“Base URL: `https://rapidui.dev` — start with `GET /llms.txt`.”*
- IDEs (Cursor, Claude Code, etc.) often probe `https://<domain>/llms.txt` when given a dependency or API domain.
- `/api/docs` is the full bundle if the agent skips the index.

The homepage is a **backup** for humans and agents that land on `/` first — it must link to `/llms.txt`, `/api/docs`, and `/api/schema` with plain `<a href="...">` (no JS-only nav). Optional `<link rel="alternate" type="text/markdown" href="/llms.txt">` in layout metadata.

**Do not** embed full API docs in homepage HTML; keep `/` a **map**, not the manual.

**Recommended agent workflow (documented in llms.txt + `/api/docs`):**

```txt
1. GET /llms.txt  (or GET /api/docs)
2. GET /api/schema
3. Agent authors RUI JSON in memory / file
4. POST /api/validate  → loop on errors[] until valid: true
5. POST /api/specs     → §3: 501 planned; §4: flat SavedSpec
```

---

### `GET /llms.txt`

Served from `app/llms.txt/route.ts` or static `public/llms.txt` (prefer **route** so `baseUrl` stays in sync with env).

**Required sections (llmstxt.org order):**

1. `# RapidUI` + blockquote one-liner
2. Short body — what it is / is not (v0.1 scope)
3. **`## Instructions`** — eval prompt, “emit RUI not React”, validate retry loop, link to golden example
4. **`## Documentation`** — links to `/api/docs`, `/api/schema`
5. **`## API`** — links to `POST /api/validate`, `POST /api/specs` (note: store planned until §4)

Optional later: `llms-full.txt` concatenating docs + schema (not required for v0.1).

**Content source:** Assembled by `getLlmsTxt()` in `lib/docs/llms.ts` — excerpts from `content/instructions.md` (or dedicated block) + link lists; do not maintain a second full copy of all section bodies.

---

### Homepage `GET /` (minimal hub — §3)

Replace the Next.js scaffold with a simple landing page. **Not** a full marketing site in §3; polish later. §5 inspector (`/specs/[id]`) can be linked from `/` when that section ships.

**Include:**

| Area | Content |
|------|---------|
| Hero (humans) | One line: RapidUI = validate → correct → save **RUIs** (not React apps) |
| Status | Link to `GET /api/health` or inline `{ ok: true }` check |
| **For agents** | Visible section with links: `/llms.txt`, `/api/docs`, `/api/schema`, `POST /api/validate` (note: `POST /api/specs` planned) |
| **For developers** | Link to GitHub / README (optional) |
| Footer | `rapidui.dev` — v0.1 |

**Explicitly defer to later:** visual brand, diagrams, demo video, link to §5 RUI inspector, auth.md.

**File:** `app/page.tsx` (+ minimal styling with existing Tailwind). No fetch of full docs into the page — links only.

---

### Doc content maintenance (`lib/docs/content/*.md`)

Narrative sections are **real Markdown files**, assembled at runtime in API routes (server-only).

```txt
lib/docs/
├── index.ts              # getDocsPayload()
├── llms.ts               # getLlmsTxt()
├── load.ts               # readDoc("overview") → readFileSync
└── content/
    ├── overview.md       # what it is / is not (v0.1)
    ├── workflow.md       # schema → author RUI → validate loop
    ├── nesting.md        # Page → Section → Block
    ├── getting-started.md
    └── instructions.md   # Stripe-style rules for llms.txt ## Instructions
```

**Loader:**

```ts
// lib/docs/load.ts — readFileSync from lib/docs/content/{name}.md
export function readDoc(name: string): string { ... }
```

| Content type | Source | Never |
|--------------|--------|--------|
| Narrative markdown | `content/*.md` via `readDoc()` | Paste into `.ts` strings |
| Errors | `ERROR_CATALOG` import | Duplicate in `.md` |
| Vocabulary | `getSchemaPayload()` | Hand-write in `.md` |
| Golden RUI | `golden/support-dashboard.rui.json` | Copy into `.md` |
| Engineering plan | `.cursor/*.md` | Serve to agents (too long; drifts) |

Start with **empty or outline `.md` files** in Step 1; fill copy during implementation. PRs that change agent-facing prose edit `lib/docs/content/` only.

---

### `GET /api/schema`

Thin route handler:

```ts
return NextResponse.json(getSchemaPayload());
```

**Response:** Already defined in §1 — `version`, `rui`, `layouts`, `blocks`, `bindings`, `rules`, `planned`, `ids`. No duplicate prose in schema JSON.

**Cache:** `Cache-Control: public, max-age=3600` (registry version bumps invalidate by redeploy).

---

### `GET /api/docs`

**Response shape (locked):**

```json
{
  "docsVersion": "0.1",
  "baseUrl": "https://rapidui.dev",
  "rui": {
    "fileExtension": ".rui.json",
    "description": "..."
  },
  "links": {
    "llmsTxt": "/llms.txt",
    "schema": "/api/schema",
    "validate": "/api/validate",
    "specs": "/api/specs"
  },
  "sections": [
    { "id": "overview", "format": "markdown", "content": "..." },
    { "id": "workflow", "format": "markdown", "content": "..." },
    { "id": "nesting", "format": "markdown", "content": "..." },
    { "id": "api", "format": "json", "content": { "validate": { ... }, "specs": { "status": "planned", ... } } },
    { "id": "errors", "format": "json", "content": [ { "code": "DUPLICATE_ID", "message": "...", "hint": "..." } ] },
    { "id": "examples", "format": "json", "content": { "supportDashboard": { "prompt": "...", "mockApi": { ... }, "goldenRui": { ... } } } },
    { "id": "gettingStarted", "format": "markdown", "content": "..." }
  ]
}
```

**Section sources (no drift):**

| Section | Source |
|---------|--------|
| `overview`, `workflow`, `nesting`, `gettingStarted` | `readDoc("overview")` etc. from `lib/docs/content/*.md` |
| `api.validate` | §2 [API contract](#post-apivalidate--api-contract) as JSON in payload; duplicate fenced `http`/`json` in `workflow.md` for agents |
| `api.specs` | Stub contract + “implemented in §4” |
| `errors` | `ERROR_CATALOG` mapped to array |
| `examples.supportDashboard` | Golden file + [Demo Scenario](#demo-scenario) prompt + illustrative `mockApi` in TS/JSON (not `.md`) |

**`mockApi` (v0.1):** Illustrative only — no live execution. Include minimal JSON shapes for `GET /api/tickets` and `GET /api/tickets/stats` so agents can set `valuePath` and columns (derived from golden bindings).

---

### `POST /api/specs` — §3 stub (plug)

**Purpose:** Route exists in docs and OpenAPI-minded agents can probe it; **no Postgres** until §4.

| Method | Path | §3 behavior |
|--------|------|-------------|
| POST | `/api/specs` | **501** `application/json` |
| GET | `/api/specs/:id` | **501** (optional in §3; or omit dynamic route until §4) |

**Stub response body:**

```json
{
  "status": "planned",
  "message": "RUI persistence is not available yet. Use POST /api/validate and keep normalizedRui locally until §4 ships.",
  "implementedIn": "§4",
  "docs": "https://rapidui.dev/api/docs",
  "validate": "https://rapidui.dev/api/validate"
}
```

Document in `/api/docs` → `api.specs` with same shape. Eval loop (§6) may skip save until §4 or treat 501 as expected.

---

### Module layout

```txt
lib/docs/
├── index.ts              # getDocsPayload()
├── llms.ts               # getLlmsTxt()
├── load.ts               # readDoc(name) → content/*.md
├── mock-api.ts           # illustrative Option A response shapes (optional)
└── content/
    ├── overview.md
    ├── workflow.md
    ├── nesting.md
    ├── getting-started.md
    └── instructions.md

app/
├── page.tsx              # §3 minimal homepage hub
├── llms.txt/route.ts     # GET /llms.txt → getLlmsTxt()
└── api/
    ├── docs/route.ts     # GET → getDocsPayload()
    ├── schema/route.ts   # GET → getSchemaPayload()
    └── specs/route.ts    # POST → 501 stub (§3); §4 replaces
```

Registry and validate logic stay in `lib/registry/` and `lib/validate/` — docs **import**, never fork.

---

### Implementation steps

**Prerequisites:** §1 `getSchemaPayload()`, §2 `ERROR_CATALOG` + `POST /api/validate` live.

#### Step 1 — Scaffold `lib/docs/` + markdown files

- [x] Create `lib/docs/load.ts` with `readDoc(name)` reading `lib/docs/content/{name}.md`
- [x] Add empty/outline `.md` files: `overview`, `workflow`, `nesting`, `getting-started`, `instructions`
- [x] `overview.md` — v0.1 scope; out-of-scope: renderer, live API execution, auth
- [x] `getting-started.md` — copy-paste block: base URL, `GET /llms.txt`, fetch order, support-dashboard prompt
- [x] `instructions.md` — emit RUI not React; validate retry loop (feeds `llms.txt` ## Instructions)

#### Step 2 — `getDocsPayload()` + `getLlmsTxt()`

- [x] `lib/docs/index.ts` assembles JSON per [response shape](#get-apidocs); markdown sections via `readDoc()`
- [x] `lib/docs/llms.ts` — `getLlmsTxt()` from `instructions.md` + link sections (no duplicate full bodies)
- [x] Map `ERROR_CATALOG` → `sections[id=errors]`
- [x] Load golden RUI from `lib/registry/golden/support-dashboard.rui.json`
- [x] Add `mockApi` illustrative shapes for Option A endpoints (`mock-api.ts` or inline in `index.ts`)

#### Step 3 — `GET /api/schema`

- [x] `app/api/schema/route.ts`
- [x] Smoke: 200, `version === "0.1"`, blocks include Metric/Table/Text

#### Step 4 — `GET /api/docs`

- [x] `app/api/docs/route.ts`
- [x] `api.validate` documents §2 contract (200 on semantic failure, 400 transport, `normalizedRui`)
- [x] `api.specs` documents stub / planned

#### Step 5 — `GET /llms.txt`

- [x] `app/llms.txt/route.ts` → `getLlmsTxt()`; `Content-Type: text/markdown; charset=utf-8`
- [x] Verify `curl https://rapidui.dev/llms.txt` returns 200 without visiting `/` first

#### Step 5b — Homepage hub `GET /`

- [x] Replace scaffold `app/page.tsx` with minimal RapidUI landing (see [Homepage](#homepage-get---minimal-hub--3))
- [x] “For agents” links: `/llms.txt`, `/api/docs`, `/api/schema`, validate endpoint
- [x] Optional: `<link rel="alternate" type="text/markdown" href="/llms.txt" />` in `app/layout.tsx`

#### Step 6 — `POST /api/specs` stub

- [x] `app/api/specs/route.ts` — POST only → 501 + body above
- [x] Do **not** connect `DATABASE_URL` in §3

#### Step 7 — Smoke + production

- [x] `npm run smoke:docs` — fetch docs/schema/llms.txt, assert errors length, golden validates via existing smoke
- [x] `curl https://rapidui.dev/` — homepage contains link to `/llms.txt`
- [x] `curl https://rapidui.dev/llms.txt`
- [x] `curl https://rapidui.dev/api/docs` | `curl https://rapidui.dev/api/schema`
- [x] `curl -X POST https://rapidui.dev/api/specs` → 501 + `status: planned`

#### Step 8 — README + hints

- [x] README links: `/llms.txt`, `/api/docs`, `/api/schema`
- [x] Optional: update `MISSING_REQUIRED_PROP` hint in `messages.ts` to reference `GET /api/schema` (remove “when live”)

#### Step 9 — Commit

- [x] Commit: `feat(docs): agent docs, llms.txt, homepage hub, schema route, specs stub` (`5163958`)

---

### Deliverables

- [x] `lib/docs/` — `load.ts`, `content/*.md`, `getDocsPayload()`, `getLlmsTxt()`
- [x] `GET /llms.txt` at production root (well-known agent entry)
- [x] `GET /` — minimal homepage with human copy + “For agents” links
- [x] `GET /api/docs` — overview, workflow, errors, examples, API usage (validate live, specs planned)
- [x] `GET /api/schema` — registry-generated vocabulary
- [x] `POST /api/specs` — 501 stub with machine-readable planned response
- [x] `npm run smoke:docs`
- [x] Naming convention documented: **RUI** in prose, **`/api/specs`** for stored documents (§4)

### Done when

- [x] `GET /llms.txt` works without loading `/` first (agents use well-known URL) — verified locally via `npm run dev` + `curl localhost:3000/llms.txt`
- [x] `/` links to `/llms.txt`, `/api/docs`, and `/api/schema` for humans and fallback discovery
- [x] Fresh agent session with only `https://rapidui.dev/llms.txt` (or `/api/docs`) + `/api/schema` can author a plausible support-dashboard RUI and call `POST /api/validate` — manual eval: single-page, multi-page, and thin-prompt variants all validated
- [x] Error responses are interpretable via `errors[]` in docs without reading validator source
- [x] `POST /api/specs` returns predictable 501 (not 404) so docs and eval scripts can reference it — verified locally
- [x] **Ready to start §4 RUI Store** (replace specs stub with Postgres + flat SavedSpec)

**§3 status: Complete** — committed (`5163958`), production verified on `rapidui.dev`, manual agent eval passed (valid RUIs from thin prompts including two-page layout).

> **Not in §3 (by design):** Postgres, real `POST/GET /api/specs`, MCP server, `auth.md`, `llms-full.txt`, OpenAPI export, §6 eval case files, full marketing site, §5 inspector on homepage (add link when §5 ships).

---

## 4. RUI Store + `POST /api/specs`

**Purpose:** Persist validated RUIs to Postgres and return the **saved spec** — one flat JSON object. Completes the **validate → correct → save** loop.

**Why fourth:** Validation (§2) and agent docs (§3) are live; storage is orchestration on top of `validateSpec()` + `DATABASE_URL` (provisioned in §0).

**Prerequisites:** §0 (`DATABASE_URL`), §2 (`validateSpec`, `parseTransportRequest`, `normalizedRui`), §3 (docs reference store endpoints — update when §4 ships).

---

### Platform artifact vs what the user cares about

Two different audiences — do not conflate them:

| Audience | v0.1 (now) | v0.2+ (target) |
|----------|------------|----------------|
| **End user** | Temporary: agent shares **`viewUrl`** (§5 inspector) — **stand-in** until renderer exists | **`appUrl`** — the live application they can open and use (like canvas / deployed app today) |
| **Platform / agent / ops** | **`specId`**, `url`, `contentHash`, versions — internal artifact handle + audit | Same — spec remains the source document the renderer consumes; visible on ops dashboard, not the user headline |

```txt
v0.1 loop (proof):
  User prompt → agent → validate → save → user opens viewUrl (§5 inspector)

v0.2+ loop (product):
  User prompt → agent → validate → save → render → appUrl
                                      ↑
                              specId stays internal;
                              user never needs spec JSON
```

**Terminology:** In prose, “receipt” means **the saved spec record as a whole** (id + audit fields + RUI) — not a nested JSON key. The API returns **one flat object**; no `{ receipt: { … } }` wrapper.

§4 **`url`** is a **platform retrieve link** (`GET /api/specs/:id`), not the final user-facing app URL. Agents should treat it as proof-of-save and platform bookkeeping until **`appUrl`** ships with the renderer.

### Decisions (locked for §4)

| Decision | Choice |
|----------|--------|
| Storage | **Postgres** (Vercel Postgres via `DATABASE_URL`) — not filesystem, not `generated/` |
| DB access | **`@vercel/postgres`** + raw SQL migration — no ORM for v0.1 |
| Write path | **Re-validate inline** on every `POST /api/specs` — no validation token |
| Request body | **Raw RUI JSON** (same as `POST /api/validate` — not wrapped in `{ "rui": … }`) |
| Stored artifact | **`normalizedRui`** from `validateSpec()` — never store pre-normalization input |
| `specId` format | **UUID v4** — server-generated via `crypto.randomUUID()`; agents do not pick ids |
| Duplicate RUI | **Always insert new row** — same `contentHash` gets a new `specId` (dedupe deferred to v0.2+) |
| Listing | **`GET /api/specs` out of scope** for v0.1 — only POST + GET by id |
| `eval_runs` table | **§6 only** — §4 ships `specs` table only |
| Preview vs prod DB | **Same Postgres** linked to all Vercel envs (Production + Preview + Development) — acceptable for v0.1; isolate per env post–v0.1 if needed |
| POST success HTTP | **201 Created** |
| Validation failure on write | **Same as validate** — HTTP **200** + `{ valid: false, errors[] }` |
| Transport failure on write | **Same as validate** — HTTP **400** + `INVALID_JSON` |
| DB unavailable | **503** + machine-readable `{ error: "STORAGE_UNAVAILABLE", message: "…" }` |
| Response shape | **Single flat object** — no nested `receipt`; each field appears once |
| Saved spec fields | `specId`, `url`, `viewUrl` (§5), `createdAt`, `contentHash`, `validationVersion`, `registryVersion`, `normalizedRui` |
| `contentHash` | **`sha256:`** + hex digest of `JSON.stringify(normalizedRui)` |
| Public **`url`** | **`${baseUrl}/api/specs/${specId}`** — platform retrieve link; computed via `buildSpecUrl(specId)`; not stored in Postgres |
| Human **`viewUrl`** | **`${baseUrl}/specs/${specId}`** — §5 inspector page; added to SavedSpec when §5 ships via `buildViewUrl(specId)` |
| User-facing **`appUrl`** | **v0.2+** with renderer — what end users actually open; replaces spec `url` as the agent handoff |
| Local files after save | **Not required** — platform is source of truth; no `.rui.json` on disk |
| GET not found | **404** + `{ error: "NOT_FOUND", specId: "…" }` |
| Invalid `specId` in URL | **400** + `{ error: "INVALID_SPEC_ID", message: "…" }` |
| Max request body | **256 KB** (reuse `parseTransportRequest` from §2) |
| Local `generated/*.rui.json` | **Unchanged** — manual eval artifacts; not wired to store |

---

### Postgres schema

Single table for v0.1. Migration SQL committed in repo; run once against Vercel Postgres before smoke/production verify.

```sql
-- lib/db/migrations/001_specs.sql

CREATE TABLE IF NOT EXISTS specs (
  id                  UUID PRIMARY KEY,
  content_hash        TEXT NOT NULL,
  validation_version  TEXT NOT NULL,
  registry_version    TEXT NOT NULL,
  rui                 JSONB NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS specs_content_hash_idx ON specs (content_hash);
```

| Column | Source |
|--------|--------|
| `id` | `crypto.randomUUID()` at insert — exposed as `specId` in API |
| `content_hash` | `sha256:` + hex of canonical JSON (see below) |
| `validation_version` | `VALIDATION_VERSION` from validate result |
| `registry_version` | `REGISTRY_VERSION` from validate result |
| `rui` | `normalizedRui` JSONB |
| `created_at` | DB default `NOW()` — echoed as ISO 8601 `createdAt` in API |

**Migration runner:** `scripts/migrate.ts` (or `npm run db:migrate`) — reads SQL file, executes via `@vercel/postgres`. Idempotent (`CREATE TABLE IF NOT EXISTS`). Document in README.

---

### Content hash

Purpose: auditable fingerprint of the stored artifact; enables future dedupe and eval comparisons.

```txt
normalizedRui  ← validateSpec() phase 5 (deterministic key + sibling order, §2)
       ↓
JSON.stringify(normalizedRui)
       ↓
SHA-256 → hex digest
       ↓
contentHash = "sha256:" + hex
```

**Implementation:** `lib/db/hash.ts` — `computeContentHash(rui: Rui): string` using Node `crypto.createHash("sha256")`.

Normalization in §2 exists specifically so identical semantic RUIs produce identical hashes regardless of agent emission order.

---

### Saved spec response (flat — no nested `receipt`)

POST **201** and GET **200** return the **same single-level object**. The whole response **is** the saved spec (what we call “receipt” in prose — the platform’s record of a validated save).

```txt
SavedSpec {
  specId: string              // UUID — DB primary key; internal handle for render/eval/ops
  url: string                 // buildSpecUrl(specId) — API retrieve (agents, scripts)
  viewUrl: string             // buildViewUrl(specId) — human inspect (§5)
  createdAt: string           // ISO 8601 UTC
  contentHash: string         // "sha256:…" — fingerprint of normalizedRui
  validationVersion: string   // "0.1" — validator at save time
  registryVersion: string     // "0.1" — vocabulary at save time
  normalizedRui: Rui         // the stored document (renderer input in v0.2+)
}
```

| Field | Role | Stored in DB? |
|-------|------|---------------|
| `specId` | Platform id — render, evals, dashboard | Yes (`specs.id`) |
| `url` | API retrieve link — agents, audit, scripts | No — computed |
| `viewUrl` | Human inspector link — share with user after save (§5) | No — computed |
| `createdAt` | When saved | Yes (`specs.created_at`) |
| `contentHash` | Audit / eval fingerprint | Yes (`specs.content_hash`) |
| `validationVersion` | Rules snapshot | Yes (`specs.validation_version`) |
| `registryVersion` | Vocabulary snapshot | Yes (`specs.registry_version`) |
| `normalizedRui` | The RUI artifact | Yes (`specs.rui` JSONB) |

**No nested objects except `normalizedRui` itself** (the RUI tree). No duplicate fields.

**URL builders:** `lib/db/urls.ts` — `buildSpecUrl(specId)`, `buildViewUrl(specId)` (§5).

---

### `lib/db/` layout

```txt
lib/db/
├── index.ts            # optional barrel — re-export insertSpec, getSpecById, SavedSpec (match lib/validate/)
├── client.ts           # sql`` helper from @vercel/postgres; fail fast if DATABASE_URL missing
├── hash.ts             # computeContentHash(normalizedRui)
├── urls.ts             # buildSpecUrl(specId), buildViewUrl(specId) via getBaseUrl()
├── specs.ts            # insertSpec(), getSpecById(), isValidSpecId()
├── types.ts            # SavedSpec, SpecRecord, InsertSpecMeta, StoreFailure, …
└── migrations/
    └── 001_specs.sql
```

| Export | Role |
|--------|------|
| `insertSpec(normalizedRui, meta)` | INSERT; return flat `SavedSpec` — `url` + `viewUrl` computed |
| `getSpecById(specId)` | SELECT; map row → flat `SavedSpec` or `null` |
| `isValidSpecId(id)` | Valid UUID string check for GET route (see [defaults](#implementation-defaults-locked-for-implementer)) |
| `buildSpecUrl(specId)` | `${getBaseUrl()}/api/specs/${specId}` |
| `buildViewUrl(specId)` | `${getBaseUrl()}/specs/${specId}` (§5) |

**`InsertSpecMeta`** (argument to `insertSpec` — from `validateSpec()` success):

```txt
InsertSpecMeta {
  validationVersion: string   // VALIDATION_VERSION
  registryVersion: string     // REGISTRY_VERSION
}
```

`insertSpec` generates `specId` (`crypto.randomUUID()`), computes `contentHash`, writes DB row, returns full `SavedSpec` including computed `url`, `viewUrl` (§5), and `createdAt`.

**Route handlers stay thin:** transport → `validateSpec()` → on success `insertSpec()` → JSON response.

---

### Save pipeline

```txt
Phase 1 — Transport (reuse §2)
    parseTransportRequest                              → 400 on failure

Phase 2–5 — Validate (reuse §2)
    validateSpec(body)                                   → 200 + errors on failure

Phase 6 — Persist (§4 only)
    computeContentHash(normalizedRui)
    INSERT specs (id, content_hash, validation_version, registry_version, rui)
                                                         → 201 SavedSpec (flat)

Phase 6 failure — DB
    connection / query error                             → 503 STORAGE_UNAVAILABLE
```

Invalid RUI **never** reaches Postgres.

---

### `POST /api/specs` — API contract

#### Request

```http
POST /api/specs
Content-Type: application/json

<body> = RUI JSON (§1) — same shape as POST /api/validate
```

| Check | Failure |
|-------|---------|
| Same transport rules as §2 | 400 `INVALID_JSON` |

#### Response — success (HTTP 201)

```json
{
  "specId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://rapidui.dev/api/specs/550e8400-e29b-41d4-a716-446655440000",
  "viewUrl": "https://rapidui.dev/specs/550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-26T12:00:00.000Z",
  "contentHash": "sha256:abc123…",
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

**Agent handoff (v0.1):** Confirm save succeeded; store `specId` internally. For the **user**, share **`viewUrl`** (“saved — inspect at `{viewUrl}`”). Keep **`url`** for programmatic retrieve and audit. Do not treat raw spec JSON as the final product — the RUI is input to the future renderer.

**Agent handoff (v0.2+):** Tell the user *“Your app is ready at `{appUrl}`.”* — `specId` / spec `url` stay on the platform dashboard for audit, not the user headline.

#### Response — validation failed (HTTP 200)

**Identical shape to `POST /api/validate`** — `{ valid: false, validationVersion, registryVersion, errors[], truncated? }`. Fix and retry (same retry loop as validate).

#### Response — transport failure (HTTP 400)

Same as §2 — `{ valid: false, errors: [{ code: "INVALID_JSON", … }] }`.

#### Response — storage unavailable (HTTP 503)

```json
{
  "error": "STORAGE_UNAVAILABLE",
  "message": "RUI store is temporarily unavailable."
}
```

---

### `GET /api/specs/:id` — API contract

#### Request

```http
GET /api/specs/550e8400-e29b-41d4-a716-446655440000
```

| Check | Failure |
|-------|---------|
| `:id` is valid UUID format | 400 `INVALID_SPEC_ID` |
| Row exists | 404 `NOT_FOUND` |

#### Response — success (HTTP 200)

```json
{
  "specId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://rapidui.dev/api/specs/550e8400-e29b-41d4-a716-446655440000",
  "viewUrl": "https://rapidui.dev/specs/550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-05-26T12:00:00.000Z",
  "contentHash": "sha256:abc123…",
  "validationVersion": "0.1",
  "registryVersion": "0.1",
  "normalizedRui": { }
}
```

Same flat shape as POST — `url` and `viewUrl` recomputed on every GET.

#### Response — not found (HTTP 404)

```json
{
  "error": "NOT_FOUND",
  "specId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response — invalid id (HTTP 400)

```json
{
  "error": "INVALID_SPEC_ID",
  "message": "specId must be a UUID."
}
```

**Route file:** `app/api/specs/[id]/route.ts` — GET only.

---

### Agent workflow (updated for §4)

Replace §3 workflow step 4 (“501 planned”) with:

```txt
1. GET /llms.txt  (or GET /api/docs)
2. GET /api/schema
3. Agent authors RUI JSON
4. POST /api/validate  → loop on errors[] until valid: true
5. POST /api/specs     → 201 SavedSpec (flat) — v0.1: share `viewUrl` with user; keep `url` for agents
6. GET url             → same SavedSpec shape (API retrieve)
7. Open viewUrl        → §5 human inspector (block tree)
```

Agents may POST directly to `/api/specs` without a prior validate call — store re-validates inline. **Do not** write `normalizedRui` to a local `.rui.json` after save.

---

### Implementation defaults (locked for implementer)

Questions that don’t need another design pass — use these defaults:

| Question | Default |
|----------|---------|
| **UUID validation on GET** | Accept any **valid UUID** string (standard regex). Generate ids with `crypto.randomUUID()` (v4). Do not enforce v4-only in the path param. |
| **`201 Location` header** | **Skip for v0.1** — body fields `url` + `viewUrl` are the handoff; add header later if needed. |
| **`normalizedRui` on POST** | **Always include** — same flat SavedSpec as GET; redundant after validate is OK for v0.1. |
| **Smoke test DB cleanup** | **No delete** — leave inserted rows in Postgres for v0.1. |
| **`lib/db/index.ts` barrel** | **Optional but recommended** — match `lib/validate/index.ts` export pattern. |
| **Migration on Vercel deploy** | **Manual** — run `npm run db:migrate` locally + once on production Postgres before smoke/prod verify. No auto-migrate in `build` for v0.1. |
| **`createdAt` format** | Postgres `created_at` → JavaScript `Date` → **`.toISOString()`** (UTC). |
| **GET `Cache-Control`** | **Out of scope** — no caching headers for v0.1. |
| **Shared route helper** | Optional `saveFromRequest(request)` mirroring `validateFromRequest` — not required if routes call transport + validate + insert inline. |
| **`DATABASE_URL` missing** | POST/GET → **503** `STORAGE_UNAVAILABLE` (not 500). |

---

### Pre-implementation checklist

Before coding §4, confirm:

- [x] `DATABASE_URL` in `.env.local` (`vercel env pull` if needed)
- [x] §2 smoke passes: `npm run smoke:validate`
- [x] Golden RUI validates: `lib/registry/golden/support-dashboard.rui.json`

Before smoke/prod verify:

- [x] `npm run db:migrate` applied (local)
- [x] `npm run db:migrate` applied (production — user ran 2026-05-27)
- [x] `specs` table exists (local)

---

### Handoff summary (implementing agent)

**Read:** This §4 section + §2 validate error shapes.

**Build:**

```txt
lib/db/                 client, hash, urls, specs, types, migrations/001_specs.sql, index.ts (optional)
app/api/specs/          route.ts (POST), [id]/route.ts (GET)
scripts/                migrate.ts, smoke-specs.ts
```

**Replace:** 501 stub in `app/api/specs/route.ts`.

**Update:** agent docs (Step 6) — remove all 501 / “keep locally” messaging; add save step to getting-started.

**Do not build:** listing, dedupe, auth, `eval_runs`, §5 inspector, renderer.

---

### Implementation steps

**Prerequisites:** §2 complete; `DATABASE_URL` in `.env.local` and Vercel envs.

#### Step 1 — Dependencies + migration

- [x] Add `@vercel/postgres` to `package.json`
- [x] Create `lib/db/migrations/001_specs.sql` (schema above)
- [x] Create `scripts/migrate.ts` + `npm run db:migrate`
- [x] Run migration locally
- [x] Run migration on production Postgres (2026-05-27)

#### Step 2 — `lib/db/` core

- [x] `client.ts` — `sql` export from `@vercel/postgres`
- [x] `hash.ts` — `computeContentHash()`
- [x] `urls.ts` — `buildSpecUrl(specId)` using `getBaseUrl()` (`lib/base-url.ts`)
- [x] `types.ts` — `SavedSpec`, `SpecRecord`, `InsertSpecMeta`, store response types
- [x] `specs.ts` — `insertSpec()`, `getSpecById()`, `isValidSpecId()`
- [x] `index.ts` — re-export public API (recommended)

#### Step 3 — `POST /api/specs`

- [x] Replace 501 stub in `app/api/specs/route.ts`
- [x] `parseTransportRequest` → `validateSpec` → `insertSpec`
- [x] Return 201 / 200 / 400 / 503 per contract above

#### Step 4 — `GET /api/specs/:id`

- [x] `app/api/specs/[id]/route.ts`
- [x] UUID validation → lookup → 200 / 404 / 400 / 503

#### Step 5 — Smoke test

**Requires:** Step 1 migration applied + `DATABASE_URL` set (same as Step 1 prerequisites).

- [x] `scripts/smoke-specs.ts` + `npm run smoke:specs`
- [x] POST golden RUI → assert SavedSpec fields, `contentHash` prefix `sha256:`
- [x] GET by `specId` → assert `normalizedRui` matches POST response
- [x] Invalid fixture → assert `valid: false` via `validateSpec` (no insert)
- [x] Bogus UUID → `isValidSpecId` false; unknown UUID → `getSpecById` null
- [x] No test cleanup — leave rows in DB for v0.1

#### Step 6 — Update agent docs (remove 501 messaging)

- [x] `lib/docs/content/workflow.md` — step 4 save flow + flat SavedSpec 201 example
- [x] `lib/docs/content/getting-started.md` — add step 5 `POST /api/specs` + SavedSpec handoff (`url`; **§5 updates to `viewUrl`**)
- [x] `lib/docs/content/instructions.md` — remove “keep locally until §4”
- [x] `lib/docs/index.ts` — `api.specs` + `api.specById` full contract (POST 201, GET by id, flat SavedSpec)
- [x] `lib/docs/llms.ts` — specs live, not planned
- [x] `app/page.tsx` — specs persistence live (link in agent list)
- [x] `scripts/smoke-docs.ts` — assert specs/specById contract (not 501)

#### Step 7 — README + production verify

- [x] README — `db:migrate`, `smoke:specs`, store endpoints
- [x] `curl -X POST https://rapidui.dev/api/specs` with golden body → 201 (verified 2026-05-27)
- [x] `curl https://rapidui.dev/api/specs/<specId>` → 200 (verified 2026-05-27)

#### Step 8 — Commit

- [x] Commit + merge: `feat(store): Postgres RUI persistence, POST/GET /api/specs` (merged to production 2026-05-27)

---

### Deliverables

- [x] `@vercel/postgres` dependency
- [x] `lib/db/` — client, hash, **urls**, types, specs queries, migration SQL, index.ts
- [x] `scripts/migrate.ts` + `npm run db:migrate`
- [x] `POST /api/specs` — validate inline + persist (replaces 501 stub)
- [x] `GET /api/specs/:id` — retrieve flat SavedSpec
- [x] `npm run smoke:specs`
- [x] Agent docs updated (workflow, **getting-started**, instructions, `getDocsPayload()`, llms.txt)

### Done when

- [x] Migration applied locally; `specs` table exists
- [x] Migration applied on Vercel Postgres production (2026-05-27)
- [x] Valid RUI POST → **201** flat SavedSpec (`specId`, `url`, audit fields, `normalizedRui`) — verified locally + agent evals
- [x] Same RUI fetchable via GET with matching `contentHash` — verified locally
- [x] Invalid RUI never inserted (validate fails before `insertSpec`)
- [x] Transport errors → **400**; invalid UUID on GET → **400**; unknown id → **404** — implemented in routes
- [x] `npm run smoke:specs` passes locally
- [x] `npm run smoke:validate`, `smoke:docs` pass
- [x] Production curl verify on `rapidui.dev` (POST 201 + GET 200, 2026-05-27)
- [x] Agent workflow docs no longer reference 501 / “keep locally”
- [x] **§4 merged to production** — prod migrate + curl verify done; §5 inspector or §6 harness next
- [x] **§5 implemented locally** — inspector at `/specs/:id`, viewUrl on SavedSpec, agent eval + browser verify on `localhost:3000` (2026-05-27)

**§4 status: Complete** — local + production verified (golden POST/GET on `rapidui.dev`, 2026-05-27).

#### Implementation notes (deviations from original §4 draft)

| Item | Shipped as |
|------|------------|
| `getBaseUrl()` | `lib/base-url.ts` — env-driven (`RAPIDUI_BASE_URL` / `VERCEL_URL` / localhost); no hardcoded `rapidui.dev` |
| `lib/docs/base.ts` | Removed — URL helper moved to `lib/base-url.ts` |
| `client.ts` DATABASE_URL pre-check | Removed — routes return **503** via `try/catch` on DB errors |
| CLI env loading | `tsx --env-file=.env.local` on `db:migrate` / `smoke:specs` (no custom loader) |
| `api.specs` docs shape | `specs` (POST) + `specById` (GET) siblings — no `status: "planned"` field |
| Agent handoff in shipped docs | Uses **`url`** — **§5 Step 4** updates to **`viewUrl`** for human inspect |

#### Post-merge checklist

- [x] Commit + push to `main` (Vercel auto-deploy)
- [x] `npm run db:migrate` against **production** Postgres (user ran 2026-05-27)
- [x] Set `RAPIDUI_BASE_URL=https://rapidui.dev` in Vercel production env (if not already) — optional; `url` in responses already resolves to `rapidui.dev`
- [x] `curl -X POST https://rapidui.dev/api/specs -H "Content-Type: application/json" -d @lib/registry/golden/support-dashboard.rui.json` → **201** (2026-05-27)
- [x] `curl https://rapidui.dev/api/specs/<specId>` → **200** (2026-05-27; e.g. `45d6f126-84e9-4803-b877-44685abc5de1`)

> **Not in §4 (by design):** `GET /api/specs` listing, dedupe/idempotency by `contentHash`, validation tokens, auth, `eval_runs` table (§6), §5 inspector page + `viewUrl` field (§5), migrating `generated/*.rui.json` into DB, Drizzle/Prisma ORM.

---

## 5. RUI Inspector (reviewer)

**Purpose:** Minimal **structural inspection** of a saved RUI — a type-colored block tree for human review. **Not** a renderer, **not** a dashboard, **not** live data from bindings.

**Why fifth:** §4 completes validate → save; the inspector closes the loop for humans and §6 eval review. Agents share `viewUrl` after save so you can open a saved spec and see what was produced — essential when comparing Option A / B / C variants without reading raw JSON.

**Prerequisites:** §4 (`getSpecById`, `buildSpecUrl`, `isValidSpecId`, flat SavedSpec).

**Naming:** “Inspector” / “reviewer” in prose — avoids confusion with a future **preview** or **rendered app** (`appUrl` in v0.2+).

---

### Platform artifact vs human inspect

| Link | Path | Audience | Role |
|------|------|----------|------|
| **`url`** | `/api/specs/{specId}` | Agents, scripts, smoke tests | Retrieve flat SavedSpec JSON |
| **`viewUrl`** | `/specs/{specId}` | Humans, demos, eval review | Structural block-tree inspector |

```txt
Agent completes save
    → POST /api/specs → 201 SavedSpec (specId, url, viewUrl, …)
    → Agent tells user: open viewUrl to inspect
    → Browser: GET /specs/{specId} → server-rendered inspector
```

**Homepage:** No link required for v0.1 — `viewUrl` is the entry point from agent handoff. Optional later: one line on `/` (“Inspect a saved RUI”) when demos need discoverability.

---

### Decisions (locked for §5)

| Decision | Choice |
|----------|--------|
| Route | **`GET /specs/[id]`** — App Router page at `app/specs/[id]/page.tsx` |
| Rendering | **Server-rendered** — `getSpecById()` in RSC; no client fetch to API |
| Caching | **`export const dynamic = "force-dynamic"`** on page — always read fresh from Postgres |
| Primary UI | **Type-colored block tree** — mirrors RUI schema hierarchy |
| Secondary UI | **Collapsible raw JSON** — `<details>` + pretty-printed `normalizedRui` (no client JS) |
| Theme | **Light-only inspector chrome** — force light background (`bg-zinc-50`) so pastel blocks stay readable; ignore `prefers-color-scheme: dark` on this route |
| Colors | **Fixed pastel palette by `type`** — same type → same color across all specs |
| Nesting label | Show **type names** (Page, Section, Metric, …) — do **not** expose JSON key `children` in UI |
| Section layout | Respect **`direction`**: `row` = horizontal child layout, `stack` = vertical |
| Data binding display | **Static chips** — method + path + valuePath; **no** HTTP calls to bound endpoints |
| Text truncation | **200 characters** max in Text blocks — ellipsis after |
| Unknown block type | **Generic gray fallback** — show `type` + `id` + compact JSON snippet; never crash the page |
| Auth | **None** — public page (same as §4) |
| Invalid UUID (HTML) | **`notFound()`** — same as unknown id; HTML route always **404** (API keeps **400** for malformed UUID) |
| Unknown spec id | **`notFound()`** — scoped `app/specs/[id]/not-found.tsx` |
| DB unavailable | **`app/specs/[id]/error.tsx`** — minimal “store unavailable” message (503 semantics) |
| Page title | **`generateMetadata`** — `{meta.title} — RUI Inspector` from `normalizedRui.meta.title` |
| **`viewUrl` on SavedSpec** | **Add field** on POST 201 / GET 200 — computed via `buildViewUrl(specId)`; not stored in Postgres |
| **`lib/db/index.ts`** | Re-export **`buildViewUrl`** alongside `buildSpecUrl` |
| Component layout | **Start minimal** — `colors.ts` + `RuiInspector.tsx` (+ optional `BindingChip.tsx`); split into per-block files only if needed |
| Smoke test | **In-process render** — import `RuiInspector`, render golden `SavedSpec` to string, assert block type labels; **no dev server required** |
| Homepage link | **Deferred** — optional one-liner on `/` post-ship |
| Side-by-side compare | **Out of scope** — single spec per page; compare by opening two tabs (§6 eval workflow) |

---

### SavedSpec extension (§5 adds `viewUrl`)

§4 SavedSpec gains one computed field when §5 ships:

```txt
SavedSpec {
  specId: string
  url: string                 // buildSpecUrl — API retrieve (agents)
  viewUrl: string             // buildViewUrl — human inspect (§5)
  createdAt: string
  contentHash: string
  validationVersion: string
  registryVersion: string
  normalizedRui: Rui
}
```

| Field | Builder | Example |
|-------|---------|---------|
| `url` | `buildSpecUrl(specId)` | `https://rapidui.dev/api/specs/{uuid}` |
| `viewUrl` | `buildViewUrl(specId)` | `https://rapidui.dev/specs/{uuid}` |

**`lib/db/urls.ts`:** add `buildViewUrl(specId)` alongside existing `buildSpecUrl`.

**Agent handoff (v0.1):** Agents share **`viewUrl`** with the user for human review; keep **`url`** for programmatic retrieve and audit.

> **API vs HTML errors:** The JSON API keeps **400** for malformed UUIDs on `GET /api/specs/:id`. The human inspector uses **`notFound()` (404)** for both malformed UUID and missing row — simpler UX, no special case in the page.

---

### Visual model

Top-down, registry-faithful tree — not a mock UI:

```txt
┌─ Audit strip ─ specId, createdAt, contentHash (prefix), versions, link to API url
├─ version: 0.1
├─ meta ─ title, description
├─ navigation ─ items (label → pageId)
└─ pages
     └─ [Page] page-support — Support Dashboard
          └─ [Section] section-metrics — row
               ├─ [Metric] Open Tickets + binding chip
               └─ [Metric] Urgent + binding chip
          └─ [Section] section-tickets — stack
               ├─ [Text] "All tickets"
               └─ [Table] Tickets
                    ├─ binding: GET /api/tickets → items
                    ├─ columns: id | subject | status | …
                    └─ filter: status (3 options)
```

**Golden reference layout:** `lib/registry/golden/support-dashboard.rui.json` — inspector must render this structure readably.

---

### Type color palette (fixed)

Deterministic colors keyed by node kind. Extend when registry adds block types (Options B/C).

| Kind / `type` | UI role | Palette (Tailwind-ish) |
|---------------|---------|------------------------|
| `version` | Document version band | neutral zinc |
| `meta` | App metadata | neutral gray |
| `navigation` | Nav items | neutral slate |
| `Page` | Screen container | soft blue (`blue-100` / border `blue-300`) |
| `Section` | Grouping | soft lavender (`violet-100` / `violet-300`) |
| `Metric` | KPI block | soft mint (`emerald-100` / `emerald-300`) |
| `Text` | Static copy | soft peach (`orange-100` / `orange-300`) |
| `Table` | Tabular block | soft yellow (`amber-100` / `amber-300`) |
| `binding` | Sub-detail chip | soft pink (`pink-100` / `pink-300`) |
| `columns` / `filter` | Table sub-parts | lighter amber chips inside Table |

Colors live in one module — `lib/review/colors.ts` — so eval diffs stay consistent.

---

### Block content (what to show per node)

Show **identity + salient props** — not full JSON at every level.

| Node | Header | Body |
|------|--------|------|
| **version** | `version: 0.1` | — |
| **meta** | Meta | `title`, `description` |
| **navigation** | Navigation | each item: `label` → `pageId` |
| **Page** | `Page` + `id` + `title` | optional `description` |
| **Section** | `Section` + `id` + optional `title` | badge: `direction` (row \| stack); nested blocks |
| **Metric** | `Metric` + `id` + `label` | optional `format`; binding chip |
| **Text** | `Text` + `id` | `content` truncated at **200 chars** + ellipsis |
| **Table** | `Table` + `id` + optional `title` | binding chip; column key chips; filter summary if present |
| **unknown** | `type` + `id` | gray fallback box + compact JSON snippet |
| **binding** | — | `{method} {path}` → `valuePath` (monospace) |
| **columns** | — | `{key}` chips with optional `type` |
| **filter** | — | `{field}` + option count |

Multiple pages: stack vertically (one Page rectangle per entry in `pages[]`). No tab UI required for v0.1 unless needed for readability.

---

### Page layout (inspector chrome)

```txt
┌─────────────────────────────────────────────────────────────┐
│ RUI Inspector                          RapidUI v0.1         │
├─────────────────────────────────────────────────────────────┤
│ specId · createdAt · sha256:abc… · validation 0.1           │
│ API: [url] (link)                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [colored block tree — recursive from normalizedRui]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ▼ Raw JSON (collapsible)                                    │
│   { "version": "0.1", … }                                   │
└─────────────────────────────────────────────────────────────┘
```

**Raw JSON:** native **`<details>` / `<summary>`** in RSC — pretty-printed `JSON.stringify(normalizedRui, null, 2)` inside `<pre>`. No client component for collapse in v0.1.

**Styling:** Match homepage patterns (`app/page.tsx`) — zinc borders, `max-w-2xl` or wider for tree, Geist Mono for ids/paths/bindings. Inspector wrapper uses **light-only** chrome regardless of system dark mode.

---

### `lib/review/` layout

Presentation-only — walks existing `Rui` types from `@/lib/registry`; no validation re-run on page (spec already validated at save).

**Minimal v0.1 (preferred):**

```txt
lib/review/
├── colors.ts           # TYPE_COLORS map — type/kind → Tailwind classes
├── RuiInspector.tsx    # recursive tree — audit strip, meta/nav, pages, all block types
└── BindingChip.tsx     # optional — extract if RuiInspector grows
```

**Optional split** (only if file gets unwieldy):

```txt
lib/review/
├── colors.ts
├── RuiInspector.tsx
├── PageBlock.tsx
├── SectionBlock.tsx
├── MetricBlock.tsx | TextBlock.tsx | TableBlock.tsx
├── BindingChip.tsx
└── index.ts
```

| Piece | Role |
|-------|------|
| `RuiInspector` | Root — receives `SavedSpec`; renders audit strip + full block tree |
| Recursive block render | Page → Section → Block; Section `direction` controls flex |
| `BindingChip` | `{method} {path}` → `valuePath` in monospace |
| Unknown `type` | Gray fallback — never throw |

### App route files

```txt
app/specs/[id]/
├── page.tsx            # force-dynamic; getSpecById; generateMetadata; RuiInspector
├── not-found.tsx       # scoped 404 — invalid UUID or missing spec
└── error.tsx           # DB / unexpected errors — “store unavailable”
```

**Route logic (`page.tsx`):**

```txt
if !isValidSpecId(id) → notFound()
spec = await getSpecById(id)
if !spec → notFound()
return <RuiInspector spec={spec} />
```

DB errors bubble to `error.tsx` (same pattern as API **503** semantics).

---

### Handoff summary (implementing agent)

**Read:** This §5 section + §4 SavedSpec + golden RUI.

**Build:**

```txt
lib/db/urls.ts              # add buildViewUrl(specId)
lib/db/types.ts               # add viewUrl to SavedSpec
lib/db/specs.ts               # mapRecordToSavedSpec includes viewUrl
lib/db/index.ts               # re-export buildViewUrl
lib/review/                   # colors.ts + RuiInspector.tsx (+ optional BindingChip)
app/specs/[id]/page.tsx       # force-dynamic, generateMetadata
app/specs/[id]/not-found.tsx
app/specs/[id]/error.tsx
scripts/smoke-inspector.ts    # in-process render smoke (no dev server)
package.json                  # add smoke:inspector script
```

**Update:** agent docs + §4 SavedSpec examples — `viewUrl` in JSON; getting-started tells user to open `viewUrl` (not `url`).

**Do not build:** renderer, live binding fetch, side-by-side compare, auth, spec listing, homepage marketing.

---

### Implementation steps

**Prerequisites:** §4 complete; golden spec POST-able locally.

#### Step 1 — `viewUrl` on SavedSpec

- [x] `buildViewUrl(specId)` in `lib/db/urls.ts`
- [x] `viewUrl` on `SavedSpec` type; `mapRecordToSavedSpec` computes it
- [x] Re-export `buildViewUrl` from `lib/db/index.ts`
- [x] POST/GET responses include `viewUrl`
- [x] Update `scripts/smoke-specs.ts` — assert `viewUrl` includes specId and `/specs/` path

#### Step 2 — `lib/review/` core

- [x] `colors.ts` — fixed palette per type/kind (light-mode pastels)
- [x] `RuiInspector.tsx` — recursive tree; unknown block fallback
- [x] Optional `BindingChip.tsx` if inline gets noisy
- [x] Recursive walk: `pages → sections → blocks` using registry types
- [x] Section `direction`: row vs stack layout for child blocks
- [x] Text content truncated at 200 chars

#### Step 3 — `GET /specs/[id]`

- [x] `app/specs/[id]/page.tsx` — `export const dynamic = "force-dynamic"`
- [x] `generateMetadata` from `normalizedRui.meta.title`
- [x] Invalid UUID or not found → `notFound()`
- [x] `app/specs/[id]/not-found.tsx` — scoped 404 copy
- [x] `app/specs/[id]/error.tsx` — store unavailable message
- [x] Light-only wrapper (`bg-zinc-50`); `<details>` raw JSON at bottom

#### Step 4 — Agent docs (+ §4 example alignment)

- [x] `lib/docs/content/getting-started.md` — share **`viewUrl`** with user (not `url`)
- [x] `lib/docs/content/workflow.md` — save handoff mentions `viewUrl`
- [x] `lib/docs/content/instructions.md` — SavedSpec fields include `viewUrl`
- [x] `lib/docs/index.ts` — SavedSpec includes `viewUrl`; document human route `GET /specs/:id`
- [x] `lib/docs/llms.ts` — viewUrl in specs bullet
- [x] `scripts/smoke-docs.ts` — assert `viewUrl` in SavedSpec contract + inspector route documented

#### Step 5 — Smoke + verify

- [x] `scripts/smoke-inspector.ts` — build golden `SavedSpec` in-process, render `RuiInspector` via `react-dom/server` (`renderToStaticMarkup`), assert HTML contains `Page`, `Section`, `Metric`, `Table`, `Text`
- [x] `npm run smoke:inspector` in `package.json`
- [x] README — inspector route + smoke script documented
- [x] Production verify: POST golden on `rapidui.dev` → open `/specs/{specId}` in browser (manual — verified 2026-05-28)

#### Step 6 — Commit

- [x] Commit: `feat(inspector): RUI block-tree review at /specs/:id + viewUrl on SavedSpec`

---

### Deliverables

- [x] `buildViewUrl(specId)` + `viewUrl` on SavedSpec (POST/GET); exported from `lib/db/index.ts`
- [x] `lib/review/` — type-colored block tree (`colors.ts` + `RuiInspector.tsx`)
- [x] `GET /specs/[id]` — server-rendered inspector (`force-dynamic`, `generateMetadata`)
- [x] `not-found.tsx` + `error.tsx` under `app/specs/[id]/`
- [x] Collapsible raw `normalizedRui` JSON via `<details>`
- [x] Agent docs updated (`viewUrl` handoff; §4 JSON examples aligned)
- [x] `npm run smoke:inspector` — in-process render smoke

**§5 status: Complete** — local + production verified (agent eval, browser inspect on `localhost:3000`, POST + inspector on `rapidui.dev`, 2026-05-28).

### Done when

- [x] Valid golden POST → SavedSpec includes `viewUrl` (`/specs/{specId}`)
- [x] Opening `viewUrl` shows audit strip + version + meta + navigation + page tree
- [x] Golden spec renders: 1 Page, 2 Sections (row + stack), 2 Metrics, 1 Text, 1 Table with binding/columns/filter visible
- [x] Block types use fixed pastel colors on light background (Page ≠ Section ≠ Metric ≠ Table)
- [x] Section with `direction: "row"` lays out child blocks horizontally
- [x] Raw JSON available via `<details>` at page bottom
- [x] Invalid UUID and unknown spec id → scoped 404 (`not-found.tsx`)
- [x] DB failure → error page (503 semantics)
- [x] Page title uses `normalizedRui.meta.title`
- [x] Agent getting-started tells user to open **`viewUrl`** (not `url`) after save
- [x] `npm run smoke:specs` + `npm run smoke:inspector` + `npm run smoke:docs` pass locally
- [x] Production: POST + manual browser check on `/specs/{specId}` (verified 2026-05-28)

> **Not in §5 (by design):** React renderer, live API execution, side-by-side A/B/C compare UI, auth, `GET /api/specs` listing, homepage redesign, `appUrl`, eval_runs (§6).

---

## 6. Agent Test Harness & Evals

**Purpose:** Repeatable proof that the hypothesis holds — not a one-off manual demo. Foundation for the eval system (regression lab), with a documented path to session observability (production telemetry).

**Why sixth:** §1–§5 complete the platform loop (vocabulary → validate → save → inspect). §6 proves **external agents** can traverse that loop without repo context — the core MVP success criterion.

**Prerequisites:** §3 (agent docs), §4 (`POST /api/specs`), §5 (`viewUrl` inspector).

**Naming:** “Eval harness” = controlled test cases + logged outcomes. “Session observability” = per-request tracing for real usage — related but **not** §6 v0.1 scope.

---

### Two systems (eval harness vs session observability)

```txt
┌─────────────────────────────────────────────────────────────────┐
│  EVAL HARNESS (§6 v0.1 — build now)                             │
│  Known prompt + successCriteria → eval_run row → score.ts       │
│  Question: Can agents produce valid RUIs for Option A?          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │  shares correlation IDs (v0.2+)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SESSION OBSERVABILITY (Phase 2–3 — design now, build later)    │
│  Optional headers → api_events → analytics dashboard            │
│  Question: What are users building? Where does registry fail?   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phased roadmap

| Phase | Scope | Ship in |
|-------|-------|---------|
| **Phase 1** | Eval cases, manual runner, `eval_runs`, `eval/score.ts`, `log-eval-run.ts` | **§6 v0.1** |
| **Phase 2** | Optional `X-RapidUI-*` headers, `api_events` table, retry count from platform side | **v0.2** (spec below; do not implement in §6 v0.1) |
| **Phase 3** | API keys, `agent_sessions`, ops dashboard, LLM judge | **v1+** (deferred) |

---

### Decisions (locked for §6 v0.1)

| Decision | Choice |
|----------|--------|
| Primary eval case | **Option A — support ticket dashboard** (`support-dashboard-v0.1`) |
| Secondary cases | Options B & C — eval case JSON only when registry supports them |
| Agents under test | **Cursor**, **Claude CLI**, **Codex CLI** — same prompt, no repo access |
| Runner mode | **Manual** — human starts agent session with external prompt; no `POST /api/eval/run` in v0.1 |
| Agent context | **Zero repo context** — prompt says “do not read local files”; discovery via `llms.txt` only |
| Base URLs | **`wrapper_prod.txt`** → `https://rapidui.dev`; **`wrapper_local.txt`** → `http://localhost:3000` |
| Prompt assembly | **`lib/eval/renderPrompt.ts`** + `npm run eval:prompt` — injects `case.prompt` into shared wrapper; **do not** duplicate case text in manual files |
| Structured handoff | **`---EVAL_RESULT---` in local wrapper only** (`wrapper_local.txt`) — field names match `eval_runs`; optional paste to personal notes |
| Prod logging | **`scripts/log-eval-run.ts`** from repo — `--specId`, `--case`, `--agent`, `--validate-count`; **Postgres is the only log** |
| Local logging | **No Postgres row** — local is for play; optional EVAL_RESULT paste to personal notes only |
| Scoring | **Deterministic only** — `eval/score.ts` checks saved spec + case criteria; no LLM judge |
| `eval_runs` insert | **`scripts/log-eval-run.ts`** — scores first, then inserts; **`POST /api/eval/log` deferred to v0.2** |
| Pass/fail | **`eval/score.ts` is authoritative** — not agent self-report |
| Visual review | Human opens **`viewUrl`** (§5) — optional; not part of automated score |
| MVP “done” matrix | **Prod required** (`rapidui.dev`) for all three agents; **local optional** (dev playground) |
| In-repo eval layout | `eval/cases/`, `eval/manual/`, `eval/score.ts`, `lib/eval/`, `scripts/log-eval-run.ts` |
| `eval_runs.id` | **`crypto.randomUUID()` in app** — same pattern as §4 `specId` |
| DB migration | **`002_eval_runs.sql`** — separate from `001_specs.sql` |
| CI / batch runner | **Out of scope** for v0.1 |
| Session headers / `api_events` | **Designed in §6 Phase 2** — not implemented in v0.1 |
| Auth / agent identity | **Deferred** to v1 |

---

### Prod vs local workflow

| | **Prod** (`wrapper_prod.txt`) | **Local** (`wrapper_local.txt`) |
|--|------------------------------|--------------------------------|
| **Purpose** | MVP proof — counts toward §6 done | Playground while developing |
| **Log to Postgres** | **Yes** — via `scripts/log-eval-run.ts` | **No** |
| **Agent output** | Print `final_spec_id` + `view_url` when done (plain text) | Print full `---EVAL_RESULT---` block (optional paste to personal notes) |
| **Scoring** | Run `eval/score.ts` as part of log script | Optional — same script if you want a quick check |

**No duplicate logs:** Postgres `eval_runs` is the only persisted eval history in the repo. Personal notes (Apple Notes, etc.) are optional scratch for local runs only — not committed, not a second source of truth.

---

### Agents under test

| Agent | Invocation | Role |
|-------|------------|------|
| **Cursor agent** | Generate prompt via `npm run eval:prompt -- --case=… --env=prod`; paste in empty dir | Primary — fast iteration while building platform |
| **Claude CLI** | Same generated prompt in empty dir | External proof — no Cursor context |
| **Codex CLI** | Same generated prompt in empty dir | External proof — second vendor |

All three use **curl only** for HTTP (per wrapper). **Prod:** agent prints `final_spec_id` + `view_url` (plain text). **Local:** agent prints `---EVAL_RESULT---` block (see below).

---

### Eval loop (v0.1)

**Prod (MVP proof):**

```txt
eval/cases/support-dashboard-v0.1.json
    ↓
npm run eval:prompt -- --case=support-dashboard-v0.1 --env=prod  → paste to agent (empty dir)
    ↓
Agent: GET /llms.txt → validate loop → POST /api/specs → 201
    ↓
Human: open viewUrl — optional §5 review
    ↓
Agent prints final_spec_id + view_url
    ↓
In rapidui repo: npm run eval:log -- --specId=… --case=… --agent=… --validate-count=…
    ↓
Script runs eval/score.ts → inserts eval_runs row (passed from score, not agent)
```

**Local (playground):**

```txt
Same agent loop against http://localhost:3000
    ↓
Agent prints ---EVAL_RESULT--- (optional paste to personal notes)
    ↓
No Postgres insert unless you explicitly run eval:log
```

---

### `---EVAL_RESULT---` block (local prompt only)

Structured footer for **local** runs — field names **match `eval_runs` Postgres columns** so paste → parse → insert is mechanical. Not required on prod (log script takes `specId` directly).

```txt
---EVAL_RESULT---
eval_case_id: support-dashboard-v0.1
agent: cursor | claude | codex
base_url: http://localhost:3000
validate_count: <number>
error_codes: [<comma-separated codes or empty>]
final_spec_id: <uuid or null>
view_url: <full /specs/{id} url or null>
blocks_found: [<block types used, e.g. Table, Metric>]
---END---
```

| Field | Maps to `eval_runs` | Who sets it |
|-------|---------------------|---------------|
| `eval_case_id` | `eval_case_id` | Prompt / case JSON |
| `agent` | `agent` | Agent |
| `base_url` | `base_url` | Prompt variant |
| `validate_count` | `validate_count` | Agent counts validate POSTs |
| `error_codes` | `error_codes` | Agent — union from failed validates |
| `final_spec_id` | `final_spec_id` | From POST /api/specs 201 `specId` |
| `view_url` | `view_url` | From POST /api/specs 201 `viewUrl` |
| `blocks_found` | `blocks_found` | Agent self-report; **recomputed** by score script from spec |

**Not in EVAL_RESULT (set by platform, not agent):**

| Field | Set by |
|-------|--------|
| `id` | `crypto.randomUUID()` in `log-eval-run.ts` |
| `passed` | `eval/score.ts` — authoritative |
| `score_details` | `eval/score.ts` — `{ missingBlocks, missingBindings, retryExceeded }` |
| `completed_at` | Postgres default |
| `notes` | Optional — human or Cursor when logging |

**Prod prompt ending (simpler):** ask agent to print only:

```txt
final_spec_id: <uuid>
view_url: <url>
validate_count: <number>
error_codes: [<codes or empty>]
```

Then run `npm run eval:log` with those flags — no fenced block required.

---

### Eval case JSON (`eval/cases/`)

Machine-readable definition — source of truth for prompt text, mock API context, and deterministic criteria.

**File:** `eval/cases/support-dashboard-v0.1.json`

```json
{
  "id": "support-dashboard-v0.1",
  "title": "Option A — Support / Ops Ticket Dashboard",
  "prompt": "Generate a RUI for an internal support dashboard. Bind to GET /api/tickets (ticket list) and GET /api/tickets/stats (open and urgent counts).",
  "mockApi": {
    "endpoints": [
      {
        "method": "GET",
        "path": "/api/tickets",
        "description": "Ticket list; Table binding valuePath: items"
      },
      {
        "method": "GET",
        "path": "/api/tickets/stats",
        "description": "Open and urgent counts; Metric scalar valuePath per field"
      }
    ]
  },
  "successCriteria": {
    "mustValidate": true,
    "maxRetries": 5,
    "requiredBlocks": ["Table", "Metric"],
    "requiredBindings": ["GET /api/tickets"]
  }
}
```

**Future cases (not v0.1):**

| Case id | Scenario | When |
|---------|----------|------|
| `crud-admin-v0.2` | Option B — list + create | Registry + docs ready |
| `approval-queue-v0.2` | Option C — pending inbox | Registry + docs ready |

---

### Postgres schema — `eval_runs`

Migration: `lib/db/migrations/002_eval_runs.sql`

```sql
CREATE TABLE IF NOT EXISTS eval_runs (
  id                UUID PRIMARY KEY,
  eval_case_id      TEXT NOT NULL,
  agent             TEXT NOT NULL,
  base_url          TEXT NOT NULL,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed            BOOLEAN NOT NULL,
  validate_count    INT NOT NULL DEFAULT 0,
  error_codes       TEXT[] NOT NULL DEFAULT '{}',
  final_spec_id     UUID REFERENCES specs(id),
  view_url          TEXT,
  blocks_found      TEXT[] NOT NULL DEFAULT '{}',
  score_details     JSONB,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS eval_runs_case_idx ON eval_runs (eval_case_id);
CREATE INDEX IF NOT EXISTS eval_runs_agent_idx ON eval_runs (agent);
CREATE INDEX IF NOT EXISTS eval_runs_passed_idx ON eval_runs (passed);
CREATE INDEX IF NOT EXISTS eval_runs_completed_idx ON eval_runs (completed_at DESC);
```

`id` is assigned in app code via `crypto.randomUUID()` at insert — same pattern as §4 `specs.id`.

| Column | Source |
|--------|--------|
| `eval_case_id` | `eval/cases/*.json` → `id` |
| `agent` | `cursor` \| `claude` \| `codex` |
| `base_url` | From prompt variant |
| `passed` | Set by `eval/score.ts` deterministic result (authoritative) |
| `validate_count` | From `---EVAL_RESULT---` or future `api_events` |
| `error_codes` | Deduped union from failed validate responses |
| `final_spec_id` | UUID from successful `POST /api/specs` |
| `view_url` | From SavedSpec or `buildViewUrl(specId)` |
| `blocks_found` | Block `type` values found in tree (score script computes) |
| `score_details` | JSON: `{ missingBlocks, missingBindings, retryExceeded }` |
| `notes` | Free-form human notes |

**Analytics queries (v0.1):**

```sql
-- Pass rate by agent
SELECT agent, COUNT(*) FILTER (WHERE passed) * 100.0 / COUNT(*) AS pass_rate
FROM eval_runs WHERE eval_case_id = 'support-dashboard-v0.1' GROUP BY agent;

-- Error code frequency
SELECT unnest(error_codes) AS code, COUNT(*) FROM eval_runs GROUP BY code ORDER BY count DESC;
```

---

### What `eval/score.ts` does (plain language)

**One job:** given a saved spec and an eval case, answer **pass or fail** using rules only — no LLM, no human judgment.

```txt
Input:  --specId=<uuid>  --case=support-dashboard-v0.1  [--validate-count=N]

Steps:
  1. Load the saved RUI from Postgres (or GET /api/specs/:id)
  2. Load successCriteria from eval/cases/{case}.json
  3. Walk the RUI tree — collect every block type (Table, Metric, …) and binding paths
  4. Compare:
       • requiredBlocks present?
       • requiredBindings present?
       • validate_count ≤ maxRetries (if provided)?
  5. Output:
       • passed: true | false
       • score_details: { missingBlocks, missingBindings, retryExceeded }
       • blocks_found: recomputed from spec (authoritative over agent report)
  6. Exit code 0 (pass) or 1 (fail) — usable in scripts / CI later
```

**Why separate from the agent?** Agents lie, guess, or miscount retries. The platform owns pass/fail by reading the **actual saved artifact** in Postgres.

**Who calls it?**

| Caller | When |
|--------|------|
| `scripts/log-eval-run.ts` | Before every Postgres insert — `passed` comes from score, never from agent |
| You manually | `npm run eval:score -- --specId=… --case=…` — quick check without logging |
| Smoke test | Golden spec + primary case → must pass |

---

### Deterministic scoring (`eval/score.ts`)

Implementation of the above. Thin CLI wrapper around `lib/eval/scoreRun.ts`.

```bash
npm run eval:score -- --specId=<uuid> --case=support-dashboard-v0.1 [--validate-count=3]
```

**Authority:** `eval/score.ts` sets `passed` and `score_details` — never trust agent self-report.

---

### In-repo layout

```txt
eval/
├── cases/
│   └── support-dashboard-v0.1.json    # source of truth for task prompt + criteria
├── manual/
│   ├── wrapper_prod.txt               # shared — {{TASK}}, {{BASE_URL}}, output format
│   ├── wrapper_local.txt
│   ├── cursor/README.md               # how to invoke in Cursor
│   ├── claude/README.md
│   └── codex/README.md
├── score.ts                           # CLI wrapper → lib/eval/scoreRun
└── types.ts                           # EvalCase, EvalRunInput, ScoreDetails

lib/eval/
├── loadCase.ts                        # read eval/cases/{id}.json
├── renderPrompt.ts                    # wrapper + case → full agent prompt
├── collectBlocks.ts                   # walk Rui → types + bindings
├── scoreRun.ts                        # compare spec vs successCriteria
└── parseEvalResult.ts                 # parse ---EVAL_RESULT--- (local stdin)

lib/db/
├── evalRuns.ts                        # insertEvalRun, listEvalRunsByCase
└── migrations/
    └── 002_eval_runs.sql

scripts/
├── log-eval-run.ts                    # score → insert eval_runs
└── render-eval-prompt.ts              # thin CLI → renderPrompt (optional; or eval:prompt in score.ts sibling)
```

**`POST /api/eval/log` — deferred to v0.2**

| Benefit (why it exists as an idea) | Why we skip it for v0.1 |
|------------------------------------|-------------------------|
| Remote agent could POST results without repo checkout | You log from the **rapidui repo** via Cursor + script — simpler |
| Single HTTP call = score + insert | `log-eval-run.ts` already does both locally |
| Future: external CI runner | v0.2 when automation needs it; may need auth |

**v0.1 logging:** `npm run eval:log` only — no new API route, no second log destination.

---

### npm scripts (§6)

| Script | Command | Purpose |
|--------|---------|---------|
| `eval:prompt` | `npm run eval:prompt -- --case=<id> --env=prod\|local` | Print full agent prompt to stdout |
| `eval:score` | `npm run eval:score -- --specId=<uuid> --case=<id> [--validate-count=N]` | Deterministic pass/fail; exit 0/1 |
| `eval:log` | `npm run eval:log -- --specId=<uuid> --case=<id> --agent=cursor\|claude\|codex --validate-count=N [--error-codes=a,b] [--base-url=…]` | Score → insert `eval_runs` |
| `db:migrate` | extend existing script | Apply `002_eval_runs.sql` after `001_specs.sql` |
| `smoke:eval` | optional | Golden spec saved + score against primary case passes |

**`eval:log` contract:** always calls `scoreRun` first; inserts row with `passed` and `score_details` from score — never from agent.

**`requiredBindings` match rule:** each entry `"GET /api/tickets"` matches a binding where `method === "GET"` and `path === "/api/tickets"` (exact path).

---

### Manual runner checklist

**Prod (required for §6 done)** — per agent:

- [ ] Empty working directory (no RapidUI repo)
- [ ] Generate prompt: `npm run eval:prompt -- --case=support-dashboard-v0.1 --env=prod` → paste to agent
- [ ] Agent completes without reading local project files
- [ ] Agent uses curl; validate loop ≤ 5 attempts
- [ ] `POST /api/specs` → 201 with `final_spec_id` + `view_url`
- [ ] Human opens `view_url` — optional §5 check
- [ ] Run `npm run eval:log` from rapidui repo → row in Postgres
- [ ] Confirm `eval/score.ts` passed for that row

**Local (optional playground):**

- [ ] Generate prompt with `--env=local`; same agent loop against localhost
- [ ] Optional: agent prints `---EVAL_RESULT---` → paste to personal notes
- [ ] No Postgres insert unless you explicitly run `eval:log`

---

### Phase 2 design — correlation bridge (v0.2, do not implement in §6 v0.1)

When per-request tracing is needed without agent prompt access:

**Optional headers** (document in `/api/docs`; agents send voluntarily):

```txt
X-RapidUI-Session-Id: <uuid>       — stable for one agent session
X-RapidUI-Eval-Case: <case id>     — only for controlled evals
X-RapidUI-Intent: <short string>   — optional user goal summary
```

**`api_events` table (sketch):**

```sql
CREATE TABLE api_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  endpoint      TEXT NOT NULL,
  session_id    TEXT,
  eval_case_id  TEXT,
  intent        TEXT,
  valid         BOOLEAN,
  error_codes   TEXT[],
  spec_id       UUID,
  duration_ms   INT
);
```

Middleware on `POST /api/validate` and `POST /api/specs`: if headers present, append row (fire-and-forget). Enables platform-side retry counts and error frequency without manual transcription.

---

### Phase 3 design — enterprise observability (v1+, deferred)

- API keys → agent vendor / tenant identity
- `agent_sessions` table — open-ended user work, outcome, frustration signals
- Operational dashboard — use cases, registry gaps, validation heatmaps
- LLM judge for semantic intent scoring (see [Agent Eval Strategy](#agent-eval-strategy))

See [Deferred (post–v0.1)](#deferred-postv0.1).

---

### Scaling path — Phase 1 today vs many cases (B, C, …)

Phase 1 is intentionally **case-agnostic infrastructure**. Adding Option B, C, or future scenarios should be **data**, not a rewrite of scoring, logging, or Postgres.

#### What stays the same (no code changes per new case)

| Piece | Why it scales |
|-------|----------------|
| **`eval_runs` table** | Already keyed by `eval_case_id` — one row per (case × agent × run) |
| **`eval/score.ts`** | `--case=<id>` loads any file from `eval/cases/` |
| **`log-eval-run.ts`** | Same CLI — only `--case` changes |
| **Eval loop flow** | Identical: prompt → validate → save → log → score |
| **Multiple valid RUIs** | Criteria are **checklists** (`requiredBlocks`, `requiredBindings`), not “match golden byte-for-byte” — agents can produce different valid RUIs for the same case |

#### What you add per new case (data only)

```txt
eval/cases/crud-admin-v0.2.json       ← new file
eval/cases/approval-queue-v0.2.json   ← new file
… Option D, E later — same JSON shape
```

Each case JSON carries its own `prompt`, `mockApi`, and `successCriteria`. Registry + docs must ship **before** the case (Form/Button for B, action bindings for C, etc.) — same dependency as vocabulary growth in §1.

#### What to avoid (prompt file explosion)

**Do not** copy six manual prompt files per case (3 agents × prod/local) — that does not scale.

**Phase 1 implementation should:**

- Treat **`eval/cases/*.json` as source of truth** for prompt text
- **`eval/manual/`** holds **shared wrappers** (`wrapper_prod.txt`, `wrapper_local.txt`) — case task injected via `renderPrompt.ts`
- `lib/eval/renderPrompt.ts` — merge wrapper + case → full prompt (stdout or file)

Adding Option B then becomes: **one JSON file + registry work** — not a harness rewrite.

#### How Phase 2 connects (eval expansion at scale)

When cases × agents grows, manual logging breaks down. Phase 2 adds **automation on top of the same tables**:

| Phase 2 capability | Solves at scale |
|--------------------|-----------------|
| `X-RapidUI-Eval-Case` header + `api_events` | Platform counts retries / errors per case — no manual transcription |
| Batch runner (`eval:batch` or CI) | Run N cases × 3 agents unattended |
| `POST /api/eval/log` | Remote runner inserts scored rows without repo checkout |
| Regression queries | `pass rate by eval_case_id` — already indexed in Phase 1 |

Phase 2 does **not** replace Phase 1 schema — it **automates the same loop**.

#### How Phase 3 connects (different axis — production, not regression)

Phase 3 is **not** “more eval cases.” It answers questions Phase 1 cannot:

| Phase 3 capability | Purpose |
|--------------------|---------|
| `agent_sessions` + API keys | Real user/agent traffic — unknown prompts |
| Ops dashboard | “What are people building?” → informs **which new eval cases to add** |
| LLM judge | Cases where checklist pass/fail is insufficient (layout quality, UX intent) |

**Progression:**

```txt
Phase 1  →  Prove agents speak RUI on known cases (A, then B, C…)
Phase 2  →  Run many cases × agents without manual steps
Phase 3  →  Learn from production → add new cases → feed back into Phase 1 + 2
```

#### Extending `successCriteria` (when B/C need more than blocks + bindings)

Add fields **additively** in case JSON — `scoreRun.ts` ignores unknown keys, implements known ones:

| Future field | Example use |
|--------------|-------------|
| `requiredBlocks` | Option A — Table + Metric |
| `requiredBindings` | `GET /api/tickets` |
| `minBlockCount` | Table with ≥ N columns |
| `requiredBlockTypes` with `{ type, min }` | Option B — at least one Form |
| `semanticRubric` | Phase 3 LLM judge reference id |

Phase 1 implements **requiredBlocks**, **requiredBindings**, **maxRetries** only — enough for A–C deterministic scoring.

#### Verdict before implementation

| Question | Answer |
|----------|--------|
| Will B/C require rewriting the harness? | **No** — add case JSON + registry |
| Will agents producing different valid RUIs break scoring? | **No** — checklist scoring, not golden diff |
| Does Phase 2 fit the progression? | **Yes** — automates same `eval_runs` + `score.ts` |
| Does Phase 3 fit the progression? | **Yes** — discovers new cases; does not duplicate Phase 1 |
| Phase 1 guardrail | **Case-driven prompts** — no Option A strings hardcoded in score/log code |

---

### Implementer start here

**Goal (Phase 1):** Prove the **platform eval loop** end-to-end — case JSON → agent prompt → validate → save → score → Postgres. One primary case (`support-dashboard-v0.1`); infrastructure must be **case-generic** (`--case` everywhere).

**Read first:** [Agent Eval Strategy](#agent-eval-strategy) → this §6 through [npm scripts (§6)](#npm-scripts-6) → §4 `lib/db/specs.ts` (`getSpecById`) for the score script.

**Build order:** [v0.1 implementation order](#v0.1-implementation-order-keep-simple) at section end.

**Do not build:** Phase 2/3 items, `POST /api/eval/log`, Option B/C cases, duplicated per-case prompt files.

**After code ships (human):** three prod agent evals → `eval:log` each → SQL pass-rate query.

**Phase 1 proves:** mechanism (docs → valid RUI → logged score). Generalization (thin/held-out cases) is **post–§6 optional** — see [Scaling path](#scaling-path--phase-1-today-vs-many-cases-b-c-).

---

### Handoff summary (implementing agent)

**Read:** This §6 section + [Agent Eval Strategy](#agent-eval-strategy).

**Build (v0.1 only):**

```txt
eval/cases/support-dashboard-v0.1.json
eval/manual/wrapper_prod.txt + wrapper_local.txt + {cursor,claude,codex}/README.md
lib/eval/                     # loadCase, renderPrompt, collectBlocks, scoreRun, parseEvalResult
eval/score.ts
lib/db/evalRuns.ts
lib/db/migrations/002_eval_runs.sql
scripts/log-eval-run.ts
scripts/migrate.ts            # extend for 002_eval_runs.sql
package.json                  # eval:prompt, eval:score, eval:log; optional smoke:eval
```

**Update:** README — eval workflow (prod log script; local optional notes).

**Do not build (v0.1):** `POST /api/eval/log`, `api_events`, session headers, auth, automated runner, CI batch, LLM judge, ops dashboard, committed run notes files.

---

### Implementation steps

**Prerequisites:** §5 complete; ad-hoc prod agent runs already proved the loop (Cursor, Claude, Codex — re-run through scored pipeline for clean `eval_runs`).

#### Step 1 — Eval case + manual prompts

- [ ] `eval/cases/support-dashboard-v0.1.json` — locked schema per above
- [ ] `eval/types.ts` — `EvalCase`, `SuccessCriteria`, `EvalResultBlock` (fields match `eval_runs`)
- [ ] `lib/eval/renderPrompt.ts` — merge `case.prompt` into `eval/manual/wrapper_{prod,local}.txt` (`{{TASK}}`, `{{BASE_URL}}`)
- [ ] `eval/manual/wrapper_prod.txt` + `wrapper_local.txt` — shared wrappers
- [ ] `eval/manual/{cursor,claude,codex}/README.md` — invocation per agent CLI
- [ ] `npm run eval:prompt` — print full prompt to stdout

#### Step 2 — Scoring library

- [ ] `lib/eval/loadCase.ts` — load case JSON by id
- [ ] `lib/eval/collectBlocks.ts` — walk `Rui` → block types + binding paths
- [ ] `lib/eval/scoreRun.ts` — deterministic pass/fail + `score_details`
- [ ] `lib/eval/parseEvalResult.ts` — parse `---EVAL_RESULT---` from stdin (local paste workflow)
- [ ] `eval/score.ts` — CLI: `--specId`, `--case`, optional `--validate-count`
- [ ] `npm run eval:score` in `package.json`

#### Step 3 — Postgres `eval_runs` + log script

- [ ] `lib/db/migrations/002_eval_runs.sql`
- [ ] `lib/db/evalRuns.ts` — `insertEvalRun`, `listEvalRunsByCase` (minimal)
- [ ] Extend `scripts/migrate.ts` to apply `002_eval_runs.sql` (after 001)
- [ ] `scripts/log-eval-run.ts` — CLI flags or stdin EVAL_RESULT → score → insert
- [ ] `npm run eval:log` in `package.json`
- [ ] Optional: `scripts/smoke-eval.ts` + `npm run smoke:eval` — score golden SavedSpec against primary case

#### Step 4 — Log prod runs + verify three agents

- [ ] Re-run: Cursor, Claude, Codex on `support-dashboard-v0.1` @ **prod**
- [ ] Each run: `eval:log` → `eval_runs` row + score pass
- [ ] Query error code frequency — confirm empty or documented
- [ ] Human opens each `view_url` — optional §5 review

#### Step 5 — Docs + commit

- [ ] README — eval folder layout, prod log workflow, local playground note
- [ ] Commit: `feat(eval): agent test harness — cases, eval_runs, score script`

---

### Deliverables

- [ ] `eval/cases/support-dashboard-v0.1.json`
- [ ] `eval/manual/` — shared wrappers + per-agent README
- [ ] `lib/eval/` + `eval/score.ts` — deterministic scoring
- [ ] `eval_runs` Postgres table + migration 002
- [ ] `scripts/log-eval-run.ts` + `npm run eval:log`
- [ ] Three **prod** agents logged on primary case with scored outcomes

**§6 status: Spec complete — ready for implementation.**

### Done when

**Mechanism (§6 v0.1 — required):**

- [ ] `eval/cases/support-dashboard-v0.1.json` committed
- [ ] `npm run eval:prompt`, `eval:score`, `eval:log` work locally
- [ ] Cursor, Claude, and Codex each complete primary case on **prod** with **`eval_runs` row in Postgres**
- [ ] `eval/score.ts` deterministic pass for each logged run
- [ ] Error code frequency queryable from `eval_runs`
- [ ] Manual workflow documented in `eval/manual/*/README.md`

**Credibility (post–§6 — optional, not blocking MVP):**

- [ ] Thin-prompt or held-out case added to `eval/cases/` when ready to test generalization beyond golden-aligned Option A

> **Not in §6 v0.1 (by design):** `POST /api/eval/log`, committed run notes / `notes.md`, `api_events`, session headers, auth, automated `POST /api/eval/run`, CI batch, LLM judge, ops dashboard, Options B & C eval cases.

---

### Decisions (resolved)

| # | Decision |
|---|----------|
| 1 | **No external eval folder** — all prompts and cases live in repo `eval/` only |
| 2 | **No `POST /api/eval/log` in v0.1** — `scripts/log-eval-run.ts` from repo; HTTP endpoint deferred v0.2 |
| 3 | **Single log destination** — Postgres `eval_runs` only; personal notes (Apple Notes) for local scratch, not committed |
| 4 | **Prod required for MVP done**; local is optional playground |
| 5 | **`---EVAL_RESULT---` in local prompt only** — field names match `eval_runs` columns; prod uses CLI flags + simple agent output |
| 6 | **Phase 2 headers optional** until v0.2 |
| 7 | **`eval_runs.id` via `crypto.randomUUID()`** in app — match §4 |
| 8 | **`eval/score.ts` authoritative** — `--specId` + `--case`; EVAL_RESULT supplies metadata for log script only |

---

### v0.1 implementation order (keep simple)

```txt
1. eval/cases/support-dashboard-v0.1.json + eval/manual/ wrappers + eval:prompt
2. lib/eval/ + eval/score.ts
3. 002_eval_runs.sql + log-eval-run.ts + extend migrate.ts
4. Re-run Cursor + Claude + Codex on prod → eval:log → Postgres
5. README + commit
```

---

## Project Structure (sketch)

Next.js monorepo — single app, API routes + optional pages.

```txt
rapid-ui/
├── app/
│   ├── llms.txt/route.ts       # §3 discovery index
│   ├── api/
│   │   ├── docs/route.ts       # §3 agent documentation
│   │   ├── schema/route.ts     # §3 vocabulary route
│   │   ├── validate/route.ts   # §2
│   │   └── specs/
│   │       ├── route.ts        # §4 POST
│   │       └── [id]/route.ts   # §4 GET
│   └── specs/[id]/             # §5 RUI inspector
│       ├── page.tsx
│       ├── not-found.tsx
│       └── error.tsx
├── lib/
│   ├── registry/               # §1 vocabulary source of truth
│   ├── validate/               # §2 validation engine
│   ├── docs/                   # §3 agent doc content + getDocsPayload()
│   ├── db/                     # §4 Postgres client + queries + evalRuns (§6)
│   ├── eval/                   # §6 loadCase, renderPrompt, scoreRun, …
│   └── review/                 # §5 inspector components (block tree)
├── eval/                       # §6 cases, manual wrappers, score CLI
│   ├── cases/
│   ├── manual/
│   ├── score.ts
│   └── types.ts
├── scripts/
│   ├── log-eval-run.ts         # §6
│   └── migrate.ts              # 001 + 002
└── ...
```

---

## API Surface Summary

Base: `https://rapidui.dev`

| Method | Path | Section | Notes |
|--------|------|---------|-------|
| GET | `/` | §3 | Minimal homepage — humans + links to llms.txt / API |
| GET | `/llms.txt` | §3 | Agent discovery index + Instructions |
| GET | `/api/docs` | §3 | Agent-readable documentation (JSON + markdown sections) |
| GET | `/api/schema` | §1, §3 | Vocabulary / block discovery |
| POST | `/api/validate` | §2 | Validate RUI; return errors or success |
| POST | `/api/specs` | §4 | Store validated RUI (flat SavedSpec, 201) |
| GET | `/api/specs/:id` | §4 | Retrieve flat SavedSpec (`url`, `viewUrl`, …) |
| GET | `/specs/:id` | §5 | Human RUI inspector — type-colored block tree |

---

## Deferred (post–v0.1)

- React / native renderer from spec
- Rendered app URLs (separate from rapidui.dev API platform)
- Live API execution against bound endpoints
- API auth & multi-tenancy
- **Phase 2 eval:** optional `X-RapidUI-*` request headers + `api_events` table + `POST /api/eval/log` (designed in §6)
- Automated eval runner (`POST /api/eval/run`) + CI batch runs
- LLM judge for semantic/intent scoring
- **Phase 3 eval:** `agent_sessions`, operational dashboard, analytics, error surfacing in rendered apps
- Agent identity / credential propagation (API keys)
- Additional eval cases: CRUD admin (B), approval queue (C)

---

## Section Detail Log

Track when each section is fully specified and implemented.

| Section | Spec complete | Implemented | Notes |
|---------|---------------|-------------|-------|
| 0. Project Setup | ☑ | ☑ | Next.js, GitHub, Vercel, Postgres, rapidui.dev |
| 1. Vocabulary Registry | ☑ | ☑ | RUI schemas, golden file, smoke test — Option A; B/C planned |
| 2. Validation Engine | ☑ | ☑ | Pipeline, normalize, `POST /api/validate`, `npm run smoke:validate` |
| 3. Agent Documentation | ☑ | ☑ | llms.txt, /api/docs, /api/schema, content/*.md, homepage hub, specs 501 stub; production verify after deploy |
| 4. RUI Store | ☑ | ☑ | Postgres + POST/GET /api/specs; production migrate + curl verify (2026-05-27) |
| 5. RUI Inspector | ☑ | ☑ | Block tree at `/specs/:id`, viewUrl on SavedSpec; local + production verified (2026-05-28) |
| 6. Agent Test Harness | ☑ | ☐ | Ready for implementation — case-generic harness, eval:prompt/score/log, mechanism vs credibility split |

---

## Agent-facing API research (reference)

Background reading for §3 design (2026). No implementation requirement — for review when tuning docs and errors.

### Discovery & documentation formats

| Resource | URL | Notes |
|----------|-----|-------|
| llms.txt specification | https://llmstxt.org/ | Root Markdown index; H1, blockquote, `##` link lists |
| llms.txt — how it works | https://llmtxt.info/how-it-works/ | Parsing rules, `llms-full.txt` sibling |
| LLMs.txt in 2026 (guide) | https://limy.ai/blog/llms.txt-in-2026-the-full-guide | Adoption (Mintlify, Fern, IDE agents) |
| Stripe llms.txt + Instructions section | https://www.apideck.com/blog/stripe-llms-txt-instructions-section | Behavioral rules in static file |
| Stripe — Add agents to workflows | https://docs.stripe.com/agents | Toolkit + MCP alongside docs |

### Agent registration & auth

| Resource | URL | Notes |
|----------|-----|-------|
| auth.md — the file | https://workos.com/auth-md/docs/auth-md | Prose companion to OAuth PRM (May 2026) |
| auth.md — for apps | https://workos.com/auth-md/docs/apps | Discovery, flows, fenced HTTP/JSON templates |
| WorkOS — agent registration blog | https://workos.com/blog/agent-registration-with-auth-md | `/agent/auth`, ID-JAG, RFC 9728 |
| WorkOS — agent experience (AX) | https://workos.com/blog/agent-experience-oujuh | Machine-readable errors, OpenAPI, idempotency |

### Tool protocols & orchestration

| Resource | URL | Notes |
|----------|-----|-------|
| Model Context Protocol | https://modelcontextprotocol.io/ | Tools, resources, prompts; Streamable HTTP |
| MCP — tools concept | https://modelcontextprotocol.io/docs/concepts/tools | JSON Schema tool definitions |
| Anthropic — code execution with MCP | https://www.anthropic.com/engineering/code-execution-with-mcp | Load tools as code APIs (token efficiency) |
| Anthropic — building effective agents | https://www.anthropic.com/engineering/building-effective-agents | Simple patterns; tool format matters |
| Anthropic — writing tools for agents | https://www.anthropic.com/engineering/writing-tools-for-agents | Descriptions, pagination, response shape |
| OpenAI — new tools for building agents | https://openai.com/index/new-tools-for-building-agents/ | Responses API, Agents SDK, hosted tools |
| OpenAI Agents SDK (Python) | https://openai.github.io/openai-agents-python/ | Instructions, tools, MCP, handoffs |
| Google A2A protocol | https://a2a-protocol.org/ | Agent-to-agent; `agent-card.json`; complements MCP |
| A2A — llms.txt in repo | https://github.com/a2aproject/A2A/blob/main/docs/llms.txt | Meta: protocols using llms.txt for discovery |
| Mastra docs llms.txt | https://mintlify.com/mastra-ai/mastra/llms.txt | Example: framework docs as llms index |

### REST / “agent experience” API design

| Resource | URL | Notes |
|----------|-----|-------|
| API design for the agentic era | https://www.apideck.com/blog/api-design-principles-agentic-era | AX, `doc_url`, error recovery |
| Agent-friendly APIs (2026) | https://tianpan.co/blog/2026-04-10-agent-friendly-apis-backend-design | `code`, `is_retriable`, `retry_after_seconds` |
| RFC 9457 — Problem Details | https://www.rfc-editor.org/rfc/rfc9457 | `application/problem+json` baseline |
| agentic-api-standard (community) | https://github.com/nexus-marbell/agentic-api-standard | Manifest, HATEOAS, `did_you_mean` — aspirational |

### Cloud provider agent products (adjacent)

| Resource | URL | Notes |
|----------|-----|-------|
| AWS — InvokeAgent | https://docs.aws.amazon.com/bedrock/latest/userguide/agents-invoke-agent.html | Managed orchestration, not public doc APIs |
| AWS — How Bedrock Agents work | https://docs.aws.amazon.com/bedrock/latest/userguide/agents-how.html | Action groups, knowledge bases |

### Framework note (Mastra)

[Mastra](https://mastra.ai/docs/agents/overview) is a **TypeScript agent framework** (build agents), not a documentation standard. Useful as a **consumer** of llms.txt-style docs, not as a replacement for RapidUI’s `/api/docs` + `/api/schema` split.

---

## Document history

| Date | Section | Change |
|------|---------|--------|
| 2026-05-25 | §0 | Project setup complete — Next.js on Vercel, Postgres, `rapidui.dev` |
| 2026-05-25 | §1 | Committed `f2ce571` — registry on `main`, ready for §2 |
| 2026-05-25 | §2 | Validation engine implemented — `lib/validate/`, `POST /api/validate`, smoke:validate |
| 2026-05-25 | §2 | Committed `0fddb09`; production smoke verified on `rapidui.dev` |
| 2026-05-25 | Docs | Adopted **RUI** as format name and **`.rui.json`** extension; demo scenario updated with agent-facing prompt |
| 2026-05-25 | §3 | Full implementation spec — llms.txt, /api/docs, /api/schema, POST /api/specs 501 stub; agent API research appendix |
| 2026-05-25 | §3 | Content via `lib/docs/content/*.md` + `readDoc()`; minimal homepage hub; llms.txt discovery notes |
| 2026-05-26 | §3 | Implemented — `lib/docs/`, routes, homepage hub, `smoke:docs`; commit + production verify pending |
| 2026-05-26 | §3 | Committed `5163958`; production curl checks pass; manual agent eval (single-page, two-page, thin prompts) — all valid RUIs |
| 2026-05-26 | §4 | Full implementation spec — Postgres schema, `@vercel/postgres`, re-validate inline, UUID v4 specId, contentHash, POST 201 / GET by id, agent doc update steps |
| 2026-05-26 | §4 | POST/GET responses include absolute **`url`** (`https://rapidui.dev/api/specs/{specId}`) — agent handoff; no local save; **`viewUrl`** deferred to §5 viewer |
| 2026-05-26 | §4 | DRY response shape — `specId` + `url` at root only; `receipt` is audit metadata (no repeated id/url) |
| 2026-05-26 | §4 | Flat **SavedSpec** — no nested `receipt`; v0.1 spec `url` vs v0.2+ `appUrl`; “receipt” = prose only |
| 2026-05-26 | §4 | Implementer appendix — defaults table, pre-implementation checklist, handoff summary; urls.ts, getting-started, `[id]/route` in structure |
| 2026-05-27 | §4 | **Implemented** — `lib/db/`, POST/GET `/api/specs`, smoke:specs, docs updated; local agent evals pass (Composer, Sonnet, GPT); commit + prod verify pending |
| 2026-05-27 | §4 | **Production verified** — prod migrate applied; `curl` POST golden → 201, GET by `specId` → 200 on `rapidui.dev` |
| 2026-05-27 | §5 | Full implementation spec — RUI Inspector at `/specs/:id`, type-colored block tree, `viewUrl` on SavedSpec, `lib/review/` |
| 2026-05-27 | §5 | Pre-flight locked — HTML 404 for bad/missing ids, light-only chrome, `force-dynamic`, in-process smoke, minimal `lib/review/` layout; §4 SavedSpec examples + handoff updated for `viewUrl` |
| 2026-05-27 | §5 | **Implemented** — `lib/review/`, `GET /specs/:id`, viewUrl on SavedSpec, smoke:inspector; local agent eval + browser verify pass; prod browser check post-deploy |
| 2026-05-28 | §5 | **Production verified** — `curl` POST golden → 201 with `viewUrl`; inspector at `/specs/{specId}` returns 200; manual browser check pass on `rapidui.dev` |
| 2026-05-30 | §6 | **Full implementation spec** — eval harness vs session observability; Phase 1–3 roadmap; eval case JSON, `eval_runs`, `eval/score.ts`, phased observability design |
| 2026-05-30 | §6 | **Spec locked for implementation** — wrapper+renderPrompt model, npm scripts contract, implementer start here, mechanism vs credibility done-when |
