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
| 5 | **Agents for proof** | **Cursor agent** (primary, fast iteration) + **Claude** (external agent test case) |
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
└── /specs/[id]        ← optional RUI viewer
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

### Two layers of scoring

| Layer | How | When |
|-------|-----|------|
| **Deterministic** | `POST /api/validate` pass/fail, retry count, required-block checklist | v0.1 — build this first |
| **Semantic / intent** | Does the RUI include table + metrics for a dashboard prompt? Rubric or LLM judge | v0.2+ — optional |

Deterministic scoring is enough to prove the platform. Semantic scoring tells you if the RUI is *useful*, not just *valid*.

### v0.1 eval flow (manual + logged)

```txt
Eval case (prompt + mock API context)
    ↓
Agent reads GET /api/docs + GET /api/schema
    ↓
Agent generates a RUI → POST /api/validate (loop)
    ↓
On success → POST /api/specs
    ↓
Log run to Postgres: agent, prompt_id, retries, errors[], pass/fail, duration
```

**Cursor agent** runs this during development (fast debug). **Claude** runs the same cases headlessly to prove external agents work without Cursor context.

### Eval system building blocks (sequenced)

| Phase | What | Purpose |
|-------|------|---------|
| **v0.1** | Eval cases as JSON (prompt, mock API, expected block checklist) | Repeatable test definitions |
| **v0.1** | `eval_runs` table in Postgres | Log every run — retries, errors, outcome |
| **v0.1** | Manual runner (Cursor / Claude + checklist) | Prove loop before automating |
| **v0.2** | `POST /api/eval/run` or CLI script | Trigger agent + score automatically |
| **v0.2** | Batch mode: N prompts × 2 agents | Pass rate, avg retries, regression |
| **v1** | LLM judge for intent rubric | Score semantic fit beyond validation |

### Eval case shape (sketch)

```txt
{
  id: "support-dashboard-v0.1",
  prompt: "Generate a RUI for an internal support dashboard. Bind to GET /api/tickets and GET /api/tickets/stats.",
  mockApi: { endpoints: [...] },
  successCriteria: {
    mustValidate: true,
    maxRetries: 5,
    requiredBlocks: ["Table", "Metric"],
    requiredBindings: ["GET /api/tickets"]
  }
}
```

### Key metrics to track

- **Pass rate** — % of cases that reach valid RUI within max retries
- **Avg retries** — lower is better; spikes mean docs or error messages need work
- **Error code frequency** — which validation errors agents hit most (feeds doc improvements)
- **Agent comparison** — Cursor vs Claude on same cases

### Where this lives in the implementation plan

Eval cases and logging extend **§6 Agent Test Harness**. Postgres schema for `eval_runs` can be added alongside **§4 RUI Store**. Full automation is explicitly **post-v0.1** unless time allows.

---

## Success Criteria (MVP v0.1)

- [x] §0 complete — app deployed at `https://rapidui.dev`, Postgres provisioned
- [ ] External agent discovers vocabulary from docs without verbal hand-holding
- [ ] Agent produces a RUI for the support ticket dashboard scenario
- [x] `POST /api/validate` returns actionable, machine-readable errors
- [ ] Agent converges to valid RUI within a bounded retry count (target: ≤5)
- [ ] `POST /api/specs` persists validated RUI + receipt
- [ ] Optional: RUI viewable by id

---

## Architecture Summary

```txt
Agent reads docs → generates a RUI (JSON, `*.rui.json`)
    → POST /api/validate → errors | success
    → (retry loop)
    → POST /api/specs → { id, receipt }
    → optional GET /api/specs/:id
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
| 3 | [Agent Documentation](#3-agent-documentation) | §1, §2 (`ERROR_CATALOG`, live validator) | Spec complete |
| 4 | [RUI Store](#4-rui-store--post-apispecs) | §0 (Postgres), §2 | Not started |
| 5 | [RUI Viewer (optional)](#5-rui-viewer-optional) | §4 | Not started |
| 6 | [Agent Test Harness](#6-agent-test-harness--evals) | §1–§4 | Not started |

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
| Tailwind CSS | Yes (optional) | Handy for §5 spec viewer; skip if you want zero UI deps |
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

- ORM choice (Drizzle vs Prisma vs raw SQL) — decide when implementing §4
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
| `validationVersion` | `"0.1"` — exported as `VALIDATION_VERSION` (receipt field in §4) |
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
| Homepage `/` | **§3 minimal hub** — human one-liner + “For agents” links; full marketing / §5 viewer links **later** |
| Base URL | `https://rapidui.dev` |

#### Naming: RUI vs `specs` (locked)

| Term | Use for |
|------|---------|
| **RUI** | The artifact — JSON document, `.rui.json`, blocks, bindings. All **prose** in docs and agent instructions. |
| **spec** (API only) | HTTP resource for a **stored** RUI — paths stay **`/api/specs`**, fields like `specId` in §4 receipts. |

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
5. POST /api/specs     → §3: 501 planned; §4: { id, receipt }
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

Replace the Next.js scaffold with a simple landing page. **Not** a full marketing site in §3; polish later. §5 viewer (`/specs/[id]`) can be linked from `/` when that section ships.

**Include:**

| Area | Content |
|------|---------|
| Hero (humans) | One line: RapidUI = validate → correct → save **RUIs** (not React apps) |
| Status | Link to `GET /api/health` or inline `{ ok: true }` check |
| **For agents** | Visible section with links: `/llms.txt`, `/api/docs`, `/api/schema`, `POST /api/validate` (note: `POST /api/specs` planned) |
| **For developers** | Link to GitHub / README (optional) |
| Footer | `rapidui.dev` — v0.1 |

**Explicitly defer to later:** visual brand, diagrams, demo video, link to §5 spec viewer, auth.md.

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
- [ ] Verify `curl https://rapidui.dev/llms.txt` returns 200 without visiting `/` first *(after commit + deploy to `main`)*

#### Step 5b — Homepage hub `GET /`

- [x] Replace scaffold `app/page.tsx` with minimal RapidUI landing (see [Homepage](#homepage-get---minimal-hub--3))
- [x] “For agents” links: `/llms.txt`, `/api/docs`, `/api/schema`, validate endpoint
- [x] Optional: `<link rel="alternate" type="text/markdown" href="/llms.txt" />` in `app/layout.tsx`

#### Step 6 — `POST /api/specs` stub

- [x] `app/api/specs/route.ts` — POST only → 501 + body above
- [x] Do **not** connect `DATABASE_URL` in §3

#### Step 7 — Smoke + production

- [x] `npm run smoke:docs` — fetch docs/schema/llms.txt, assert errors length, golden validates via existing smoke
- [ ] `curl https://rapidui.dev/` — homepage contains link to `/llms.txt` *(after deploy)*
- [ ] `curl https://rapidui.dev/llms.txt` *(after deploy)*
- [ ] `curl https://rapidui.dev/api/docs` | `curl https://rapidui.dev/api/schema` *(after deploy)*
- [ ] `curl -X POST https://rapidui.dev/api/specs` → 501 + `status: planned` *(after deploy)*

#### Step 8 — README + hints

- [x] README links: `/llms.txt`, `/api/docs`, `/api/schema`
- [x] Optional: update `MISSING_REQUIRED_PROP` hint in `messages.ts` to reference `GET /api/schema` (remove “when live”)

#### Step 9 — Commit

- [ ] Commit: `feat(docs): agent docs, llms.txt, homepage hub, schema route, specs stub`

---

### Deliverables

- [x] `lib/docs/` — `load.ts`, `content/*.md`, `getDocsPayload()`, `getLlmsTxt()`
- [x] `GET /llms.txt` at production root (well-known agent entry) — route implemented; production verify after deploy
- [x] `GET /` — minimal homepage with human copy + “For agents” links
- [x] `GET /api/docs` — overview, workflow, errors, examples, API usage (validate live, specs planned)
- [x] `GET /api/schema` — registry-generated vocabulary
- [x] `POST /api/specs` — 501 stub with machine-readable planned response
- [x] `npm run smoke:docs`
- [x] Naming convention documented: **RUI** in prose, **`/api/specs`** for stored documents (§4)

### Done when

- [x] `GET /llms.txt` works without loading `/` first (agents use well-known URL) — verified locally via `npm run dev` + `curl localhost:3000/llms.txt`
- [x] `/` links to `/llms.txt`, `/api/docs`, and `/api/schema` for humans and fallback discovery
- [ ] Fresh agent session with only `https://rapidui.dev/llms.txt` (or `/api/docs`) + `/api/schema` can author a plausible support-dashboard RUI and call `POST /api/validate` *(manual agent eval — run locally now, on production after deploy)*
- [x] Error responses are interpretable via `errors[]` in docs without reading validator source
- [x] `POST /api/specs` returns predictable 501 (not 404) so docs and eval scripts can reference it — verified locally
- [x] **Ready to start §4 RUI Store** (replace specs stub with Postgres + receipts)

**§3 status: Complete (local)** — implementation and smoke tests pass. Remaining: commit → deploy → production curl checks (Step 7) → optional manual agent eval on `rapidui.dev`.

> **Not in §3 (by design):** Postgres, real `POST/GET /api/specs`, MCP server, `auth.md`, `llms-full.txt`, OpenAPI export, §6 eval case files, full marketing site, §5 spec viewer on homepage (add link when §5 ships).

---

## 4. RUI Store + `POST /api/specs`

**Purpose:** Persist validated RUIs and return an auditable receipt.

**Why fourth:** Trivial once validation works; completes the artifact loop.

### API (sketch)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/specs` | Validate (inline) + store RUI; return id + receipt |
| GET | `/specs/:id` | Retrieve RUI + receipt |

### Receipt fields (sketch)

- `specId`
- `createdAt`
- `specVersion`
- `contentHash`
- `validationVersion`

### Deliverables

- [ ] Postgres schema + storage adapter (Vercel Postgres)
- [ ] `POST /api/specs` route
- [ ] `GET /api/specs/:id` route
- [ ] Receipt generation

### Details to fill in later

- Re-validate on every write vs validation token
- Id format (uuid, slug)
- Retention / listing (`GET /specs`) — in or out for v0.1
- Duplicate handling

### Done when

- Valid RUI can be saved and fetched by id with receipt
- Invalid RUI is rejected on write

---

## 5. RUI Viewer (optional)

**Purpose:** Minimal human inspection — not a renderer, not a dashboard.

**Why optional:** Useful for demos; not required to prove agent RUI emission.

**Homepage (later):** When §5 ships, add a link from §3’s minimal `/` hub to the viewer (e.g. “Inspect a saved RUI”). Full marketing redesign stays out of scope until post–v0.1.

### Shows

- Raw RUI JSON
- Receipt / metadata
- Validation status
- Optional: simple block tree outline

### Deliverables

- [ ] `GET /specs/:id/view` or static page that fetches spec — TBD
- [ ] Basic readable layout

### Details to fill in later

- Server-rendered vs static SPA
- Auth (if any)
- Pretty-print vs tree view

### Done when

- Saved spec is inspectable in browser without reading raw API responses manually

---

## 6. Agent Test Harness & Evals

**Purpose:** Repeatable proof that the hypothesis holds — not a one-off manual demo. Foundation for the eval system.

### Agents

| Agent | Role |
|-------|------|
| **Cursor agent** | Primary — fast iteration, debug docs/validation while building |
| **Claude** | External proof — same eval cases, no Cursor context |

### Includes

- [ ] Eval case definitions (prompt + mock API + success criteria) — see [Agent Eval Strategy](#agent-eval-strategy)
- [ ] Primary case: **Option A — support ticket dashboard**
- [ ] Secondary cases: Options B & C added as eval prompts when ready
- [ ] Checklist: docs → generate → validate → fix → save
- [ ] `eval_runs` table in Postgres (agent, prompt_id, retries, errors, pass/fail, duration)
- [ ] Pass/fail criteria: valid RUI within ≤5 retries + required block checklist

### Details to fill in later

- Eval case JSON schema
- Manual runner workflow vs `POST /api/eval/run` (likely manual for v0.1)
- How Claude is invoked (API script vs manual session)
- CI integration — out for v0.1

### Done when

- Cursor and Claude each complete the primary eval case with logged outcome in Postgres
- Error code frequency visible from logged runs (informs doc fixes)

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
│   │   └── specs/route.ts      # §3 stub → §4 store
│   └── specs/[id]/page.tsx     # §5 optional viewer
├── lib/
│   ├── registry/               # §1 vocabulary source of truth
│   ├── validate/               # §2 validation engine
│   ├── docs/                   # §3 agent doc content + getDocsPayload()
│   └── db/                     # §4 Postgres client + queries
├── eval/
│   └── cases/                  # §6 eval case definitions
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
| POST | `/api/specs` | §3 stub, §4 | §3: 501 planned; §4: store validated RUI + receipt |
| GET | `/api/specs/:id` | §4 | Retrieve stored RUI + receipt |
| GET | `/specs/:id` | §5 | Optional human viewer |

---

## Deferred (post–v0.1)

- React / native renderer from spec
- Rendered app URLs (separate from rapidui.dev API platform)
- Live API execution against bound endpoints
- API auth & multi-tenancy
- Automated eval runner (`POST /api/eval/run`) + CI batch runs
- LLM judge for semantic/intent scoring
- Operational dashboard, analytics, error surfacing in rendered apps
- Agent identity / credential propagation
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
| 4. RUI Store | ☐ | ☐ | |
| 5. RUI Viewer | ☐ | ☐ | |
| 6. Agent Test Harness | ☐ | ☐ | |

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
