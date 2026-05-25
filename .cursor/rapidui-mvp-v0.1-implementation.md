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
├── /api/docs          ← agent-readable documentation
├── /api/schema        ← vocabulary / block discovery
├── /api/validate      ← spec validation
├── /api/specs         ← persist validated specs
└── /specs/[id]        ← optional human viewer
```

---

## Demo Scenario

**Primary (v0.1): Option A — Support / Ops Ticket Dashboard**

**Typical prompt:** *"Build an internal support dashboard for our tickets API."*

**Why this first:** Every company with a support queue wants status filters, assignee columns, priority badges, and headline metrics — and agents default to generating a fresh React admin panel every time. Hits table + metrics + filters without write/action bindings on day one.

**UI shape:** Metric row (open tickets, urgent count) → filterable `Table` (id, subject, status, assignee, created) → optional status filter controls.

**API stub:** `GET /api/tickets`, `GET /api/tickets/stats`

**Blocks to support:** `Table`, `Metric`, `Text`, layout sections, list + aggregate bindings.

### Future eval cases (add as we go)

| Option | Scenario | When |
|--------|----------|------|
| B — CRUD admin | List + create users/resources | Eval case #2 |
| C — Approval queue | Pending inbox + approve/reject | Eval case #3 |

---

## Agent Eval Strategy

How we evaluate whether agents can reliably speak RapidUI — now (v0.1) and as a proper eval system later.

### What we are measuring

The MVP hypothesis is **spec reliability**, not UI aesthetics. Evals answer:

1. Did the agent produce a **valid spec**?
2. How many **validation retries** did it take?
3. Where did it **get stuck** (which error codes recur)?
4. Does the spec **match the prompt intent** (right blocks, right bindings)?

### Two layers of scoring

| Layer | How | When |
|-------|-----|------|
| **Deterministic** | `POST /api/validate` pass/fail, retry count, required-block checklist | v0.1 — build this first |
| **Semantic / intent** | Does spec include table + metrics for a dashboard prompt? Rubric or LLM judge | v0.2+ — optional |

Deterministic scoring is enough to prove the platform. Semantic scoring tells you if the spec is *useful*, not just *valid*.

### v0.1 eval flow (manual + logged)

```txt
Eval case (prompt + mock API context)
    ↓
Agent reads GET /api/docs + GET /api/schema
    ↓
Agent generates spec → POST /api/validate (loop)
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
  prompt: "Build an internal support dashboard for GET /api/tickets ...",
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

- **Pass rate** — % of cases that reach valid spec within max retries
- **Avg retries** — lower is better; spikes mean docs or error messages need work
- **Error code frequency** — which validation errors agents hit most (feeds doc improvements)
- **Agent comparison** — Cursor vs Claude on same cases

### Where this lives in the implementation plan

Eval cases and logging extend **§6 Agent Test Harness**. Postgres schema for `eval_runs` can be added alongside **§4 Spec Store**. Full automation is explicitly **post-v0.1** unless time allows.

---

## Success Criteria (MVP v0.1)

- [ ] §0 complete — app deployed at `https://rapidui.dev`, Postgres provisioned
- [ ] External agent discovers vocabulary from docs without verbal hand-holding
- [ ] Agent produces a spec for the support ticket dashboard scenario
- [ ] `POST /api/validate` returns actionable, machine-readable errors
- [ ] Agent converges to valid spec within a bounded retry count (target: ≤5)
- [ ] `POST /api/specs` persists validated spec + receipt
- [ ] Optional: spec viewable by id

---

## Architecture Summary

```txt
Agent reads docs → generates UI spec (JSON)
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
| 0 | [Project Setup](#0-project-setup) | Decisions locked | Not started |
| 1 | [Vocabulary Registry](#1-vocabulary-registry) | §0 | Spec complete |
| 2 | [Validation Engine](#2-validation-engine--post-apivalidate) | §1 | Spec complete |
| 3 | [Agent Documentation](#3-agent-documentation) | §1, §2 (`ERROR_CATALOG`, live validator) | Not started |
| 4 | [Spec Store](#4-spec-store--post-specs) | §0 (Postgres), §2 | Not started |
| 5 | [Spec Viewer (optional)](#5-spec-viewer-optional) | §4 | Not started |
| 6 | [Agent Test Harness](#6-agent-test-harness--evals) | §1–§4 | Not started |

### Testing while building §0–§2 (before §3 docs)

No `GET /api/docs` or `GET /api/schema` routes until **§3**. During §0–§2, smoke-test validation manually:

- `POST /api/validate` with `lib/registry/golden/support-dashboard.json` (or copy-paste body)
- A few invalid fixtures from [§2 fixture catalog](#invalid-fixture-catalog)

Agent discovery and the full eval loop wait for §3+.

---

## 0. Project Setup

**Purpose:** Bootstrap the RapidUI application, repo, hosting, and database so all later sections have a real deployment target from day one.

**Why zero:** Agents must call a live API at `rapidui.dev`. Vocabulary, validation, and spec storage all assume Next.js routes, Postgres, and Vercel are already in place.

### Prerequisites (install locally)

- [ ] **Node.js** — LTS (v20+ recommended)
- [ ] **Package manager** — npm (bundled) or pnpm
- [ ] **Git**
- [ ] **GitHub account** + repo access
- [ ] **Vercel account** — linked to GitHub
- [ ] **Domain** — `rapidui.dev` available for DNS configuration

**Optional but useful:**

- [ ] [GitHub CLI](https://cli.github.com/) (`gh`) — create repo from terminal
- [ ] [Vercel CLI](https://vercel.com/docs/cli) — env pull, deploy checks

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

- [ ] Folders created
- [ ] `GET /api/health` returns `{ ok: true }` — proves deploy + routing work

### Step 3 — Environment variables

- [ ] `.env.local` — local secrets (gitignored)
- [ ] `.env.example` — committed template for required vars

**Vars to plan for (values come in Step 6):**

```txt
DATABASE_URL=           # Vercel Postgres connection string
```

Do not commit `.env.local`.

### Step 4 — Git repository

- [ ] `git init` (if not already a repo)
- [ ] Initial commit: Next.js scaffold + folder structure + `.env.example`
- [ ] `.gitignore` includes `.env*.local`, `node_modules`, `.next`

### Step 5 — GitHub remote

- [ ] Create GitHub repo (e.g. `rapid-ui` or `rapidui` under your org/user)
- [ ] Add remote: `git remote add origin git@github.com:<org>/<repo>.git`
- [ ] Push default branch: `git push -u origin main`

**Via GitHub CLI (optional):**

```bash
gh repo create <org>/<repo> --private --source=. --push
```

### Step 6 — Vercel project

- [ ] Import GitHub repo in [Vercel dashboard](https://vercel.com/new)
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Production branch: `main`
- [ ] First deploy succeeds (default `*.vercel.app` URL)

**Post-deploy check:**

- [ ] `https://<project>.vercel.app/api/health` returns `{ ok: true }`

### Step 7 — Vercel Postgres (provision only)

- [ ] Create **Postgres** storage in Vercel project (Storage tab → Connect Store)
- [ ] Link `DATABASE_URL` to project env vars (Production + Preview + Development)
- [ ] Pull env locally: `vercel env pull .env.local` (requires Vercel CLI + linked project)

**Note:** No app code touches the database until **§4**. For §0: add Postgres, wire env vars, move on. Tables, `lib/db/` client, and queries come in §4.

### Step 8 — Custom domain (`rapidui.dev`)

- [ ] Add domain in Vercel project → Settings → Domains
- [ ] Configure DNS at registrar (Vercel nameservers or A/CNAME records as instructed)
- [ ] SSL certificate issued
- [ ] `https://rapidui.dev/api/health` works

### Step 9 — README & agent-facing base URL

- [ ] Root `README.md` — project one-liner, local dev commands, link to `.cursor/` docs
- [ ] Document public base URL: `https://rapidui.dev` (used in §3 agent docs)

### Deliverables

- [ ] Next.js app runs locally (`npm run dev`)
- [ ] Repo on GitHub with `main` pushed
- [ ] Vercel project deploys on push
- [ ] `rapidui.dev` resolves with HTTPS
- [ ] Vercel Postgres provisioned; `DATABASE_URL` in Vercel + `.env.local`
- [ ] Folder scaffold: `lib/registry`, `lib/validate`, `lib/db`, `eval/cases`
- [ ] `GET /api/health` live on production
- [ ] `.env.example` committed

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

**Design principle:** **A-complete, B/C-ready.** v0.1 validates only what Option A needs. `Form`, `Button`, `write`, and `action` are documented as `planned` in `/api/schema` so agents see the roadmap without emitting half-supported specs.

### Decisions (locked for §1)

| Decision | Choice |
|----------|--------|
| Filters | Static options on `Table.filter` (no separate `Select` block) |
| Planned features | Exposed in `/api/schema` as `planned[]` |
| Column types | `"string"`, `"number"`, `"date"`, `"badge"` — use `badge` for status |
| Labels / copy | Both `Section.title` and `Text` block supported |
| Registry format | TypeScript + **Zod** schemas in `lib/registry/` (single source for types + validation) |
| Registry version | `"0.1"` — must match top-level spec `version` |
| Multi-page specs | **`pages[]` + `navigation`** supported; Option A uses one page |
| `meta` scope | **App-level** title & description (whole application, not a single page) |
| Unknown properties | **Strict mode** — reject extra props anywhere (`UNKNOWN_PROP`) |
| Node `id` | **Agent-generated** (v0.1 simplest); validate format + uniqueness only — see [Node IDs](#node-ids) |

---

### Spec envelope

Every UI spec is a single JSON document. **`meta` describes the application**; each entry in **`pages`** is a routable screen (future renderer uses `navigation` for routing).

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

**Multi-page (future):** left nav from `navigation.items`; renderer routes between `pages`. Option A golden spec uses one nav item + one page — no uplift for v0.1 eval, but the model supports growth.

---

### Node IDs (v0.1 — simplest)

**v0.1 approach:** The **agent generates every node `id`**. RapidUI only validates — no platform assignment or normalization yet.

| Rule | Value |
|------|--------|
| Who assigns | **Agent** (required on every Page, Section, block) |
| Pattern | `^[a-z][a-z0-9-]*$` (lowercase kebab-case) |
| Length | 1–64 characters |
| Uniqueness | Unique across **entire spec** (all pages, sections, blocks) |
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

**§2 normalization (v0.1):** On successful validate, return `normalizedSpec` with deterministic sibling order and canonical JSON key order — **agent `id` strings are preserved**. See [§2 Normalization](#normalization-v01).

---

### Layouts (validated in v0.1)

#### `Page` — screen container

One `Page` per routable screen. Specs contain one or more pages; Option A uses one.

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
Spec
├── navigation.items[]  →  pageId references pages[].id
└── pages: Page[]
    └── children: Section[]
        └── children: Block[]   (Metric | Table | Text)
```

| Parent | Allowed children | Max depth |
|--------|------------------|-----------|
| Spec | `version`, `meta`, `navigation`, `pages` only (strict) | — |
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
| R3 | Every node with an `id` must be globally unique across the spec | `DUPLICATE_ID` |
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

**R2 + strict envelope:** Missing top-level key → `MISSING_REQUIRED_PROP` (path = key name or `""`). Extra top-level key → `UNKNOWN_PROP` (strict / R7). Do not use `INVALID_ENVELOPE`.

---

### Golden example — Option A (support dashboard)

Reference spec agents should converge toward for the primary eval case:

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
├── envelope.ts        # spec envelope, navigation, meta (Zod)
├── layouts.ts         # Page, Section definitions (Zod)
├── blocks.ts          # Metric, Table, Text (+ planned metadata)
├── bindings.ts        # ReadBinding (+ planned write/action)
├── ids.ts             # id format regex + validation helpers (agent-provided ids)
├── rules.ts           # rule definitions + error codes (R0–R24)
├── planned.ts         # Form, Button, write, action stubs for schema
└── golden/
    └── support-dashboard.json
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
├── envelope.ts
├── layouts.ts
├── blocks.ts
├── bindings.ts
├── ids.ts
├── rules.ts
├── planned.ts
└── golden/
    └── support-dashboard.json
```

- [ ] All files created (empty exports OK initially)
- [ ] `lib/registry/index.ts` re-exports public API

### Step 2 — Registry version

In `version.ts`:

- [ ] Export `REGISTRY_VERSION = "0.1"`
- [ ] Used by envelope Zod schema and rule R1

### Step 3 — ID helpers

In `ids.ts`:

- [ ] Export id regex: `^[a-z][a-z0-9-]*$` (1–64 chars)
- [ ] Export helper `isValidId(id: string): boolean`
- [ ] Export helper to collect all ids from a parsed spec (for uniqueness check in §2)

### Step 4 — Bindings schema

In `bindings.ts`:

- [ ] Define `ReadBindingSchema` (Zod, `.strict()`): `type`, `method`, `path`, optional `valuePath`
- [ ] Export `ReadBinding` type via `z.infer`
- [ ] Constrain `type: "read"`, `method: "GET"`, `path` starts with `/`

### Step 5 — Layouts schema

In `layouts.ts`:

- [ ] Define `SectionSchema` — `id`, `type`, optional `title`, `direction`, `children` (blocks, min 1)
- [ ] Define `PageSchema` — `id`, `type`, `title`, optional `description`, `children` (sections, min 1)
- [ ] Use `.strict()` on both
- [ ] Wire block union into `SectionSchema.children` (import from `blocks.ts` once ready)

### Step 6 — Blocks schema

In `blocks.ts`:

- [ ] Define `MetricSchema`, `TableSchema`, `TextSchema` (all `.strict()`)
- [ ] Table: `columns[]` (key, label, optional type enum), optional `filter` (field, label, options)
- [ ] Metric: require `binding` with `valuePath` (refine or document for §2 rule R19)
- [ ] Export `BlockSchema` as discriminated union on `type`
- [ ] Connect to `SectionSchema.children`

### Step 7 — Envelope schema

In `envelope.ts`:

- [ ] Define `MetaSchema`, `NavigationItemSchema`, `NavigationSchema`, `SpecSchema`
- [ ] Top-level: `version`, `meta`, `navigation`, `pages` — `.strict()`, no extra keys
- [ ] `pages`: array of `PageSchema`, min length 1
- [ ] `navigation.items`: min length 1; each item has `pageId`, `label`
- [ ] Export `Spec` type via `z.infer`

### Step 8 — Planned metadata

In `planned.ts`:

- [ ] Export `PLANNED_BLOCKS = ["Form", "Button"]`
- [ ] Export `PLANNED_BINDINGS = ["write", "action"]`
- [ ] Export shape for `/api/schema` → `planned` key (used in §3)

### Step 9 — Rules catalog

In `rules.ts`:

- [ ] Export `RULES` array: R0–R24 with `code`, `description` (see [Rules & error codes](#rules--error-codes))
- [ ] Semantic rules (nav ↔ pages, duplicate ids, filter field) implemented in §2 validator — catalog documents them here for `/api/schema`

### Step 10 — Golden spec

In `golden/support-dashboard.json`:

- [ ] Copy the [golden example](#golden-example--option-a-support-dashboard) JSON verbatim
- [ ] Confirm: one nav item, one page, two metrics, one table with filter

### Step 11 — Wire `index.ts` + local smoke test

In `index.ts`:

- [ ] Re-export: `REGISTRY_VERSION`, all schemas, `RULES`, planned metadata
- [ ] Export `getSchemaPayload()` — builds JSON object for future `GET /api/schema`

**Smoke test** (temporary script or `npm test`):

```bash
# Example: node/tsx script that parses golden JSON with SpecSchema.safeParse
# Expect: success (semantic rules like nav↔pages may be §2 — structural parse should pass)
```

- [ ] Golden spec passes `SpecSchema.safeParse()` (structural)
- [ ] Invalid fixture (extra prop) fails with Zod error (strict mode)

### Step 12 — Commit

- [ ] Commit: `feat(registry): v0.1 vocabulary — envelope, layouts, blocks, bindings`

---

### Deliverables

- [ ] `lib/registry/` module structure as above
- [ ] **Zod schemas** for envelope, navigation, layouts, blocks, bindings (`.strict()` on all objects)
- [ ] Spec envelope — `meta` (app-level), `navigation`, `pages[]`
- [ ] Layout definitions — `Page`, `Section`
- [ ] Block definitions — `Metric`, `Table`, `Text`
- [ ] Binding definition — `ReadBinding`
- [ ] Node ID format — regex + helpers in `ids.ts`
- [ ] Planned registry — `Form`, `Button`, `write`, `action` metadata
- [ ] Rule catalog with error codes (R0–R24)
- [ ] Nesting matrix enforced in Zod schemas
- [ ] Golden spec — `golden/support-dashboard.json` (one page + one nav item)
- [ ] Registry importable by §2 validator and §3 schema route

### Done when

- All [implementation steps](#implementation-steps) checked off
- Registry exists in `lib/registry/` and exports version `"0.1"`
- All layouts, blocks, bindings, and rules enumerated without reading validator code
- Golden spec validates against registry types (manual or type-check)
- `/api/schema` can be generated from registry modules (implemented in §3; types ready in §1)
- Team agrees this vocabulary fully covers Option A and documents the path to Options B & C

---

## 2. Validation Engine + `POST /api/validate`

**Purpose:** Accept a UI spec JSON payload; return success (with a **canonical normalized spec**) or a list of agent-actionable errors. Same engine powers `POST /api/specs` (§4).

**Why second:** This is the core hypothesis — agents must self-correct from stable, multi-error validation feedback.

**Rules source:** [§1 Rules & error codes](#rules--error-codes) — implement **R0–R24**.

---

### Decisions (locked for §2)

| Decision | Choice |
|----------|--------|
| Endpoint | `POST /api/validate` |
| Request body | **Raw spec JSON** (not wrapped in `{ spec: ... }`) |
| HTTP on validation failure | **200** + `{ valid: false, errors[] }` — semantic failures are not transport errors |
| HTTP on transport failure | **400** — invalid JSON, wrong Content-Type, empty body, body too large |
| Multiple errors | **Return all** findings in one response (cap **50**; if more, set `truncated: true`) |
| Error `path` root | **`""`** (empty string = document root; JSON Pointer / RFC 6901 convention) |
| Error `path` format | Bracket indices: `pages[0].children[1].binding.valuePath` |
| Planned types | **Pre-Zod gate** → `PLANNED_NOT_SUPPORTED` (not `UNKNOWN_TYPE`) |
| Invalid spec on failure | **Echo input unchanged** — no normalization until valid |
| Valid spec on success | Return **`normalizedSpec`** — deterministic order + canonical object key order |
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
    SpecSchema.safeParse (strict, from §1)              → R1–R9, R12–R13, R15–R18, R20, R23–R24 (+ mapped R6–R7)

Phase 4 — Semantic (custom)
    Only if phase 3 succeeded (parsed spec available) → R3–R4, R10–R11, R14, R17, R19, R21

Phase 5 — Normalize (success only)
    Canonical key order + deterministic sibling order   → normalizedSpec
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
| Spec envelope | `version`, `meta`, `navigation`, `pages` |
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

<body> = Spec JSON (§1 envelope)
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
  "normalizedSpec": { }
}
```

`normalizedSpec` is the canonical spec agents should treat as the validated artifact (use this for `POST /api/specs` in §4).

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

**R2 (envelope):** Missing required top-level key → `MISSING_REQUIRED_PROP` at the key path (e.g. `navigation`) or `""` if the root object is empty. Extra top-level key → `UNKNOWN_PROP` at that key (e.g. `foo`). Never emit `INVALID_ENVELOPE`.

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
| `VERSION_MISMATCH` | Spec version must be "0.1". | Set `version` to `"0.1"` to match the registry. |
| `DUPLICATE_ID` | Duplicate node id "{id}". | Each Page, Section, and block id must be unique across the entire spec. |
| `INVALID_ID_FORMAT` | Invalid id "{id}". | Use lowercase kebab-case: `^[a-z][a-z0-9-]*$`, 1–64 chars (e.g. `table-tickets`). |
| `UNKNOWN_TYPE` | Unknown node type "{type}". | Use Page, Section, Metric, Table, or Text for v0.1. |
| `MISSING_REQUIRED_PROP` | Missing required property "{prop}". | Add the property per the spec shape (top-level: `version`, `meta`, `navigation`, `pages`; see §3 schema when live). |
| `INVALID_PROP_TYPE` | Invalid value for "{prop}". | Check type and allowed enum values in the schema. |
| `UNKNOWN_PROP` | Unknown property "{prop}". | Remove extra properties; v0.1 uses strict schemas. |
| `EMPTY_PAGES` | Spec must include at least one page. | Add a `pages` array with one or more Page nodes. |
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
| `golden-valid.json` | §1 golden spec (any sibling order) | *(pass)* | — |
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

**Minimal v0.1 test scope:** assert `golden-valid.json` → pass + `normalizedSpec` stable; assert `wrong-version.json`, `duplicate-id.json`, `planned-form.json` → expected codes.

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

- [ ] Create `lib/validate/` tree per [module layout](#module-layout-1)
- [ ] `version.ts` → `VALIDATION_VERSION = "0.1"`
- [ ] `index.ts` exports `validateSpec`, types

### Step 2 — Transport (phase 1)

- [ ] `transport.ts` — parse JSON, 256 KB limit, object root check
- [ ] Map failures → `INVALID_JSON` at `path: ""`

### Step 3 — Planned gate (phase 2)

- [ ] `planned-gate.ts` — walk tree, compare to `PLANNED_BLOCKS` / `PLANNED_BINDINGS`
- [ ] Return early with `PLANNED_NOT_SUPPORTED` + hint

### Step 4 — Zod structural (phase 3)

- [ ] `SpecSchema.safeParse` from §1
- [ ] Add Zod refines: `ReadBinding.path` starts with `/` (R24), `valuePath` regex (R23), Metric `valuePath` required (R19)
- [ ] `zod-mapper.ts` — map all issues per [Zod mapping table](#zod-issue--stable-code-mapping)

### Step 5 — Semantic checks (phase 4)

- [ ] `semantic/ids.ts` — global uniqueness (R3), format (R4) via registry helpers
- [ ] `semantic/navigation.ts` — R10, R11
- [ ] `semantic/table.ts` — duplicate column keys (R17), filter field (R21)
- [ ] `semantic/nesting.ts` — R14 (if applicable)

### Step 6 — Normalize (phase 5)

- [ ] `normalize.ts` — sibling sorts + canonical key order per [normalization](#normalization-v01)
- [ ] Unit smoke: two specs differing only in sibling order → identical `normalizedSpec`

### Step 7 — Messages catalog

- [ ] `messages.ts` — `ERROR_CATALOG` from [message & hint catalog](#message--hint-catalog)
- [ ] `formatError(code, context)` for template interpolation

### Step 8 — Pipeline + fixtures

- [ ] `pipeline.ts` wires phases; caps errors at 50; stable sort of errors
- [ ] Copy fixtures into `lib/validate/fixtures/`
- [ ] Minimal script or test: golden pass; 3 invalid codes

### Step 9 — API route

- [ ] `app/api/validate/route.ts` — POST only; call `validateSpec`
- [ ] Return 200/400 per [API contract](#post-apivalidate--api-contract)

### Step 10 — Smoke on production

- [ ] `POST https://rapidui.dev/api/validate` with golden spec (manual body from `golden/support-dashboard.json`) → `valid: true` + `normalizedSpec`
- [ ] Invalid body → 400

### Step 11 — Commit

- [ ] Commit: `feat(validate): v0.1 pipeline, normalize, POST /api/validate`

---

### Deliverables

- [ ] `lib/validate/` module (pipeline, semantic, normalize, messages)
- [ ] `validateSpec()` — shared by `/api/validate` and §4
- [ ] `POST /api/validate` route with documented contracts
- [ ] `ERROR_CATALOG` for §3
- [ ] `normalizedSpec` on success (deterministic order)
- [ ] Fixture files + minimal smoke coverage
- [ ] R0–R24 implemented per rule map

### Done when

- Golden spec passes and `normalizedSpec` is stable across input order permutations
- Fixture invalid specs return expected `code` at expected `path` (minimal set: version, duplicate id, planned Form)
- Multi-error response returns several issues in one call (e.g. duplicate id + bad nav)
- `PLANNED_NOT_SUPPORTED` fires before `UNKNOWN_TYPE` for `Form` / `Button`
- §4 can import `validateSpec` without duplicating logic
- **Ready to start §3 Agent Documentation** (error catalog + real validator)

---

## 3. Agent Documentation

**Purpose:** Everything an external agent needs to produce valid specs without out-of-band instructions.

**Why third:** Write docs against a **real** validator and registry — avoids doc/implementation drift.

### Contents (outline)

- [ ] RapidUI overview (what it is / is not)
- [ ] Spec format overview
- [ ] Block reference
- [ ] Layout reference
- [ ] Binding reference
- [ ] Validation error catalog (codes → how to fix)
- [ ] Golden example spec(s) — support dashboard
- [ ] API usage (`POST /api/validate`, `POST /api/specs`)

### Delivery

- **Format:** JSON + markdown fragments served from Next.js API routes
- **Endpoints:** `GET /api/docs`, `GET /api/schema` (generated from registry where possible)
- **Base URL:** `https://rapidui.dev`

### Details to fill in later

- Doc structure and response shape for `/api/docs`
- Registry → schema generation vs hand-maintained schema
- Copy-paste system prompt or Cursor skill snippet for agents
- Claude test instructions (standalone, no Cursor context)

### Done when

- Fresh agent session with only docs + API base URL can attempt a spec for the support dashboard

---

## 4. Spec Store + `POST /api/specs`

**Purpose:** Persist validated specs and return an auditable receipt.

**Why fourth:** Trivial once validation works; completes the artifact loop.

### API (sketch)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/specs` | Validate (inline) + store spec; return id + receipt |
| GET | `/specs/:id` | Retrieve spec + receipt |

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

- Valid spec can be saved and fetched by id with receipt
- Invalid spec is rejected on write

---

## 5. Spec Viewer (optional)

**Purpose:** Minimal human inspection — not a renderer, not a dashboard.

**Why optional:** Useful for demos; not required to prove agent spec emission.

### Shows

- Raw spec JSON
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
- [ ] Pass/fail criteria: valid spec within ≤5 retries + required block checklist

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
│   ├── api/
│   │   ├── docs/route.ts       # §3 agent documentation
│   │   ├── schema/route.ts     # §1 vocabulary discovery
│   │   ├── validate/route.ts   # §2
│   │   └── specs/route.ts      # §4
│   └── specs/[id]/page.tsx     # §5 optional viewer
├── lib/
│   ├── registry/               # §1 vocabulary source of truth
│   ├── validate/               # §2 validation engine
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
| GET | `/api/docs` | §3 | Agent-readable documentation |
| GET | `/api/schema` | §1, §3 | Vocabulary / block discovery |
| POST | `/api/validate` | §2 | Validate spec; return errors or success |
| POST | `/api/specs` | §4 | Store validated spec + receipt |
| GET | `/api/specs/:id` | §4 | Retrieve spec + receipt |
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
| 0. Project Setup | ☐ | ☐ | Next.js, GitHub, Vercel, Postgres, rapidui.dev |
| 1. Vocabulary Registry | ☑ | ☐ | Spec complete — Option A; B/C planned |
| 2. Validation Engine | ☑ | ☐ | Spec complete — pipeline, normalize, /api/validate |
| 3. Agent Documentation | ☐ | ☐ | |
| 4. Spec Store | ☐ | ☐ | |
| 5. Spec Viewer | ☐ | ☐ | |
| 6. Agent Test Harness | ☐ | ☐ | |
