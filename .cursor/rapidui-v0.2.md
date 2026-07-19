# RapidUI v0.2 — Reference Document

Reference for planning and scoping v0.2. **Not** the implementation plan — use this to lock decisions, then derive phased implementation docs from each area.

**Status:** Reference complete — all product and architecture decisions locked, including **operations-first RUI schema** (greenfield redesign; v0.1 Page/Block model retired) and **eval philosophy** (§14). Implementation scaffolding lives in **[rapidui-v0.2-implementation.md](./rapidui-v0.2-implementation.md)** — expand one phase at a time.

**Related:**

- [rapidui-mvp-v0.1.md](./rapidui-mvp-v0.1.md) — product thesis (v0.1 proof)
- [rapidui-mvp-v0.1-implementation.md](./rapidui-mvp-v0.1-implementation.md) — v0.1 build record (complete)
- [rapidui-v0.2-implementation.md](./rapidui-v0.2-implementation.md) — **implementation plan** (phased scaffold; expand one phase at a time)

**Section map:** §1–2 thesis · §3 decisions · §4–5 architecture & routes · §6 use cases · §7 schema · §8 Logfire · §9 areas · §10–12 data & agents · §13 deferrals · **§14 eval harness & philosophy** · §15 ship · §16–19 wrap-up

---

## 1. What v0.1 Proved

v0.1 validated the core hypothesis: **external agents can discover RapidUI docs, emit RUIs, self-correct via validation, and save specs** — without repo context, on prod (`rapidui.dev`). Cursor, Claude, and Codex all passed the primary eval case.

**v0.1 artifact:** a validated, stored RUI + human inspector (`viewUrl`). No renderer, no operational dashboard, no own agent.

---

## 2. What v0.2 Proves

v0.2 shifts from *“agents can speak RUI”* to *“you can operate an agent-first platform”* — suitable for a portfolio conversation about enabling AI teams.

**Eval shift:** v0.1 asked *“can an agent produce a valid RUI?”* v0.2 adds *“can our own chat agent compete on quality and cost, through realistic multi-turn sessions, with evidence?”* See **§14 Eval philosophy**.

**Paradigm shift:** RUI specs are **operations-first workflow documents**, not component hierarchies. Agents identify what users need to **do** (browse, read, create, update, delete — plus embedded side effects such as approve/reject), wire **flows** between operations, and emit JSON that a future renderer compiles to real screens.

| Pillar | Name | Host | Interview story |
|--------|------|------|-----------------|
| **A** | RapidUI API v0.2 | Next.js · Vercel | Operations-first schema, agent docs, validate → save loop |
| **B** | RapidUI Agent v0.1 | FastAPI + Pydantic AI · Render | Building production-shaped agents in Python |
| **C** | RapidUI Observe v0.1 | Next.js · Vercel (same app) | API + agent telemetry, analytics, **eval lab** (model × prompt comparison) |

**Portfolio stack on display:** TypeScript / Next.js, Python / FastAPI, Postgres, AI agents, observability.

---

## 3. Locked Decisions (v0.2)

| # | Question | Decision |
|---|----------|----------|
| 1 | **App shape** | Single Next.js app on Vercel for API + human UI + Observe; separate Python service for RapidUI Agent |
| 2 | **Main page** | Split view: **left = chat** (RapidUI Agent only), **right = output** (inspector + JSON). No manual paste/validate without agent |
| 3 | **Visual output** | **RuiInspector** (operations + transitions view) + raw JSON. Full renderer deferred to **v0.3+** |
| 4 | **Spec pages** | Keep `/specs/:id` route; **rewrite** inspector for operations + transitions (§7) |
| 5 | **RUI schema goal** | **Entity-grouped operations** — `entities[]` + `operations[]` + `transitions[]` + explicit `outcomes`; renderer has **zero inference** |
| 6 | **Observe naming** | **`/observe/*`** on **`rapidui.dev`** — same domain as API and main UI |
| 7 | **Observe access** | **No auth** — Observe is a normal part of the site, not a gated admin product. Portfolio demo navigates freely between `/`, `/observe/*`, `/specs/*` |
| 8 | **Agent host** | **`agent.rapidui.dev`** on Render — chat API only; main UI on `rapidui.dev` calls it (CORS configured) |
| 9 | **Telemetry ownership** | **Platform code records events — never the LLM agent.** Next.js writes API events; **FastAPI handlers** (not Pydantic AI tools) write agent events. Pydantic AI **Logfire instrumentation** captures deep traces separately (see §4) |
| 10 | **External agents** | Supported via public API + **required session identity** (see #37); **demo Path B** — terminal Claude run → Observe session. Main page centers on RapidUI Agent |
| 11 | **Database** | **Neon Postgres** — shared DB for specs, events, agent runs. Observe dashboards read Neon directly from Next.js |
| 12 | **Repo layout** | **Monorepo** — one GitHub repo; Next.js at root (Vercel), Python agent in `/agent` (Render). See §4 monorepo rationale |
| 13 | **LLM model** | **Default `o4-mini`** via `OPENAI_API_KEY` — Responses API (`openai:o4-mini`); `reasoning_effort: medium`. Ship with this default; **confirm or change** via eval lab (Area 7 / stretch O5). Override via `RAPIDUI_AGENT_MODEL` |
| 14 | **Chat UI** | **assistant-ui** + `@assistant-ui/react-ai-sdk` + `@assistant-ui/react-markdown` — custom transport → `agent.rapidui.dev/chat`; **show o4-mini reasoning** (collapsible) + tool calls |
| 15 | **Telemetry write path** | **Unified ingest contract** — shared insert logic in Next.js; middleware in-process; FastAPI POSTs to `/api/observe/ingest/*` (see §4) |
| 16 | **API auth (v0.2)** | **Mock session identity** — not OAuth. **`X-RapidUI-Session-Id` required** on all agent API calls except **`GET /llms.txt`**. Missing session → **400** `MISSING_SESSION_ID`. Real agent auth (WorkOS / OAuth OBO) deferred to **v0.3+** (see §13). Observe + human UI remain open |
| 17 | **Logfire** | Env-gated on dev + Render; Observe for product dashboards — see §8 |
| 18 | **Eval scoring** | **Outcome:** deterministic checklist on final saved RUI. **Process:** turns, validate retries, tokens, latency. **Multi-turn:** scripted user (`conversationScript`) for RapidUI Agent evals. See §14 |
| 19 | **RUI version** | **`version: "0.2"` only** — no v0.1 backward compat. Rewrite goldens; prototype forward |
| 20 | **Navigation model** | **`entities[].entrypoints`** = sidebar nav per domain object. Sub-screens only via **`transitions`** (row, link, cta). Breadcrumb on `read` via `context.breadcrumb`. Modal deferred to v0.3 |
| 21 | **Neon setup** | **Fresh Neon database** — no Vercel Postgres migration |
| 22 | **Observe entry** | **`/observe` overview hub** — three zone cards (API live, Agent + Evals placeholders). Child routes: `/observe/api`, `/observe/agent`, `/observe/evals` |
| 23 | **Spec paradigm** | **Operations-first** — no `Page` / `Section` / block tree. Presentation layouts (`table`, `form`, `detail`, `confirm`) live inside operations |
| 24 | **Embedded actions** | **`act` and `delete` embedded** in `read.presentation.actions[]` on detail screens (option B). Full-screen ops use `transitions` with `trigger: link` |
| 25 | **Delete operation** | First-class **`delete`** type — `confirm` layout + `write.method: DELETE` |
| 26 | **Ingest hardening** | None in v0.2 |
| 27 | **Main UI demo UX** | **Use case starter chips** above chat — one-click demo prompts for UC1–3 (see Area 5) |
| 28 | **Charts** | **Deferred** — use `browse` + header metrics or `table`; no chart block in v0.2 |
| 29 | **Entity umbrella** | Operations group under **`entities[]`** — one entity per domain object (Users, Orders, Drafts). Scope selectors live on entity |
| 30 | **Spec = source of truth** | **Renderer implements the spec literally** — no inferred CTAs, routes, or post-mutation navigation. If it's not in the RUI, the renderer doesn't do it |
| 31 | **Outcomes required** | Every **mutating** operation and embedded action declares **`outcomes`** — success, error, cancel paths (explicit `transition.to` or `stay`) |
| 32 | **Explicit transitions** | **All** navigation is `transitions[]` — row, link, **cta** (e.g. browse → create). No renderer pairing heuristics |
| 33 | **Eval lab** | **`/observe/evals`** — model × prompt × use-case matrix; pass rate, cost, latency comparison. Script-driven (`npm run eval:matrix`); not a live playground in v0.2 |
| 34 | **Model shortlist** | **3–4 models max** for v0.2 matrix — e.g. `o4-mini`, `gpt-4.1-mini`, one quality-tier ceiling model. Document choice in `docs/model-selection-v0.2.md` |
| 35 | **Prompt variants** | Versioned in `agent/prompts/` (`v1`, `v2`, …) — test workflow emphasis vs validate-loop emphasis in eval lab |
| 36 | **Chat eval modes** | **`guided`** (scripted multi-turn, default for RapidUI Agent) + **`single-shot`** (one message, autonomy benchmark). External agents stay single-shot. See §14 |
| 37 | **Session identity (mock auth)** | **`X-RapidUI-Session-Id` required** on every agent API request **except** `GET /llms.txt`. Agent generates UUID once per session (or asks user). Same id on docs → schema → validate → save. **`X-RapidUI-Agent`** recommended, not required. This is **identification for Observe**, not cryptographic auth — v0.3 replaces with WorkOS-style agent tokens |
| 38 | **Unguarded discovery** | **`GET /llms.txt` only** — no session header; platform logs anonymous hit count. All other agent endpoints reject missing session |

---

## 4. Architecture

### Monorepo layout (one repo, two deploy targets)

This is a standard monorepo — **not** a nested “project inside Vercel.” One GitHub repository; each host deploys what it needs:

```txt
rapidui/                          ← single GitHub repo (portfolio)
├── app/                          ← Next.js (Vercel: root directory = .)
├── lib/
│   └── observe/                  ← shared insert/query logic (Neon)
├── agent/                        ← Python FastAPI (Render: root directory = agent/)
│   ├── pyproject.toml
│   ├── prompts/                  ← versioned system prompts (v1, v2, …)
│   ├── main.py
│   └── ...
├── eval/                         ← eval cases, score.ts
├── scripts/                      ← log-eval-run.ts, eval-matrix.ts
├── docs/                         ← model-selection-v0.2.md (eval lab results)
├── package.json
├── README.md
└── .cursor/
```

| Deploy | Host | URL | Root directory | What runs |
|--------|------|-----|----------------|-----------|
| Platform | **Vercel** | `rapidui.dev` | repo root | API, main UI, Observe |
| RapidUI Agent | **Render** | `agent.rapidui.dev` | `agent/` | FastAPI + Pydantic AI |

### Why monorepo fits this project

| Benefit | In practice |
|---------|-------------|
| **One portfolio artifact** | Single GitHub link — walk API → Observe → agent in one clone, no tab switching |
| **Coordinated changes** | Operations schema v0.2 + agent tools + docs update in **one PR** |
| **Shared contracts** | Event payload shapes, `session_id` rules, header names documented once; ingest JSON schema in repo |
| **One demo script** | README covers Neon, Vercel, Render, all use cases |
| **Right-sized scope** | Two deployables — no Turborepo/npm workspaces required; Vercel ignores `/agent`, Render ignores Next.js |

**When a monorepo would be wrong:** separate teams, independent release cycles, or open-sourcing the agent alone. None of that applies here — this is one portfolio product with two hosts.

**CORS:** `rapidui.dev` (browser) → `agent.rapidui.dev` (chat SSE) requires Render to allow the apex origin.

### Domains

```txt
rapidui.dev              ← platform (Vercel)
agent.rapidui.dev        ← RapidUI Agent chat API (Render)
www.rapidui.dev          ← redirect to apex (existing)
```

Main UI chat widget (`assistant-ui` → custom transport) calls `https://agent.rapidui.dev/chat` (Vercel AI Data Stream via Pydantic AI `VercelAIAdapter`). Agent calls `https://rapidui.dev/api/*` for validate/save/docs. Observe lives only on **`rapidui.dev/observe/*`** — no separate Observe domain.

### System diagram

```txt
                         ┌─────────────────────────────────────┐
                         │  rapidui.dev (Next.js · Vercel)      │
                         │                                      │
  External agents ──────►│  RapidUI API v0.2                    │
  (Cursor, Claude,       │    /api/validate · /api/specs         │
   Codex — terminal)     │    middleware → Neon (api_events)    │
                         │                                      │
  Human (demo) ─────────►│  Main UI  /  (rapidui.dev)          │
                         │    chat ◄──SSE── agent.rapidui.dev   │
                         │    inspector + JSON (right panel)    │
                         │                                      │
  Anyone ───────────────►                         │  Observe  /observe/*  (same domain)  │
                         │    /api · /agent · /evals (Area 7)   │
                         │    read Neon · no auth gate          │
                         │    /api/observe/ingest/*  (write API)│
                         └──────────────┬──────────────────────┘
                                        │
                                        ▼
                              Neon Postgres (shared)
                              specs · eval_runs · api_events
                              agent_runs · agent_turns
                                        ▲
                         ┌──────────────┴──────────────────────┐
                         │  agent.rapidui.dev (Render)          │
                         │    POST /chat · Pydantic AI          │
                         │    FastAPI → ingest + Logfire (OTel) │
                         └─────────────────────────────────────┘
```

### Telemetry write path (unified contract)

Two ways to write events were considered. **Locked approach:**

```txt
lib/observe/writes.ts          ← single source of truth (Zod-validated payloads)
        │
        ├── called in-process by Next.js middleware (api_events)
        ├── called by POST /api/observe/ingest/agent route handler
        └── (optional) POST /api/observe/ingest/api-event for external services

FastAPI on Render ──HTTP POST──► /api/observe/ingest/agent
                                 (same JSON schema as documented in agent/)
```

| Approach | Verdict |
|----------|---------|
| **Next.js middleware → shared `insertApiEvent()` in-process** | ✅ Hot path — no HTTP to self |
| **FastAPI → ingest HTTP API** | ✅ Cross-service contract; same schema as platform |
| **FastAPI → direct Neon** | ⚠️ Possible but duplicates insert logic in Python — avoid unless ingest is painful |
| **Both services invent their own SQL** | ❌ Schema drift risk |

**Interview line:** “Observe has an intake API like Datadog. The platform writes in-process; Render posts over HTTP. One schema, one Neon database, one dashboard.”

Ingest routes are **not user auth** — they are service-to-service write endpoints. Optional rate limiting later; no login anywhere in v0.2.

### Pydantic AI observability (what the framework gives you)

Pydantic AI is chosen partly to learn **production agent patterns**. Use two complementary layers:

#### Layer 1 — Logfire / OpenTelemetry (framework-native, deep traces)

Pydantic’s team ships **Logfire** — optional, built on OpenTelemetry:

```python
import logfire
from pydantic_ai import Agent

logfire.configure()                    # dev: Logfire UI; prod: optional OTLP
logfire.instrument_pydantic_ai()       # agent runs, model calls, tool spans
logfire.instrument_fastapi(app)        # HTTP /chat endpoint
logfire.instrument_httpx()             # outbound calls to rapidui.dev API
```

**Auto-captured without custom code:**

- Agent run duration and success/error
- Each **model request** — prompt/response metadata, **token usage**
- Each **tool call** — name, args, result, latency
- Streaming events

**Portfolio / learning value:** See what real agent platforms instrument. Mention in interviews: “I used Logfire during development; for the demo dashboard I aggregated key metrics into our own Observe store on Neon.”

**Recommendation:** Logfire **on in dev + Render** when `LOGFIRE_TOKEN` is set; graceful skip when missing. Full strategy in **§8**.

#### Layer 2 — Observe on Neon (portfolio dashboards)

Extract from **Pydantic AI run results** + FastAPI handler into `agent_runs` / `agent_turns`:

| Source | Fields |
|--------|--------|
| `result.usage()` | `input_tokens`, `output_tokens`, `requests` |
| `result.all_messages()` | turn count, tool-call count |
| FastAPI handler | `session_id`, `latency_ms`, `outcome`, `spec_id`, `validate_attempts` |
| Logfire spans (optional export) | fine-grained tool/model breakdown for drill-down |

FastAPI handler posts summary rows to **`POST /api/observe/ingest/agent`** after each turn/run — **not** the LLM.

#### Pydantic AI patterns to use in `/agent` (portfolio-relevant)

| Pattern | Use in RapidUI Agent |
|---------|----------------------|
| **`@agent.tool`** | `fetch_docs`, `fetch_schema`, `validate_rui`, `save_rui` — mirrors external agent workflow |
| **`RunContext[Deps]`** | Pass `session_id`, `http_client`, base URL — inject headers on every RapidUI API call |
| **Pydantic output models** | `ValidateResult`, `SavedSpec`, structured error list — type-safe validate loop |
| **`VercelAIAdapter`** | Pydantic AI UI adapter — encodes agent events as Vercel AI Data Stream SSE to main UI |
| **Message history** | Multi-turn: plan operations → clarify → map → fix validation errors |
| **`result.usage()`** | Token metrics for Observe |
| **System prompt** | Operations workflow + personality only — loaded from `agent/prompts/{version}.txt`; **no API/schema content**; agent must `fetch_docs` / `fetch_schema` like external agents |
| **Deps injection** | Testable tools; no globals |

**Do not** add Observe or Logfire configuration inside `@agent.tool` functions or system prompt — platform stays outside the agent loop.

### Telemetry flow

```txt
── API telemetry (all agents: external + ours) ──

Any agent ──► POST /api/validate | /api/specs
                    │  X-RapidUI-Session-Id, X-RapidUI-Agent, …
                    ▼
            Next.js route handler
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
  Response to agent        INSERT api_events → Neon
                                  │
                                  ▼
                           /observe/api (reads Neon)


── Agent telemetry (RapidUI Agent only) ──

Browser (rapidui.dev) ──► agent.rapidui.dev POST /chat
                    │
                    ▼
            Pydantic AI + tools
            (validate/save → rapidui.dev API only)
                    │                    ┌── Logfire traces (dev / optional prod)
                    ▼                    │
            FastAPI handler ─────────────┘
                    │
                    ▼
            POST rapidui.dev/api/observe/ingest/agent → Neon
                    │
                    ▼
            /observe/agent (reads Neon; join api_events by session_id)
```

**Rules:**

1. **LLM agent** (Pydantic AI tools): RapidUI API only — no Observe URLs, no telemetry in prompts.
2. **Next.js middleware**: `insertApiEvent()` → Neon in-process.
3. **FastAPI handlers**: summary metrics → ingest API; Logfire for deep traces.
4. **Observe UI**: `rapidui.dev/observe/*` — reads Neon, no auth.

### What FastAPI should collect (agent telemetry)

Recorded by the **FastAPI service layer** after each chat turn and when a generation run completes (save success or give-up):

**Per run (`agent_runs`) — one row when user goal resolves or session ends:**

| Field | Purpose |
|-------|---------|
| `session_id` | Correlate with `api_events` (same id sent as `X-RapidUI-Session-Id` on validate/save) |
| `started_at` / `finished_at` | Wall-clock duration |
| `outcome` | `saved` \| `failed` \| `abandoned` |
| `spec_id` | Final saved spec UUID, if any |
| `validate_attempts` | Count of `POST /api/validate` in this run |
| `model` / `provider` | e.g. `o4-mini` / `openai` |
| `prompt_version` | e.g. `v1` — for eval lab joins |
| `eval_case_id` | When run is part of eval matrix |
| `total_tokens` | Input + output if SDK exposes it |
| `latency_ms` | Total run time |
| `intent` | Optional short label (use case 1/2/3 or user summary) |
| `error_summary` | Last validation error codes or failure reason |

**Per turn (`agent_turns`) — one row per user message → assistant reply:**

| Field | Purpose |
|-------|---------|
| `run_id` | FK to `agent_runs` |
| `turn_index` | 0, 1, 2… |
| `latency_ms` | LLM + tool time for this turn |
| `input_tokens` / `output_tokens` | Cost / performance |
| `had_validate_call` | Did this turn trigger validate? |
| `had_save` | Did this turn complete with save? |

**Interview talking point:** “The agent doesn’t know it’s observed — telemetry lives in the HTTP layer, like middleware on a normal API.”

---

## 5. Platform Route Map (target)

```txt
rapidui.dev
├── /                          ← Main UI: chat (left) + inspector/JSON (right)
├── /specs/[id]                ← Operations inspector (rewrite of v0.1 block tree)
├── /observe                   ← Observe overview hub (API + Agent + Evals zones)
├── /observe/api               ← API analytics (validate/save telemetry)
├── /observe/agent             ← RapidUI Agent analytics (Phase 6; placeholder in Phase 3)
├── /observe/evals             ← Eval lab — model × prompt × case (Phase 7; placeholder in Phase 3)
│
├── /llms.txt                    ← Agent discovery (existing)
├── /api/docs                    ← Agent docs (existing, v0.2 updates)
├── /api/schema                  ← Operations vocabulary v0.2 (operationTypes, layouts, flowPatterns)
├── /api/validate                ← + telemetry middleware
├── /api/specs                   ← + telemetry middleware
├── /api/health                  ← existing
├── /api/observe/ingest/agent    ← FastAPI posts agent runs/turns
└── /api/eval/log                ← Optional: remote eval run logging

agent.rapidui.dev (Render — root directory `agent/`)
├── POST /chat                   ← SSE chat (CORS: rapidui.dev)
└── GET  /health
```

---

## 6. Portfolio Demo — Use Cases

Four demo scenarios in §6. **Cases 1–3** are required for v0.2 ship and are the **primary eval lab benchmarks** (§14). **Case 4** is optional but in scope.

### Use case matrix

| # | Name | Distinct skill | API wiring | AI-modern |
|---|------|----------------|------------|-----------|
| 1 | Static / describe data | Multi-operation layout from prose | No | — |
| 2 | CRUD admin | browse, read, create, update, delete | Yes | — |
| 3 | AI output review queue | Human-in-the-loop for AI | Yes | ✅ |
| 4 | Update existing spec | Edit large multi-operation RUI | Existing spec | — |

---

### Use case 1 — Static / copy-paste (no API wiring)

**User story:** Paste or describe data (CSV-like, JSON blob, prose requirements). No backend API connection.

**Agent behavior:** Clarify via chat → **identify operations and flows** → compose RUI → validate loop → save → preview on right panel.

**Operations emphasis:** `browse` (static table + optional header metrics), optional second `browse` or static summary. `data.mode: static`.

**Observe talking points:** Session timeline, validate retries, error codes cleared, time to valid spec.

**Status:** Defined.

**Golden reference (internal):** `lib/operations/golden/UC1-static-browse-v0.2.rui.json`

---

### Use case 2 — Operational CRUD admin (API wired)

**User story:** Paste API description — REST endpoints (list, get, create, update, delete). Agent produces admin UI as an **operation flow** wired to that API.

**Agent behavior:** Parse endpoints → plan operations (`browse`, `read`, `create`, `update`, `delete`) → wire `transitions` → validate → save.

**Operations emphasis:** one `ent-users` entity; explicit `route` per op; `browse` + filter; **`cta` transition** browse→create ("New User"); `row` browse→read; `link` read→update; `cancel` on forms; **`outcomes`** on create/update/delete/act; embedded delete on read with outcomes.

**Example shape:** Users admin — `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`.

**Observe talking points:** API events vs RapidUI Agent runs; validate retry curve.

**Status:** Defined. Depends on operations schema (§7).

**Golden reference (internal):** `lib/operations/golden/UC2-crud-admin-v0.2.rui.json`

---

### Use case 3 — AI output review queue

**User story:** Operational UI for **reviewing AI-generated outputs before they ship** — not generic CRUD, not static paste. Shows you design for **modern AI product workflows**.

**Example prompt:** *“Build an internal UI for reviewing AI-drafted support replies. Queue shows pending drafts with confidence score, model name, and source ticket. Reviewer can approve, reject, or request edits. Bind to GET /api/drafts, POST /api/drafts/{id}/approve, POST /api/drafts/{id}/reject.”*

**Why this case (portfolio):**

| vs Case 1 | vs Case 2 |
|-----------|-----------|
| Has real API + actions, not just layout | About **AI artifacts + human gate**, not resource CRUD |
| Shows operational product thinking | Distinct domain: trust, review, HITL |

**Operations shape in RUI:**

- **`op-inbox` (`browse`):** table — draft id, preview, model, confidence; static status filter; `transition` row → detail
- **`op-read-draft` (`read`):** detail sections for confidence, model, body; **embedded `actions`:** approve + reject (`act`)
- Optional: second `browse` entrypoint for rejected/audit queue

**Operations emphasis:** `browse` + filter, `read` + embedded `act`, transitions, `data.mode: api`.

**Observe talking points:** Multi-tool agent run (schema fetch → validate attempts → operation contracts); “this is how AI teams ship HITL UIs without writing React.”

**Alternatives considered (if we pivot):**

| Scenario | Pros | Cons |
|----------|------|------|
| **Prompt eval dashboard** | Very meta-AI | Less intuitive to non-AI interviewers |
| **RAG citation review** | Hot RAG topic | Heavier domain setup |
| **Agent handoff queue** | Similar to recommended | Less clearly “AI-native” |
| Generic approval queue (non-AI) | Simple | Doesn’t signal AI product focus |

**Status:** **Locked** for v0.2 — golden RUI + eval case `ai-review-queue-v0.2`.

**Golden reference (internal):** `lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json`

---

### Use case 4 — Update existing spec (optional, last demo)

**User story:** Start from an **existing, complex multi-operation RUI** (seed spec — e.g. HR ops: employees browse, onboarding create, time-off flows). User asks agent to **modify** it, not create from scratch.

**Example prompts:**

- *“Add a time-off requests browse operation with pending approvals and approve action on detail.”*
- *“Add a status filter to the employees browse operation.”*
- *“Add a create-employee operation as a new entrypoint.”*

**Agent behavior:**

1. Load existing RUI (`GET /api/specs/:id` or seed injected in context)
2. Apply surgical edits — preserve operation `id`s where possible
3. Validate loop → save **new** spec (always insert new row — good for audit)

**Why include (optional):**

- Proves agents handle **large specs** and **incremental operation changes** — real enterprise pattern
- Interview story: “Same platform as greenfield, but teams iterate on live specs”
- Observe shows higher validate attempt counts, diff in operation counts

**Requirements:**

- Seed golden RUI: `lib/operations/golden/UC4-hr-ops-seed-v0.2.rui.json` — multi-operation UI (~3–5 entrypoints/flows)
- Agent tool: **`load_spec(spec_id)`** — optional; ship only if UC4 is included in v0.2 build
- Docs note: editing existing RUIs, operation id stability, transition consistency

**UC4 implementation notes (resolve in implementation plan):**

- **Seed location:** `lib/operations/golden/UC4-hr-ops-seed-v0.2.rui.json` (internal reference — not in agent docs) + optional pre-seeded `specId` in demo docs
- **`load_spec` tool:** Pydantic AI tool wrapping `GET /api/specs/:id` — add in Area 4 only when UC4 is scheduled

**Status:** **In scope, optional** — schedule after cases 1–3. Not required for v0.2 ship. High interview value.

---

### Demo flow (portfolio)

**Path A — RapidUI Agent (main page)**

```txt
1. Open rapidui.dev/ — chat with RapidUI Agent (use case 1, 2, or 3)
2. Back-and-forth → valid spec in right panel (inspector + JSON)
3. Open /specs/:id from agent link
4. Open /observe/agent — run latency, retries, tokens, tool calls
5. Open /observe — overview hub, then /observe/api — same session_id
6. (Optional) Open /observe/evals — model × prompt matrix results (Area 7)
```

**Path B — External agent (terminal)**

```txt
1. Terminal: Claude (or Cursor/Codex) with eval prompt + X-RapidUI-* headers
2. Agent hits rapidui.dev validate → save
3. Open viewUrl — inspector
4. Open /observe/api — find session by id or agent type
```

**Path C — Optional: use case 4** — load seed spec → ask for modification → compare Observe validate attempts.

**Path D — Optional: Logfire** — open Logfire UI alongside Observe to show model/tool spans (see §8).

---

## 7. RUI v0.2 — Operations-First Schema

Design goal: RUI JSON is a **workflow specification** — what users do, how operations connect, and what data each operation needs. Agents think in **operations and flows**, not component trees. The v0.1 `Page` → `Section` → block model is **retired**; v0.2 is a greenfield schema.

**Renderer contract:** The RUI is the **complete behavioral specification**. The renderer compiles spec → UI **literally** — routes, transitions, outcomes, scope propagation. Platform may own visual chrome only (loading spinners, toast styling) — **never** navigation targets, CTAs, or post-mutation flow.

### Design principles

| Principle | Implication |
|-----------|-------------|
| **Operations first** | Spec reads as user intents (`browse`, `read`, `create`, …), not nested UI widgets |
| **Entity umbrella** | Operations for one domain object (Users, Orders) group under one **`entity`** — not a UI page |
| **Flows are explicit** | **Every** navigation edge is in `transitions[]` — row, link, **cta**; no renderer heuristics |
| **Outcomes are explicit** | Mutations declare **success / error / cancel** — where the user goes after create, save, delete, act |
| **Strict data contract** | Each operation declares `data.mode: static \| api` and required bindings |
| **Spec is source of truth** | Routes, scope selectors, CTAs, post-mutation paths — if it's not in the RUI, renderer does not do it |
| **Embedded actions (B)** | `act` and `delete` on detail screens live in `read.presentation.actions[]` with their own `outcomes` |
| **Agents must pass validation** | Every feature needs semantic rules + golden fixture |

### Top-level document shape

```json
{
  "version": "0.2",
  "app": { "title": "User Admin" },
  "entities": [],
  "operations": [],
  "transitions": []
}
```

| Field | Purpose |
|-------|---------|
| `app.title` | Application name |
| `entities[]` | Domain umbrellas — nav, scope selectors, operation membership |
| `operations[]` | Screen operations; each has `entityId`, `route`, and optional `outcomes` |
| `transitions[]` | **All** navigation — row, link, cta |

---

### Entity (umbrella for one domain object)

An **entity** groups every operation that acts on the same domain object — e.g. Users, Customer Orders, Drafts. This is **not** a UI page; it is the spec-level boundary for related workflows, shared scope, and nav.

**Why entities exist:**

- User pastes Users API + Orders API → two entities, each with its own operations and transitions
- Company/building selector applies to **all** operations in an entity (scope propagation)
- Agents plan per-entity: "what can you do with Users?" before composing operations

```json
{
  "id": "ent-users",
  "label": "Users",
  "entrypoints": ["op-browse-users"],
  "operationIds": [
    "op-browse-users",
    "op-read-user",
    "op-create-user",
    "op-update-user"
  ],
  "scope": {
    "selectors": [
      {
        "id": "companyId",
        "label": "Company",
        "type": "select",
        "required": true,
        "binding": {
          "read": {
            "method": "GET",
            "path": "/api/companies",
            "valuePath": "items",
            "labelKey": "name",
            "valueKey": "id"
          }
        }
      }
    ]
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | `ent-{name}`; unique |
| `label` | yes | Sidebar / nav label |
| `entrypoints` | yes | Operation ids shown in app nav for this entity (usually `browse`; may include `create` if separate nav item desired) |
| `operationIds` | yes | All operations belonging to this entity |
| `scope.selectors` | no | Pre-data filters (company, building, tenant) — values inject into child operation bindings via `{scope.companyId}` |

**Scope propagation:** When `scope.selectors` exist, child operation `read`/`write`/`invoke` paths and query params must reference scope placeholders explicitly, e.g. `GET /api/users?companyId={scope.companyId}`. Renderer does not auto-inject — paths must declare it.

**Single-entity apps** (UC3 Inbox): one entity with one entrypoint. **Multi-entity apps** (Users + Orders): multiple entities in `entities[]`.

---

### Operation types (v0.2 bounded set)

**Top-level operations** — entries in `operations[]`:

| Type | User intent | Presentation `layout` | `data` |
|------|-------------|-------------------------|--------|
| **`browse`** | See many records | `table` (+ optional `header.metrics`, `filter`) | `read` GET or `static` |
| **`read`** | See one record | `detail` (sections + fields + optional `actions[]`) | `read` GET or `static` |
| **`create`** | Add a record | `form` | `write` POST |
| **`update`** | Change a record | `form` | `read` + `write` PATCH |
| **`delete`** | Remove a record (standalone) | `confirm` — linked via `transition` | `write` DELETE |

**Embedded action types** — entries in `read.presentation.actions[]` only (option B):

| Type | User intent | Shape | `data` |
|------|-------------|-------|--------|
| **`act`** | Side effect (approve, reject, archive) | `{ id, type: "act", label, variant, invoke }` | `invoke` POST |
| **`delete`** | Remove from detail screen | `{ id, type: "delete", label, variant, confirm, write }` | `write` DELETE |

`act` is **never** a top-level `operations[]` entry. Prefer **embedded `delete`** on `read` for UC2; standalone `delete` operation only when the flow needs a dedicated confirm screen.

**Deferred:** charts, modals, row-inline actions, multi-step wizards, dynamic/API-driven filters, pagination, sort.

---

### Operation object (common fields)

```json
{
  "id": "op-browse-users",
  "type": "browse",
  "title": "Users",
  "params": [],
  "presentation": {},
  "data": {}
}
```

For `read` / `update` reached from a list, add `context.breadcrumb` (not on `browse` or `create` entrypoints):

```json
"context": {
  "breadcrumb": { "label": "Users", "operation": "op-browse-users" }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Stable id: `op-{name}`; unique across spec |
| `entityId` | yes | FK to `entities[].id` — which domain object this operation belongs to |
| `type` | yes | One of the types above |
| `title` | yes | Screen title |
| `route` | yes | URL path for renderer, e.g. `/users`, `/users/new`, `/users/{userId}`, `/users/{userId}/edit` |
| `params` | if route uses `{param}` | e.g. `["userId"]` — must match route placeholders |
| `context.breadcrumb` | on `read` / `update` reached via transition | `{ label, operation }` back to browse operation |
| `presentation` | yes | Layout-specific (see below) |
| `data` | yes | `mode: static \| api` + bindings |
| `outcomes` | on `create`, `update`, standalone `delete` | Required success/error/cancel navigation (see below) |

---

### Data contract (`data`)

#### Modes

| Mode | Meaning |
|------|---------|
| `static` | Inline values — no API bindings |
| `api` | Declarative bindings — executed by future renderer |

#### API bindings

| Binding | Used by | Shape |
|---------|---------|-------|
| `read` | `browse`, `read`, `update` (pre-fill) | `{ "method": "GET", "path": "/api/...", "valuePath": "items" }` |
| `write` | `create`, `update`, `delete` | `{ "method": "POST\|PATCH\|DELETE", "path": "/api/...", "bodyMap": {} }` |
| `invoke` | embedded `act` | `{ "method": "POST", "path": "/api/..." }` |

- Paths may include `{param}` placeholders — must match operation `params[]`
- `bodyMap`: `{ apiField: formFieldName }` for forms
- `static` mode: `records[]` for tables, `values{}` for metrics, or inline field values on detail

---

### Presentation layouts

#### `table` — `browse`

```json
"presentation": {
  "layout": "table",
  "columns": [
    { "key": "id", "label": "ID" },
    { "key": "email", "label": "Email", "format": "string" }
  ],
  "filter": {
    "field": "status",
    "label": "Status",
    "options": [{ "value": "active", "label": "Active" }]
  },
  "header": {
    "metrics": [
      { "key": "openCount", "label": "Open", "value": 42 }
    ]
  }
}
```

Column `format`: `string` | `number` | `date` | `badge` (optional).

#### `form` — `create` / `update`

```json
"presentation": {
  "layout": "form",
  "fields": [
    { "name": "email", "label": "Email", "type": "email", "required": true },
    { "name": "role", "label": "Role", "type": "select", "required": true,
      "options": [{ "value": "admin", "label": "Admin" }] },
    { "name": "notes", "label": "Notes", "type": "textarea" },
    { "name": "active", "label": "Active", "type": "checkbox", "default": true }
  ]
}
```

Field types: `text`, `textarea`, `email`, `number`, `select`, `checkbox`. Deferred: `date`, `multiselect`, `file`, `password`, `radio`.

#### `detail` — `read` (with embedded actions — option B)

```json
"presentation": {
  "layout": "detail",
  "sections": [
    {
      "title": "Summary",
      "fields": [
        { "key": "confidence", "label": "Confidence", "format": "number" },
        { "key": "model", "label": "Model" }
      ]
    },
    {
      "title": "Draft",
      "fields": [
        { "key": "body", "label": "Reply", "format": "text" }
      ]
    }
  ],
  "actions": [
    {
      "id": "op-approve",
      "type": "act",
      "label": "Approve",
      "variant": "primary",
      "invoke": { "method": "POST", "path": "/api/drafts/{draftId}/approve" }
    },
    {
      "id": "op-reject",
      "type": "act",
      "label": "Reject",
      "variant": "danger",
      "invoke": { "method": "POST", "path": "/api/drafts/{draftId}/reject" }
    },
    {
      "id": "op-delete-user",
      "type": "delete",
      "label": "Delete",
      "variant": "danger",
      "confirm": { "message": "Delete this user? This cannot be undone." },
      "write": { "method": "DELETE", "path": "/api/users/{userId}" }
    }
  ]
}
```

**Embedded actions (locked — option B):** `act` and `delete` on detail screens are declared in `read.presentation.actions[]`. They are typed operations with strict contracts; they do **not** appear in `entities[].entrypoints`.

Field `format` on detail: `string` | `number` | `text` (long content).

#### `confirm` — standalone `delete` (optional)

When delete is a full-screen confirm step (linked via transition) instead of embedded:

```json
{
  "id": "op-delete-user",
  "type": "delete",
  "title": "Delete user",
  "params": ["userId"],
  "presentation": {
    "layout": "confirm",
    "message": "Delete this user? This cannot be undone."
  },
  "data": {
    "mode": "api",
    "write": { "method": "DELETE", "path": "/api/users/{userId}" }
  }
}
```

Prefer **embedded delete in `actions[]`** on `read` for UC2; standalone `confirm` allowed when flow needs a dedicated step.

---

### Transitions (flows)

```json
{
  "from": "op-browse-users",
  "to": "op-read-user",
  "trigger": "row",
  "map": { "userId": "id" }
}
```

| Trigger | From → To | Use |
|---------|-----------|-----|
| `row` | `browse` → `read` or `update` | List row click; `map` binds column → target `params` |
| `link` | `read` → `update` or standalone `delete` | Edit control or delete confirm screen |
| `cta` | `browse` → `create` (or other) | **Explicit** toolbar/header button — e.g. "New User" on list. **Required** when list offers create |
| `cancel` | `create` / `update` → target | Cancel button on form — explicit back navigation |

**Nav entrypoints** (`entities[].entrypoints`) are **not** transitions — user lands there from sidebar. Everything else requires a `transitions[]` row.

Embedded `act` / `delete` use **`outcomes`** for post-mutation navigation — not `transitions[]`.

**Rules:**

- T1: `from` and `to` must reference existing operation `id`s
- T2: `trigger: row` only from `browse`
- T3: `map` keys ⊆ target `params`; values ⊆ source `columns[].key`
- T4: Operations unreachable from `entrypoints` via transitions → validator warning (orphan)

---


### Outcomes (mutations — required)

Every mutating operation (`create`, `update`, standalone `delete`) and every embedded `act` / `delete` in `actions[]` must declare **`outcomes`**. Renderer follows these exactly — no defaults.

```json
"outcomes": {
  "success": { "navigate": "op-browse-users" },
  "error":   { "stay": true },
  "cancel":  { "navigate": "op-browse-users" }
}
```

| Outcome | Shape | Meaning |
|---------|-------|---------|
| `success` | `{ "navigate": "<operationId>" }` | After successful POST/PATCH/DELETE/invoke |
| `error` | `{ "stay": true }` | Remain on current screen; show API/validation errors |
| `cancel` | `{ "navigate": "<operationId>" }` or `{ "stay": true }` | User dismisses form or confirm without saving |

**Forms (`create`, `update`):** must include `success`, `error`, and `cancel`. Link `cancel` via `transitions[]` with `trigger: cancel` **or** inline `outcomes.cancel`.

**Embedded delete / act:** `outcomes.success` required — typically `navigate` back to parent `browse`.

**Example — create user:**

```json
{
  "id": "op-create-user",
  "type": "create",
  "entityId": "ent-users",
  "route": "/users/new",
  "outcomes": {
    "success": { "navigate": "op-browse-users" },
    "error": { "stay": true },
    "cancel": { "navigate": "op-browse-users" }
  }
}
```

**Example — embedded approve:**

```json
{
  "id": "op-approve",
  "type": "act",
  "label": "Approve",
  "invoke": { "method": "POST", "path": "/api/drafts/{draftId}/approve" },
  "outcomes": {
    "success": { "navigate": "op-inbox" },
    "error": { "stay": true }
  }
}
```

---

### What each use case needs

| Use case | Operations | Transitions | Embedded actions |
|----------|------------|-------------|------------------|
| 1 Static | one or more `entities`; `browse` each | optional | — |
| 2 CRUD | one `entity`; `browse`, `read`, `create`, `update` | `row`, `link`, **`cta`**, `cancel` | embedded `delete` + `outcomes` on all mutations |
| 3 AI review | one `entity`; `browse`, `read` | `row` | `act`×2 + `outcomes` |
| 4 Spec update | existing + add/change ops | add/change transitions | add actions as needed |

---

### Reference: UC3 AI review queue (full shape)

```json
{
  "version": "0.2",
  "app": { "title": "Draft Review" },
  "entities": [
    {
      "id": "ent-drafts",
      "label": "Inbox",
      "entrypoints": ["op-inbox"],
      "operationIds": ["op-inbox", "op-read-draft"]
    }
  ],
  "operations": [
    {
      "id": "op-inbox",
      "entityId": "ent-drafts",
      "type": "browse",
      "title": "Inbox",
      "route": "/inbox",
      "presentation": {
        "layout": "table",
        "columns": [
          { "key": "id", "label": "ID" },
          { "key": "preview", "label": "Preview" },
          { "key": "model", "label": "Model" },
          { "key": "confidence", "label": "Confidence", "format": "number" }
        ],
        "filter": {
          "field": "status",
          "label": "Status",
          "options": [
            { "value": "pending", "label": "Pending" },
            { "value": "approved", "label": "Approved" }
          ]
        }
      },
      "data": {
        "mode": "api",
        "read": { "method": "GET", "path": "/api/drafts", "valuePath": "items" }
      }
    },
    {
      "id": "op-read-draft",
      "entityId": "ent-drafts",
      "type": "read",
      "title": "Review draft",
      "route": "/inbox/{draftId}",
      "params": ["draftId"],
      "context": { "breadcrumb": { "label": "Inbox", "operation": "op-inbox" } },
      "presentation": {
        "layout": "detail",
        "sections": [
          {
            "title": "Summary",
            "fields": [
              { "key": "confidence", "label": "Confidence", "format": "number" },
              { "key": "model", "label": "Model" }
            ]
          },
          {
            "title": "Draft",
            "fields": [{ "key": "body", "label": "Reply", "format": "text" }]
          }
        ],
        "actions": [
          {
            "id": "op-approve",
            "type": "act",
            "label": "Approve",
            "variant": "primary",
            "invoke": { "method": "POST", "path": "/api/drafts/{draftId}/approve" },
            "outcomes": {
              "success": { "navigate": "op-inbox" },
              "error": { "stay": true }
            }
          },
          {
            "id": "op-reject",
            "type": "act",
            "label": "Reject",
            "variant": "danger",
            "invoke": { "method": "POST", "path": "/api/drafts/{draftId}/reject" },
            "outcomes": {
              "success": { "navigate": "op-inbox" },
              "error": { "stay": true }
            }
          }
        ]
      },
      "data": {
        "mode": "api",
        "read": { "method": "GET", "path": "/api/drafts/{draftId}" }
      }
    }
  ],
  "transitions": [
    {
      "from": "op-inbox",
      "to": "op-read-draft",
      "trigger": "row",
      "map": { "draftId": "id" }
    }
  ]
}
```

### Reference: UC2 Users CRUD (transitions + outcomes excerpt)

```json
{
  "entities": [{
    "id": "ent-users",
    "label": "Users",
    "entrypoints": ["op-browse-users"],
    "operationIds": ["op-browse-users", "op-read-user", "op-create-user", "op-update-user"]
  }],
  "transitions": [
    { "from": "op-browse-users", "to": "op-read-user", "trigger": "row", "map": { "userId": "id" } },
    { "from": "op-browse-users", "to": "op-create-user", "trigger": "cta", "label": "New User", "placement": "toolbar" },
    { "from": "op-read-user", "to": "op-update-user", "trigger": "link", "label": "Edit" },
    { "from": "op-create-user", "to": "op-browse-users", "trigger": "cancel" },
    { "from": "op-update-user", "to": "op-read-user", "trigger": "cancel" }
  ]
}
```

`op-create-user` and `op-update-user` include `outcomes.success` → `op-browse-users` / `op-read-user` respectively; embedded `delete` on `op-read-user` includes `outcomes.success` → `op-browse-users`.

---

### Semantic validation rules (operation-centric)

| Rule | Check |
|------|-------|
| O1 | `version` must be `"0.2"` |
| O2 | Every `operation.id` unique |
| O3 | Every `transition.from/to` references existing operation |
| O4 | Every operation has valid `entityId`; `entities[].operationIds` lists all ops for entity |
| O5 | `trigger: row` only from `browse`; target has matching `params` |
| O6 | `map` values must match `browse.presentation.columns[].key` |
| O7 | `api` mode: required binding present per type |
| O8 | `static` mode: no API bindings |
| O9 | `{param}` in paths ⊆ operation `params` |
| O10 | Form fields: unique `name`; `select` has `options`; `bodyMap` keys ⊆ field names |
| O11 | Embedded `actions[]`: only on `read`; paths use host `params`; types `act` \| `delete` only |
| O12 | `delete`: `write.method` must be `DELETE` |
| O13 | `context.breadcrumb.operation` must reference reachable `browse` or entrypoint |
| O14 | Orphan operations → warning |
| O15 | Every operation has `entityId`, `route`; params match route placeholders |
| O16 | `create`/`update`/standalone `delete` have `outcomes.success`, `outcomes.error`, `outcomes.cancel` (cancel optional on delete confirm) |
| O17 | Embedded `act`/`delete` in `actions[]` have `outcomes.success` and `outcomes.error` |
| O18 | If `browse` + `create` exist in same entity, `transitions` must include `trigger: cta` browse→create |
| O19 | `scope.selectors` placeholders appear in affected operation bindings as `{scope.<id>}` |
| O20 | `transitions.trigger` ∈ `row`, `link`, `cta`, `cancel` only |

Errors reference **operation id** and **transition**, not nested block paths.

---

### Agent workflow (internal + external)

Same steps for RapidUI Agent and terminal agents. Internal agent system prompt carries **personality + this workflow only** — zero API paths or schema excerpts.

```txt
1. DISCOVER (unguarded)
   GET /llms.txt  — no session required; read session identity rules

2. ESTABLISH SESSION (required before any other API call)
   Generate UUID once per agent session (or ask user to confirm)
   Send X-RapidUI-Session-Id on every subsequent request

3. DISCOVER (guarded — session required)
   GET /api/docs → GET /api/schema
   (RapidUI Agent: fetch_docs, fetch_schema tools — same session header)

4. PLAN OPERATIONS
   From user message: list operations + ideal/edge flows
   Clarify missing contract fields (endpoints, fields, which ops incl. delete?)

5. MAP → RUI
   Per entity: scope selectors, operationIds, entrypoints
   Per operation: type, route, presentation, data.mode, bindings, outcomes
   Wire transitions (incl. cta, cancel); embed act/delete in read.actions[]

6. VALIDATE
   POST /api/validate — fix errors using code/hint/path (≤5 retries target)

7. SAVE
   POST /api/specs — share viewUrl; inspector loads on right panel
```

**Information split:**

| Source | Teaches |
|--------|---------|
| Platform docs + schema | **How** — operation types, layouts, contracts, validation |
| User / eval prompt | **What** — domain, endpoints, workflows |
| Validate API | **Whether** — pass/fail + fixes |

---

### `/api/schema` response shape (target)

```json
{
  "version": "0.2",
  "entities": {},
  "operationTypes": {},
  "presentationLayouts": {},
  "transitionTriggers": ["row", "link", "cta", "cancel"],
  "dataModes": ["static", "api"],
  "embeddedActionTypes": ["act", "delete"],
  "flowPatterns": {
    "crud": "browse → read → update; create entrypoint; delete embedded",
    "hitlReview": "browse → read + embedded act",
    "staticDashboard": "browse static + header metrics"
  },
  "examples": {}
}
```

Agent docs (`/api/docs`) lead with **operation types and flow patterns**, not component nesting.

---

### Inspector v0.2 (target)

RuiInspector shows **operations-first** view:

- Operation list grouped by type
- Transition list (from → to, trigger, map)
- Data contract chips per operation (`static` / API paths)
- Embedded actions nested under host `read`

Not a faux Page/Section component tree.

---

### Use case variants (eval + demo)

Users phrase requests differently. Starter chips use **canonical** phrasing; evals include variants. Guided evals use **`conversationScript`** to answer clarifying questions (V6) or reject bad proposals (V4) — see §14.

| Variant | Example | Agent must |
|---------|---------|------------|
| V1 Minimal API | *"GET/POST/PATCH/DELETE /users"* | Infer full CRUD operations |
| V2 List-only | *"read-only user list"* | `browse` only |
| V3 Prose + data | *"here's CSV… make a dashboard"* | `browse` static + metrics |
| V4 Wrong pattern | *"approve from table row"* | Reject → embedded `act` on detail |
| V5 Over-scoped | *"add charts"* | Defer → table + metrics |
| V6 Vague | *"admin for support"* | Clarify API vs static |

---

### Explicitly out of scope (v0.2 schema)

| Feature | Why defer |
|---------|-----------|
| Renderer / live API execution | Inspector only; bindings declarative |
| **Charts** | Use table + header metrics |
| Modals | Full-screen detail routes |
| Row-inline actions | Detail + embedded `actions[]` |
| Dynamic/API-driven filters | Static options only |
| Pagination / sort | Not needed for demo |
| Multi-step wizards | Single form per create/update |
| Query params / request headers | v0.3+ |
| v0.1 RUI `version` | `"0.2"` only — full rewrite |

---

## 8. Logfire & Production Agent Observability

Two layers serve **different audiences** — use both for “production-ready agent” story:

| Layer | Tool | Audience | Demo role |
|-------|------|----------|-----------|
| **Engineering traces** | Logfire (Pydantic OTel) | You / technical interviewer | “How I debug agent runs in prod” |
| **Product analytics** | Observe (Neon dashboards) | Product / platform story | “How we track agent outcomes at scale” |

### Recommendation: env-gated, dev + Render (not dev-only)

```python
# agent/main.py — before Agent() construction
if os.getenv("LOGFIRE_TOKEN"):
    logfire.configure(service_name="rapidui-agent")
    logfire.instrument_pydantic_ai()
    logfire.instrument_fastapi(app)
    logfire.instrument_httpx()
```

| Environment | Logfire | Observe ingest |
|-------------|---------|----------------|
| **Local dev** | ON when `LOGFIRE_TOKEN` set | ON (local or prod API) |
| **Render (`agent.rapidui.dev`)** | ON when token set | ON always |
| **Token missing** | Skip instrumentation; agent still runs | Still post summaries to Observe |

**Why not dev-only:** “Production-ready” means instrumentation **ships with the deployed agent**, gated by env — not a laptop-only debug trick.

**Why not Logfire-only:** Observe proves you built **product observability** (Postgres, dashboards, cross-agent API metrics). Logfire proves you know **ecosystem-standard agent tracing**.

### What Logfire captures automatically

- Agent run spans (duration, success/error)
- Each LLM request (model, tokens, latency)
- Each `@agent.tool` call (name, args, result)
- HTTPX calls to `rapidui.dev` (validate/save latency)

### What we add manually (production patterns)

```python
with logfire.span("rapidui.run", session_id=session_id, use_case=intent):
    result = await agent.run(...)
logfire.info("run_complete", spec_id=spec_id, validate_attempts=n)
```

Custom attributes tie Logfire traces to **Observe `session_id`** — interviewer can correlate both UIs.

### What still goes to Observe (FastAPI handler, not LLM)

Aggregates for dashboards — extracted from `result.usage()` + handler timing:

- `agent_runs` / `agent_turns` rows via ingest API
- Not a duplicate of every Logfire span — summary rows only

### Interview talking points

1. “Agent tools never call telemetry — FastAPI handler posts summaries; Logfire instruments via OTel.”
2. “Logfire is optional at runtime but enabled in production on Render — graceful fallback without token.”
3. “Two layers: traces for debugging, Observe for pass rates and validate retry analytics.”

### Demo usage (Path D)

During a live demo, optionally open Logfire in a second tab for one run — show tool spans for `validate_rui` retries. Primary demo stays **Observe on rapidui.dev**; Logfire is depth for technical questions.

---

## 9. Work Areas (Implementation Sequence)

Build in dependency order. **Phased checklists and open questions:** [rapidui-v0.2-implementation.md](./rapidui-v0.2-implementation.md). This section summarizes scope; the implementation doc is where agents expand detail per phase.

### Sequence overview

```txt
Area 0  Infra (Neon, agent/, ingest scaffold, CORS)
   │
   ├─► Area 1  API telemetry (api_events, headers, eval wrappers, agent ingest route)
   │      │
   │      ├─► Area 2  Operations schema + docs + goldens + eval cases  ◄── critical path
   │      │      │
   │      │      ├─► Area 4  RapidUI Agent (needs schema + ingest)
   │      │      │      │
   │      │      │      └─► Area 5  Main UI + operations inspector
   │      │      │
   │      │      └─► Area 5 also depends on Area 2 (inspector renders ops)
   │      │
   │      └─► Area 3  Observe API dashboard
   │             │
   │             └─► Area 6  Observe Agent dashboard (needs Area 4)
   │
   └─► Area 7  Polish + eval lab (after 1–6)
```

| Order | Area | Operations-first touchpoints |
|-------|------|------------------------------|
| 1 | **0** | Monorepo + Neon; no schema work yet |
| 2 | **1** | Telemetry headers for evals; agent ingest route |
| 3 | **2** | **Greenfield** — `lib/operations/*`, validator rewrite, ops docs, goldens, eval cases |
| 4 | **3** | Observe API (agent-agnostic) |
| 5 | **4** | Agent system prompt = operations workflow only; same tools as external agents |
| 6 | **5** | Operations inspector rewrite; starter chips for UC1–3 |
| 7 | **6** | Agent run metrics |
| 8 | **7** | Manual evals, **eval lab** (model matrix + `/observe/evals`), model selection doc |

**Recommended build order:** `0 → 1 → 2 → 4 → 5` in parallel with `3`; then `6 → 7`. Eval lab runs in Area 7 after agent + Observe are live — do not block Areas 4–6 on matrix completion.

---

### Area 0 — Planning & infra baseline

**Purpose:** Fresh Neon; monorepo scaffold; `agent.rapidui.dev` on Render.

**Scope:**

- **Fresh Neon** project + `DATABASE_URL` on Vercel (no Vercel Postgres data migration)
- Replace `@vercel/postgres` with Neon driver
- Run migrations on empty DB (`specs`, `eval_runs`, `api_events`, `agent_runs`, `agent_turns`)
- Add `agent/` skeleton; Render root dir = `agent/`
- DNS: `agent.rapidui.dev` → Render
- CORS on Render for `https://rapidui.dev`
- Ingest route scaffold: `POST /api/observe/ingest/agent` (handler stub + shared `lib/observe/writes.ts`)

**Outputs:** Updated `.env.example`, migration path, `agent/README.md`

**Depends on:** Nothing

**Unlocks:** All other areas

---

### Area 1 — API telemetry foundation

**Purpose:** Platform-side event collection for **all agents** hitting validate/save.

**Scope:**

- `api_events` table in Neon
- **`POST /api/validate`** and **`POST /api/specs`** → **`insertApiEvent()`** in `lib/observe/` (in-process Neon write)
- **`GET /api/docs`**, **`GET /api/schema`**, **`GET /api/health`** → discovery telemetry (Phase 3B)
- **Session gate:** **`requireSessionId(request)`** on all agent API routes except **`GET /llms.txt`** — returns 400 `MISSING_SESSION_ID` when absent (Phase 3B)
- Request headers (document in `/api/docs`, **`GET /llms.txt`**, eval wrappers):
  - **`X-RapidUI-Session-Id`** — **required** after discovery (UUID per agent session)
  - **`X-RapidUI-Agent`** — recommended (`rapidui-agent` | `cursor` | `claude` | `codex` | …)
  - **`X-RapidUI-Eval-Case`** — eval runs only
  - **`X-RapidUI-Intent`** — optional short label
- Optional: `POST /api/eval/log` (scores + inserts `eval_runs`)

**Does not include:** Observe UI, agent service (FastAPI), operations schema

**Unlocks:** Area 3 (Observe API dashboard), external-agent demo (Path B)

---

### Area 2 — Operations schema v0.2 + agent docs

**Purpose:** Greenfield **operations-first** RUI vocabulary for use cases 1–4.

**Scope:**

- **Remove** v0.1 Page/Block registry (`lib/registry/blocks.ts`, `planned.ts`, etc.)
- **Add** `lib/operations/*` — Zod schemas for `entities[]`, `operations[]`, `transitions[]`, `outcomes`, `app`, presentations, embedded actions
- Bump schema version → `"0.2"`; **reject v0.1** documents at validate
- Semantic rules O1–O20 per §7; operation-centric error messages (`operationId`, `transition`)
- Rewrite `lib/validate/*` from scratch
- Golden RUIs in `lib/operations/golden/` — one per use case; filenames prefixed `UC1`–`UC4` (e.g. `UC2-crud-admin-v0.2.rui.json`)
- Eval case JSON: `static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2`, optional `spec-update-v0.2` — each with `mode`, `prompt`, optional **`conversationScript`** (guided), `successCriteria` (§14)
- Extend `eval/score.ts` — outcome checklist + optional process caps (`maxUserTurns`, `maxRetries`, …)
- Rewrite agent-facing docs: `llms.txt`, `/api/docs`, workflow, overview — **operations-first** (§7)
- Update `GET /api/schema` — `operationTypes`, `presentationLayouts`, `flowPatterns`, `embeddedActionTypes`

| Component | v0.2 scope (see §7) |
|-----------|---------------------|
| **Top-level operations** | `browse`, `read`, `create`, `update`, `delete` (standalone confirm) |
| **Entities** | `entities[]` — `operationIds`, `entrypoints`, optional `scope.selectors` |
| **Embedded actions** | `act`, `delete` in `read.presentation.actions[]` with `outcomes` |
| **Presentations** | `table`, `form`, `detail`, `confirm` |
| **Transitions** | `row`, `link`, **`cta`**, **`cancel`** |
| **Outcomes** | Required on all mutations |
| **Data contracts** | `static` \| `api`; read/write/invoke/delete bindings |
**Outputs:** Operations schema, validator, golden RUIs, eval cases, updated `/api/schema`, rewritten agent docs

**Depends on:** Area 0 (Postgres stable)

**Unlocks:** Use cases **1–3** (+ optional 4), all v0.2 eval cases, Area 4/5 meaningful output

---

### Area 3 — Observe: API dashboard

**Purpose:** Analytics for how **all agents** interact with RapidUI API.

**Route:** `/observe` overview hub + **`/observe/api`** detail dashboard + **`/observe/api/sessions/[sessionId]`** drill-down. **`/observe/agent`** and **`/observe/evals`** placeholder scaffolds in Phase 3; full metrics in Areas 6–7.

**Metrics (MVP — Phase 3 implementation plan):**

- **Hub:** API zone live stats; Agent + Evals placeholder cards (eval pass-rate teaser on hub/evals page only — not on API dashboard)
- **API dashboard:** Recent sessions table (hero), validate success rate, specs saved, avg tries before save, top error codes, saves by agent, requests by day
- **3B add:** Discovery hits by endpoint, session funnel (llms → docs → schema → validate → save), full session timeline including GET discovery
- **Filters:** `?agent=`, `?evalCase=`, `?session=` on `/observe/api`

**Data sources:** `api_events` (primary); `eval_runs` (hub/evals teaser only); `specs` (via `spec_id` links)

**Depends on:** Area 1

---

### Area 4 — RapidUI Agent v0.1 (`agent/` · Render)

**Purpose:** Own conversational agent that generates RUIs via the public RapidUI API.

**Location:** `agent/` in monorepo — Render deploy with root directory `agent/`.

**Stack:** FastAPI + Pydantic AI + Logfire; default **`o4-mini`** (Responses API, `reasoning_effort: medium`, reasoning summaries for chat UI). Model swappable via `RAPIDUI_AGENT_MODEL`.

**Behavior:**

- Multi-turn chat; use cases 1–4
- **Operations-first workflow:** plan operations → map to RUI → validate → save (§7)
- **System prompt:** personality + operations workflow only — no API/schema content (§11); load from `agent/prompts/{version}.txt` via `RAPIDUI_AGENT_PROMPT_VERSION`
- Optional demo UX: print brief **operations plan** in chat before composing JSON
- Pydantic AI **tools**: `fetch_docs`, `fetch_schema`, `validate_rui`, `save_rui`, optional `load_spec`
- **`RunContext[Deps]`** — `session_id`, httpx client, `RAPIDUI_BASE_URL`
- **`VercelAIAdapter`** on `POST /chat` — encodes agent stream as Vercel AI Data Stream SSE for main UI
- Sends `X-RapidUI-Agent: rapidui-agent` + session id on RapidUI API calls

**Observability:**

- **Logfire:** `instrument_pydantic_ai`, `instrument_fastapi`, `instrument_httpx` (dev learning)
- **Observe:** FastAPI handler → `POST rapidui.dev/api/observe/ingest/agent` with `result.usage()`, turn metadata

**Deployment:** Render at `agent.rapidui.dev`; env: `OPENAI_API_KEY`, `RAPIDUI_BASE_URL`, optional `LOGFIRE_TOKEN`, optional `RAPIDUI_AGENT_MODEL` (default `openai:o4-mini`), optional `RAPIDUI_AGENT_PROMPT_VERSION` (default `v1`)

**Depends on:** Area 1 (telemetry + **agent ingest route**), Area 2 (operations schema + docs)

---

### Area 5 — Main UI (chat + inspector split)

**Purpose:** Portfolio demo surface — replaces current link-hub homepage.

**Scope:**

- **Rewrite `RuiInspector`** — operations list, transitions, data contract chips, embedded actions under `read` (§7); not v0.1 block tree
- Split layout: chat (left) + operations inspector + JSON (right)
- Use case starter chips — canonical prompts for UC1–3 (§6)
- On save: right panel loads spec from `GET /api/specs/:id`
- Footer or nav link to `/observe/*` (optional polish — api, agent, evals)

**Layout:**

```txt
┌──────────────────────────┬──────────────────────────┐
│  Chat (RapidUI Agent)    │  Output panel             │
│  - streaming messages    │  - RuiInspector (top)     │
│  - reasoning (collapsed) │  - operations + transitions│
│  - tool call steps       │  - JSON spec (bottom)     │
│  - use case starter chips│                           │
│  - free-form input       │                           │
└──────────────────────────┴──────────────────────────┘
```

**Use case starter chips (demo UX):** Clickable prompts above the chat input — one per use case (1–3), pre-fill or send a canonical demo prompt. Reduces friction in interviews; not a separate agent mode.

**Chat stack:**

| Layer | Choice |
|-------|--------|
| UI components | **assistant-ui** (`@assistant-ui/react`) |
| Runtime | **`useChatRuntime`** from `@assistant-ui/react-ai-sdk` — transport points at `agent.rapidui.dev` (no Next.js `/api/chat` proxy) |
| Markdown | **`@assistant-ui/react-markdown`** — streaming message rendering |
| Reasoning | **Collapsible reasoning blocks** — `MessagePrimitive.GroupedParts` / `ReasoningRoot`; stream o4-mini reasoning summaries alongside assistant text |
| Tool calls | **ToolFallback** — surface `validate_rui`, `save_rui`, etc. in thread |
| Stream protocol | **Vercel AI Data Stream** — matched by Pydantic AI `VercelAIAdapter` on FastAPI |

**Wiring:** Chat → `https://agent.rapidui.dev/chat` (Vercel AI Data Stream SSE). On save, right panel loads spec from `GET /api/specs/:id`.

**Does not include:** Manual JSON editor, external agent chat, renderer, chat file attachments (text paste for UC1)

**Depends on:** Area 4 (agent), Area 2 (operations schema + **inspector data model**)

---

### Area 6 — Observe: Agent dashboard

**Purpose:** Analytics focused on **RapidUI Agent** performance.

**Route:** `/observe/agent` (rapidui.dev — no auth)

**Metrics (MVP):**

- Runs over time; success vs failed saves
- p50 / p95 latency per run
- Validate attempts per successful save
- Tokens per run (`result.usage()`)
- Tool calls per run (from Logfire or turn metadata)
- Outcomes by use case / intent / **model** / **prompt_version**
- Drill-down: join `api_events` by `session_id`; link to **`/observe/evals`** for matrix context

**Depends on:** Area 4 (agent_runs data), Area 3 (link from `/observe/api` to agent view)

---

### Area 7 — Polish, eval lab & portfolio packaging

**Purpose:** Interview-ready repo, demo reliability, and **evidence-based model selection** for RapidUI Agent.

**Scope:**

- README v0.2: operations-first architecture, demo script (Path A/B), env setup
- Manual eval runs: RapidUI Agent + external agents on `static-browse-v0.2`, `crud-admin-v0.2`, `ai-review-queue-v0.2` with Observe headers
- At least one **use case variant** per UC (§7) — log to `eval_runs`
- Retire `support-dashboard-v0.1.json`; update `eval/manual/wrapper_*.txt` for v0.2 + headers
- Smoke tests: operations schema validate, telemetry insert, Observe queries, agent health
- Architecture diagram in docs
- `npm run eval:prompt` scripts aligned to new eval case ids

**Eval lab (model × prompt × use case):**

- Extend `eval_runs` with `model`, `provider`, `prompt_version`, `reasoning_effort`, `eval_mode` (`guided` | `single-shot`), token counts, `estimated_cost_usd`, `user_turns`, `validate_attempts`, `latency_ms` (see §14)
- Version system prompts in `agent/prompts/v1.txt`, `v2.txt`, … — load via env `RAPIDUI_AGENT_PROMPT_VERSION`
- Script `npm run eval:matrix` — loops eval cases × model shortlist × prompt versions; posts results to `eval_runs` (and optional `POST /api/eval/log`)
- **`/observe/evals`** dashboard — grouped comparison table: pass rate, avg tokens, avg validate retries, avg latency, est. cost per successful save
- **`docs/model-selection-v0.2.md`** — results + chosen default model + prompt (includes spot-check notes from conversation rubric)
- Human spot-check rubric (2–3 runs per matrix cell) for subjective conversation quality — notes in model-selection doc, not automated

**Depends on:** Areas 1–6 substantially complete

---

## 10. Data Model (sketch)

Extend v0.1 tables; finalize columns in implementation plan.

### Existing (v0.1)

| Table | Purpose |
|-------|---------|
| `specs` | Saved RUIs |
| `eval_runs` | Eval outcomes + eval lab matrix results (§14 extensions) |

### New (v0.2)

| Table | Purpose | Written by |
|-------|---------|------------|
| `api_events` | Per-request API telemetry | `insertApiEvent()` — middleware, in-process |
| `agent_runs` | RapidUI Agent session summary | Ingest API ← FastAPI handler |
| `agent_turns` | Per chat turn | Same ingest |

### `api_events` (from v0.1 Phase 2 design — baseline)

```sql
-- Sketch; finalize in Area 1 implementation section
CREATE TABLE api_events (
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
```

### `eval_runs` extensions (v0.2 — sketch)

```sql
-- Add to eval_runs; finalize in Area 1 / 7
-- eval_mode, model, provider, prompt_version, reasoning_effort,
-- user_turns, validate_attempts, tokens_in, tokens_out,
-- estimated_cost_usd, latency_ms, score_details (JSON)
```

See §14 for column purposes and scoring rules.

---

## 11. RapidUI Agent — Constraints

| Pydantic AI agent (tools + LLM) | FastAPI platform layer |
|--------------------------------|------------------------|
| Tools call RapidUI API only | Calls `/api/observe/ingest/agent` after turns |
| `RunContext` carries `session_id`, headers | Configures Logfire instrumentation |
| `run_stream()` to browser | Maps `result.usage()` → Observe payload |
| Multi-turn history for clarify/fix | Never exposes ingest URLs to LLM |

| Never in agent tools / system prompt |
|--------------------------------------|
| Observe or ingest URLs |
| Logfire configure calls inside tools |
| Bypass validation |
| API paths, schema excerpts, or block definitions (must use `fetch_docs` / `fetch_schema`) |

**System prompt must include:** operations-first workflow (plan ops → map → validate → save) and personality only.

---

## 12. External Agents (Cursor, Claude, Codex)

First-class API consumers — visible in **Observe API dashboard** when headers are sent.

| Aspect | Approach |
|--------|----------|
| Discovery | Same `llms.txt` → `/api/docs` → `/api/schema` |
| Testing | Terminal on local machine (Claude Code, Cursor, Codex) |
| Telemetry | **`X-RapidUI-Session-Id` required** (after reading llms.txt) + recommended **`X-RapidUI-Agent`** — document in llms.txt, `/api/docs`, eval wrappers |
| Observe | **`/observe/api`** — session timeline, retries, errors, spec_id (no `/observe/agent` rows) |
| Demo | **Path B** — terminal agent run → viewUrl → find session in Observe |
| Eval | **`single-shot`** harness + v0.2 cases; operation-aware `successCriteria`. Same outcome checklist as RapidUI Agent; no `conversationScript` (§14) |

**Interview line:** External agents prove the API is agent-agnostic; RapidUI Agent proves we can ship our own; Observe ties both together via `session_id`.

---

## 13. Deferred to v0.3+

| Feature | Why defer |
|---------|-----------|
| React / native **renderer** + `appUrl` | Large product leap; inspector sufficient for v0.2 |
| Live API execution from rendered UI | Requires renderer |
| MCP server | Out of scope |
| API keys / multi-tenancy | Not needed for portfolio — **v0.3:** WorkOS AuthKit / OAuth OBO for agents |
| LLM judge for semantic eval | Deterministic checklist + human spot-check sufficient |
| Chat file attachments | Text paste in chat sufficient for UC1; drag-drop upload deferred |
| Interactive eval playground (live model switch in UI) | Script + `/observe/evals` table enough for v0.2 |
| Full auth system | Observe is public on same domain |
| **Detail as modal** | v0.3 renderer — v0.2 uses full-screen detail routes |
| **Charts** | Use `browse` + header metrics; no chart layout in v0.2 |
| **v0.1 RUI version** | `"0.2"` only — no dual validation; Page/Block model retired |

---

## 14. Eval Harness

v0.1 eval infrastructure stays; v0.2 adds **operation-aware** scoring, **multi-turn chat evals**, and an **eval lab** for model + prompt selection. Manual and script-driven runs; telemetry to Observe via headers.

### Philosophy (locked)

Main-page chat is multi-turn HITL: user describes intent → agent clarifies and plans → user guides → agent validates, fixes, saves → inspector preview. Evals must reflect that **without a real human in every matrix cell**.

**Success = saved RUI that passes the checklist + acceptable process cost.** Not eloquent chat alone.

| Layer | Question | Role | Automate? |
|-------|----------|------|-----------|
| **Outcome** | Correct final RUI? | Primary gate — deterministic checklist on saved spec | ✅ |
| **Process** | Efficient path there? | Tie-breaker — turns, validate retries, tokens, latency, cost | ✅ |
| **Conversation** | Helpful dialogue? | Sampled — human rubric on 2–3 runs/cell; notes in model-selection doc | ❌ |

**Principles:** (1) Score the **artifact**, not the transcript — no save = fail. (2) **`conversationScript`** simulates the human in guided evals. (3) **`guided`** for RapidUI Agent (product-realistic); **`single-shot`** for external agents and autonomy benchmarks — always note eval mode on Observe. (4) Deterministic checklist only — no LLM judge. (5) Eval lab tests **model × prompt × use case**, not models alone; Observe (`/observe/evals`) is the scoreboard.

**Not in v0.2:** LLM-as-judge, scoring intermediate messages, real human per matrix cell, picking model before the matrix, interactive eval playground (script + table enough).

```txt
PRODUCTION                         EVAL (guided)
User prompt                   →    eval case `prompt`
Agent clarify / plan          →    same
User guides / confirms        →    `conversationScript`
Agent validate → save         →    same → score spec + process metrics
```

**Interview line:** “We separated outcome, process, and conversation. Outcome and process are automated; conversation is sampled. In production the human guides the agent — in evals, a script plays them so we compare models fairly.”

### Multi-turn evals

| Mode | Who | Input | Tests |
|------|-----|-------|-------|
| **`guided`** (default) | RapidUI Agent | `prompt` + **`conversationScript`** | HITL: clarify → plan → build → save |
| **`single-shot`** | Agent benchmark + external agents | One full-requirements message | Autonomy |
| **`canonical`** | Live demo | Starter chip + 0–1 follow-ups | Interview path |

```json
{
  "id": "crud-admin-v0.2",
  "mode": "guided",
  "prompt": "I need an admin UI for our Users API.",
  "conversationScript": [
    { "trigger": "after_agent_reply", "content": "Full CRUD. DELETE on detail. Company scope on list." },
    { "trigger": "after_agent_reply", "content": "Yes, build it." }
  ],
  "successCriteria": { "...": "..." }
}
```

Vague variants (§7 V6): script answers clarifying questions. Wrong-pattern variants (V4): script rejects bad proposals.

**Process metrics** (on `/observe/evals`): `user_turns`, `validate_attempts`, tokens, `estimated_cost_usd`, `latency_ms`. Optional caps: `maxUserTurns`, `maxRetries`, `maxTokensOut`.

**Spot-check rubric** (2–3 runs/cell, 1–5): clarification, operations plan, error recovery, preview readiness.

**Compare:** internal matrix (model × prompt × UC1–3 on `/observe/evals`); external vs internal (Path A guided vs Path B single-shot on `/observe/agent` vs `/observe/api`).

---

### Eval lab (model × prompt × use case)

**Purpose:** Evidence-based default model + system prompt for main-page chat. Portfolio story: cost, quality, performance tradeoffs.

**Matrix:**

```txt
eval_cases (UC1–3)  ×  models (3–4)  ×  prompt_versions (2–3)  ×  eval_mode (guided | single-shot)
```

**Model shortlist (locked — decision #34):**

| Model | Role |
|-------|------|
| `o4-mini` | Default candidate — reasoning + cost |
| `gpt-4.1-mini` (or equivalent) | Non-reasoning cost baseline |
| One quality-tier model | Ceiling comparison — not expected production winner |

**Prompt versions (`agent/prompts/`):**

| Version | Emphasis |
|---------|----------|
| `v1` | Minimal workflow instructions |
| `v2` | Explicit “plan operations in chat before JSON” |
| `v3` | Stronger validate-loop / fix-systematically emphasis |

**Orchestration:** `npm run eval:matrix` — not a live UI playground. Loops matrix, drives agent via chat API with scripted user, scores final spec, logs to `eval_runs`.

**`/observe/evals` dashboard (MVP):**

- Grouped table: `(model, prompt_version, eval_mode, case_id)`
- Columns: pass rate, avg validate retries, avg tokens, avg latency, est. cost per successful save
- Drill-down to individual runs → join `session_id` on `/observe/agent`

**Deliverable:** `docs/model-selection-v0.2.md` — matrix results, chosen default, tradeoffs (philosophy lives in §14 above).

**Build timing:** Area 7, after agent + Observe live. Ship S5 with `o4-mini` default; update default only if matrix says otherwise before portfolio freeze.

---

### What carries forward from v0.1

| Piece | Role |
|-------|------|
| `eval/cases/*.json` | Prompt + `conversationScript` (guided) + `successCriteria` per scenario |
| `eval/score.ts` | Deterministic pass/fail on **final spec** + optional process caps |
| `scripts/log-eval-run.ts` | Score + insert `eval_runs` |
| `scripts/eval-matrix.ts` | *(new)* Loop model × prompt × case; drive guided chat |
| `eval_runs` table | Regression ground truth + eval lab results |
| `eval/manual/{cursor,claude,codex}/` | External agent runners (single-shot) |
| `agent/prompts/v*.txt` | *(new)* Versioned system prompts for eval lab |
| Optional headers | **`X-RapidUI-Session-Id` (required)**, **`X-RapidUI-Agent` (recommended)**, `X-RapidUI-Eval-Case` |

### v0.2 eval cases (target)

| Case id | Maps to | Required for ship |
|---------|---------|-------------------|
| `static-browse-v0.2` | Use case 1 — static `browse` + header metrics | Yes |
| `crud-admin-v0.2` | Use case 2 — full CRUD operation flow | Yes |
| `ai-review-queue-v0.2` | Use case 3 — HITL + embedded `act` | Yes |
| `spec-update-v0.2` | Use case 4 — incremental operation edits | Optional |

Retire `support-dashboard-v0.1.json` — no v0.1-shaped rewrite; UC1 is covered by `static-browse-v0.2`.

### Golden reference specs (internal only)

**Do not** expose in `/api/docs`, `llms.txt`, agent system prompts, or eval wrapper text. Used for validator smoke tests, eval scoring, UC4 seed load, and dev reference.

| File | Eval case | Use case |
|------|-----------|----------|
| `lib/operations/golden/UC1-static-browse-v0.2.rui.json` | `static-browse-v0.2` | UC1 — two static `browse` ops (incidents + teams), header metrics, status filter |
| `lib/operations/golden/UC2-crud-admin-v0.2.rui.json` | `crud-admin-v0.2` | UC2 — Users CRUD, company scope, `cta`/`cancel`/`row` transitions, embedded delete |
| `lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json` | `ai-review-queue-v0.2` | UC3 — draft inbox + read detail, approve/reject `act` with outcomes |
| `lib/operations/golden/UC4-hr-ops-seed-v0.2.rui.json` | `spec-update-v0.2` (seed) | UC4 — HR ops: employees, onboarding create, time-off browse + approve/deny |

### Open eval questions (resolve in implementation plan or follow-up doc)

| Topic | Notes |
|-------|-------|
| **`POST /api/eval/log`** | HTTP endpoint vs CLI-only — TBD |
| **v0.1 case retirement** | Retire `support-dashboard-v0.1.json` — v0.2 cases are operations-shaped only |
| **Use case variants** | At least one variant per UC in eval suite (§7) — TBD which variants ship required |
| **`conversationScript` trigger semantics** | `after_agent_reply` vs fixed turn index — finalize in eval-matrix script |
| **RapidUI Agent evals** | Agent runs get `eval_case_id`, `model`, `prompt_version`, `eval_mode` in Observe — TBD exact ingest fields |
| **Pass bar for ship** | At minimum: one external agent pass on a v0.2 case with headers. Eval lab = stretch O5 (before portfolio freeze if pursued) |
| **Model price table** | Source for `estimated_cost_usd` — hardcode in script vs config file |

### Scoring (locked)

**Outcome (primary):** deterministic checklist on the **final saved RUI** — `requiredOperations`, `requiredEmbeddedActions`, `requiredTransitions`, `requiredDataPaths`, `mustValidate`. No LLM judge in v0.2.

**Process (secondary):** optional caps — `maxUserTurns`, `maxRetries`, `maxTokensOut`. Fail if exceeded.

- `requiredOperations` — top-level types present in `operations[]` (e.g. `browse`, `create`)
- `requiredEmbeddedActions` — action types in any `read.presentation.actions[]` (e.g. `act`, `delete`)
- `requiredTransitions` — triggers used (`row`, `link`, `cta`, `cancel`)

**Example `successCriteria` (crud-admin-v0.2, guided mode):**

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

### `eval_runs` extensions (v0.2)

Extend v0.1 columns for eval lab joins:

| Column | Purpose |
|--------|---------|
| `eval_mode` | `guided` \| `single-shot` |
| `model` / `provider` | e.g. `o4-mini` / `openai` |
| `prompt_version` | e.g. `v2` |
| `reasoning_effort` | e.g. `medium` (when applicable) |
| `user_turns` | Scripted + free user messages in session |
| `validate_attempts` | From joined `api_events` |
| `tokens_in` / `tokens_out` | From agent run |
| `estimated_cost_usd` | Derived |
| `latency_ms` | Wall time to save or fail |
| `score_details` | Existing — add `missingOperations`, `userTurnsExceeded`, etc. |

**Observe for evals:** All manual runs send **`X-RapidUI-Session-Id`** (required) and **`X-RapidUI-Agent`** on every API call; scores logged to `eval_runs` via CLI (and optional `POST /api/eval/log`).

---

## 15. v0.2 Ship Criteria

**Required to call v0.2 done** (portfolio-ready):

| # | Criterion |
|---|-----------|
| S1 | **Fresh Neon** live; Vercel on `@neondatabase/serverless` (or equivalent) |
| S2 | **Operations schema 0.2** — `entities[]`, `operations` + `route` + `outcomes`, `transitions` (incl. `cta`), embedded `actions` |
| S3 | **API telemetry** — `api_events` on validate/save + discovery (3B); **required session id** on guarded routes; documented in llms.txt + `/api/docs` |
| S4 | **Observe** — `/observe/api` + `/observe/agent` dashboards working (`/observe/evals` = stretch O5) |
| S5 | **RapidUI Agent** — `agent.rapidui.dev` chat → validate → save; default **o4-mini** + optional Logfire |
| S6 | **Main UI** — **assistant-ui** chat (reasoning + tools visible) + **operations inspector** split; **use case starter chips** for UC1–3 |
| S7 | **Use cases 1–3** demonstrable end-to-end (agent → spec → Observe) |
| S8 | **Path B** — external agent run with **session id** visible in `/observe/api` (full funnel after 3B) |
| S9 | **Monorepo** — `agent/` deployed on Render; README demo script |

**Optional stretch** (not required for ship):

| # | Criterion |
|---|-----------|
| O1 | Use case 4 — spec update + `load_spec` tool |
| O2 | Logfire on Render (Path D demo) |
| O3 | `POST /api/eval/log` |
| O4 | All v0.2 eval cases (incl. `static-browse-v0.2`) logged in `eval_runs` |
| O5 | **Eval lab** — model matrix run, `/observe/evals` dashboard, `docs/model-selection-v0.2.md` with chosen default |

---

## 16. Implementation Plan Deferrals

Detail intentionally **not** specified in this reference doc — resolve in **[rapidui-v0.2-implementation.md](./rapidui-v0.2-implementation.md)** when expanding each phase:

| Topic | Area | Notes |
|-------|------|-------|
| `agent_runs` / `agent_turns` full SQL | 1 / 4 | Only `api_events` sketched in §10; ingest in Area 1 |
| Ingest JSON schema shared with `agent/` | 1 / 4 | Document payload in repo |
| CORS exact headers on Render | 0 / 4 | Allow `https://rapidui.dev` |
| UC4 seed `specId` for demo | 2 / 4 | Pre-save seed to Neon vs load from file only |
| `/observe` overview hub | 3 | ✅ Resolved — `/observe` hub + `/observe/api` + session drill-down (Phase 3 plan) |
| Session drill-down UX depth | 3 | ✅ Resolved — `/observe/api/sessions/[sessionId]` timeline (Phase 3 plan) |
| Discovery GET telemetry (`llms.txt`, docs, schema) | 3B | ✅ Resolved — `recordDiscoveryEvent()` + funnel (Phase 3 Stage 3B) |
| Session identity enforcement | 3B | ✅ Resolved — required `X-RapidUI-Session-Id` except `GET /llms.txt` (§3 #37–38) |
| WorkOS / OAuth agent auth | v0.3+ | Replaces UUID mock identity slot |
| Which eval variants required for ship | 7 | See §14 open questions |
| `POST /api/eval/log` vs CLI-only | 1 / 7 | Optional stretch O3 |
| `conversationScript` driver in eval-matrix | 7 | How scripted user waits for agent reply |
| Model price config for cost estimates | 7 | See §14 open questions |

---

## 17. Interview Narrative (draft)

**Elevator:** RapidUI is agent-first infrastructure for **operational UI workflows** — agents identify what users need to do, emit validated operation-flow specs (RUIs), not one-off React. I built the API, my own Python agent, and Observe for API + agent telemetry + eval lab.

**Depth threads:**

1. **Product engineering:** Operations-first specs beat component trees; validate → correct → save loop
2. **Frontend:** Main demo UI (**assistant-ui** chat with visible reasoning + tools), operations inspector, Observe dashboards
3. **Backend:** Next.js API, Postgres schema, telemetry middleware, ingest pattern
4. **Python / agents:** Pydantic AI + default **o4-mini** (eval-lab validated), same discovery path as external agents; operations planning workflow
5. **Data:** Neon + unified ingest; Logfire for traces, Observe for pass rates and retry analytics
6. **Eval lab & philosophy:** Outcome / process / conversation layers (§14); model × prompt matrix; scripted user for reproducible HITL
7. **Demo:** Use cases 1–3 (+ optional 4); Path A agent + Path B external + Observe on same domain
8. **Honest limits:** No renderer yet; specs assume future screens; no charts in v0.2

**Intentional failure / learning stories (pick one):**

- Validation error codes as agent feedback loop
- Why telemetry lives in FastAPI handlers, not agent tools
- Logfire vs custom Observe — two layers, two purposes
- Why mock session UUID now, WorkOS agent tokens in v0.3 — same identity slot, stronger trust

---

## 18. Relationship to v0.1 Codebase

| v0.1 asset | v0.2 action |
|------------|-------------|
| `lib/registry/*` (Page/Block model) | **Replace** with `lib/operations/*` (`operations.ts`, `transitions.ts`, `presentations.ts`) |
| `lib/validate/*` | **Rewrite** for operation-centric rules O1–O20 |
| `eval/cases/support-dashboard-v0.1.json` | **Retire** — replace with operations-shaped v0.2 cases only |
| `eval_runs` + `scripts/log-eval-run.ts` | Extend with operation-aware scoring + eval lab columns (§14) |
| `scripts/eval-matrix.ts` | *(new)* Model × prompt × case matrix runner |
| `docs/model-selection-v0.2.md` | *(new)* Matrix results + chosen default model + prompt |
| `app/page.tsx` | Replace with assistant-ui chat + inspector split |
| `lib/review/RuiInspector.tsx` | **Rewrite** for operations + transitions view |
| `@vercel/postgres` | Replace with **fresh Neon** — no data migration |
| *(new)* `agent/` | FastAPI + Pydantic AI; `prompts/` versions; operations workflow system prompt |

---

## 19. Next Steps

1. **Reference doc complete** — operations-first schema (§7) + eval philosophy & lab (§14) locked
2. **Implementation scaffold** — [rapidui-v0.2-implementation.md](./rapidui-v0.2-implementation.md) (expand phases in order)
3. **Draft eval cases** with `requiredOperations`, `conversationScript` (guided), and variants (§7, §14)
4. **Start:** Phase 0 → 1 → 2 → (4 + 5 in parallel with 3) → 6 → 7

---

*Last updated: 2026-07-18 — eval lab + philosophy (§14); operations-first schema; entity umbrella; guided multi-turn evals with `conversationScript`.*
