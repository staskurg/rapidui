# Chat exploration scenarios — UC1 / UC2 / UC3

**Status:** v1.1 exploration complete (see [v1.1 findings](chat-exploration-findings.md)). **Next:** prompt v1.2 draft-first re-run — log in [v1.2 findings](chat-exploration-findings-v1.2.md) per [implementation plan](chat-agent-v1.2-plan.md). **Infra:** chat session persistence ✅ shipped — [plan](chat-session-persistence-plan.md).
**Purpose:** manually walk the agent to a saved RUI spec through *human-realistic* conversations, so we learn which paths reliably reach `save_rui` and which stall. What we learn here becomes the raw material for stronger `conversationScript`s in `eval/cases/` — but this doc itself is not an eval plan. It's a script for a human sitting in `/chat`.

**Definition of done for every scenario:** the agent validates (≤5 attempts), calls `save_rui`, and shares a `viewUrl`. Two valid terminal shapes under prompt v1.2:

1. **Explicit-save opener (escape hatch):** user save intent in turn 1 → agent validates and saves in one shot (no draft detour). Examples: UC2-S2, UC3-S2, UC3-S5, D1.
2. **Draft → confirm → save:** agent presents a validated draft (summary + panel + one confirm ask), user confirms with save intent on a later turn → single `save_rui`. Examples: D2 turn 2, UC1-S1 turn 3.

Saving without either shape — agent calls `save_rui` before the user's save-intent turn — is a finding: **`saved-unconfirmed`**, even when the artifact is correct.

**Deliberately out of scope:** failure paths (validation never passing, user abandoning mid-run). This doc maps the *successful* routes; unhappy paths are a later exercise.

---

## How to run

1. Start the agent service and the Next.js app (README, Path A), then open `/chat`. After the first message, the URL updates to `/chat/{sessionId}` ([chat-session-persistence-plan.md](chat-session-persistence-plan.md)).
2. **Fresh chat session per scenario run** — use **New chat** (new URL/session id). Never reuse a session; it contaminates the next run.
3. **Repeat each scenario 3 times** before moving on (`UC1-S1.1`, `.2`, `.3`, then UC1-S2, …). An `error` run (infra failure) does not count — rerun until you have 3 countable results. See [v1.2 findings — run protocol](chat-exploration-findings-v1.2.md#instructions-for-the-assisting-agent).
4. Paste user turns verbatim, including the code blocks. Wait for the agent to finish each reply before the next turn.
5. Where the evidence lives afterward:
   - **Full conversation (restore):** `/chat/{sessionId}` — same UI as the live run
   - **Transcript API:** `GET /api/chat/sessions/{sessionId}/transcript`
   - **Validate attempts, tool calls, errors:** `/observe/agent/sessions/{sessionId}` (human UI) or `npm run fetch:exploration-evidence -- {sessionId} {runId}` (assisting agent)
   - **The saved artifact:** the `viewUrl` the agent returns (`/specs/{id}`), or `GET /api/specs/{id}` with `X-RapidUI-Session-Id: {sessionId}` for JSON
6. **Log each run** in `.cursor/chat-exploration-findings-v1.2.md` before starting the next run. Include the chat URL in each run entry. (v1.1 runs remain in [chat-exploration-findings.md](chat-exploration-findings.md).)
7. **S+1 (post-save iteration):** run as an extra turn in the **same session** after a successful save. Log the parent scenario run **first**, then send the S+1 turn and log S+1 separately. Do not extract parent metrics after S+1 — they will include the follow-up turn.

**Workload:** 22 scenarios × 3 runs ≈ **66 base runs** (19 original + D1–D3), plus S+1 at least once per use case (3+), plus optional UC1-S2 riders. Budget accordingly.

## Global watch-fors (every scenario, v1.2+)

Apply on top of each scenario's own watch-fors:

- **No `save_rui` before user save-intent turn** — see [save-intent table](#save-intent-classification-v12) for which turn carries save intent per scenario. Premature save → `saved-unconfirmed`.
- **Draft turn shape** — when the agent reaches a passing validate without explicit-save opener: one consolidated turn with (a) concise summary of screens/ops/bindings/inferences, (b) note that the spec is visible in the panel, (c) exactly one closing confirm ask (e.g. "any changes, or should I save it?"). No new interview questions in the draft turn.
- **Plan-only restraint (UC1-S5)** — when the user said "don't build yet", turn 1 must be prose plan only: no `validate_rui`, no draft JSON, no save.

## Save-intent classification (v1.2)

Under draft-first, every **successful** scenario must include **explicit save phrasing** somewhere — either in the opener (escape hatch: "validate and save", "build and save") or on a **separate confirm turn** after the draft ("looks good, save it", "go ahead and save", "save it when it's good"). **"Build it" / "go" / "yes" alone are not save intent** unless the agent's draft turn asked "should I save it?" and the user affirms.

| Rule | Detail |
|---|---|
| **Escape hatch** | Save intent in turn 1 opener → one-shot validate + save (no draft detour) |
| **Draft → confirm** | Turns 1…N−1 deliver contract / answers; turn N (or N+1 after scope fork) uses explicit save phrasing |
| **Incomplete by design** | Only when intentionally bailing after draft (New chat) — log as `no-save`, Observe state **`draft`** |

Which user turn carries **save intent** (earliest legitimate `save_rui`):

| Scenario | Save-intent turn | Shape | Explicit save phrasing (scripted) |
|---|---|---|---|
| UC1-S1 | 3 | draft → confirm | Turn 3: "yep, that works. **save it.**" |
| UC1-S2 | 2 | draft → confirm | Turn 2: "looks right, **go ahead and save.**" |
| UC1-S3 | 2 | draft → confirm | Turn 2: "…**then save it.**" |
| UC1-S4 | 2–3 | draft → confirm | Final turn: "**good, save it.**" (after semantics answers) |
| UC1-S5 | 4 | draft → confirm | Turn 4: "**looks good, save it.**" (turn 1 plan-only; turn 2 scope) |
| UC1-S6 | 2 | draft → confirm | Turn 2: "yep, exactly. **save it.**" |
| UC2-S1 | 3–4 | draft → confirm | Final turn: "**looks good, save it.**" (turn 3 scope answer if asked) |
| UC2-S2 | 1 | one-shot (escape hatch) | Opener: "**Validate and save** when it passes" |
| UC2-S3 | 3 | draft → confirm | Turn 3: "**looks good, save it.**" (turn 2 = CRUD/scope, no save word) |
| UC2-S4 | 2 | draft → confirm | Turn 2: "**build and save**" |
| UC2-S5 | 3 | draft → confirm | Turn 3: "**save it.**" |
| UC2-S6 | 2 | draft → confirm | Turn 2: "**build and save**" |
| UC3-S1 | 3 | draft → confirm | Turn 3: "**looks good, save it.**" (turn 2 = UX clarify, no save word) |
| UC3-S2 | 1 | one-shot (escape hatch) | Opener: "**validate and save**" |
| UC3-S3 | 2 | draft → confirm | Turn 2: "do it that way and **save**" |
| UC3-S4 | 4 | draft → confirm | Turn 4: "that plan works, **save it.**" |
| UC3-S5 | 2 | draft → confirm | Turn 2: "**build and save**" |
| UC3-S6 | 2 | draft → confirm | Turn 2: "**save it when it's good**" |
| D1 | 1 | one-shot (escape hatch) | UC2-S2 opener verbatim |
| D2 | 2 | draft → confirm | Turn 2: "**looks good, save it**" |
| D3 | 3 | draft → confirm | Turn 3: "**looks good, save it**" (turn 2 = change, no save) |
| S+1 | +1 | varies | "**save it again**" (change-only turn → re-draft + separate save turn) |

**Turn-count delta vs v1.1:** escape-hatch openers stay ~same (UC2-S2, UC3-S2, D1). Most others gain one turn for draft + explicit-save confirm. UC2-S1 / UC1-S5 may need **4 turns** when a scope or plan fork adds a step before the save turn.

## Scenario index

User-turn counts include the opener (the guided runner counts the first prompt as turn 1 and aborts past a case's `maxUserTurns` — bump to **5** for v1.2 eval cases; draft/confirm turns need headroom).

| ID | Input form | Skill isolated | User turns (v1.2) |
|---|---|---|---|
| UC1-S1 | JSON paste (on request) | asks for data instead of inventing | 3 |
| UC1-S2 | CSV paste (up front) | CSV parsing, draft → confirm | 2 |
| UC1-S3 | none (invent) | believable invention, late requirement | 2 |
| UC1-S4 | messy JSON | column judgment, clarifying questions | 2–3 |
| UC1-S5 | inline JSON | restraint ("don't build yet"), scope expansion | 4 |
| UC1-S6 | API-shaped JSON envelope | static-vs-API discrimination at the boundary | 2 |
| UC2-S1 | prose endpoint list + fields (on request) | interview for the API contract | 3–4 |
| UC2-S2 | everything in one prompt | skipping redundant questions (escape hatch) | 1–2 |
| UC2-S3 | OpenAPI YAML | schema extraction, read vs write shapes | 3 |
| UC2-S4 | sample 200 responses | envelope/`valuePath` inference | 2 |
| UC2-S5 | prose, staged | re-planning when scope grows | 3 |
| UC2-S6 | cURL notes | normalizing concrete IDs to placeholders | 2 |
| UC3-S1 | story + endpoints | canonical HITL path | 3 |
| UC3-S2 | everything in one prompt | one-shot HITL (escape hatch) | 1–2 |
| UC3-S3 | endpoints + invalid ask | pushback on row actions | 2 |
| UC3-S4 | prose, drip-fed | full discovery interview | 4 |
| UC3-S5 | different domain | pattern generalization | 2 |
| UC3-S6 | endpoints, no story | confirming human meaning | 2 |
| D1 | UC2-S2 opener verbatim | escape hatch regression | 1–2 |
| D2 | UC2-S2 minus save sentence | draft gate isolation | 2 |
| D3 | D2 + iteration | iterate-then-save | 3 |
| S+1 | follow-up after any save | post-save iteration | +1 |

---

## Known harness gap (verified in code)

The Phase 7.3 guided runner (`scripts/eval-run.ts` → `eval_driver.py`) sends only the case `prompt` and the `conversationScript[].content` messages to the agent. **It never sends `mockApi`** — that block is only consumed by the Path B manual wrapper (`lib/eval/renderPrompt.ts`).

Consequence: in guided UC2/UC3 runs the agent has never seen `/api/users`, `/api/drafts/{draftId}/approve`, or any other endpoint the grader asserts on. Those cases are likely failing for lack of information, not model capability. When promoting scenarios from this doc into eval cases, the API contract must travel **inside the prompt or script turns** — exactly as the scenarios below deliver it.

## Vocabulary boundaries (so you don't misread a run)

Keep these in mind when judging whether the agent failed or the request was impossible:

- Row-inline actions, pagination, sorting, request headers, charts, and modals are **outside** the RUI v0.2 vocabulary. A correct agent redirects; it does not build them.
- Approve/reject/delete on a record are embedded actions on the `read` operation, never top-level ops or row buttons.
- Supported methods: GET, POST, PATCH, DELETE. Supported ops: browse, read, create, update, delete.
- All data (JSON, CSV, YAML, sample responses) arrives as pasted text — no file attachments.
- A saved spec proves correct *declarative bindings*, not that the real endpoint responds at runtime.

---

## What the agent actually needs (the "basic information")

Before the scenarios, the irreducible inputs per use case. Every scenario below is just a different *route* to delivering these:

| | UC1 — Static browse | UC2 — CRUD admin | UC3 — AI review queue |
|---|---|---|---|
| **Intent** | "show me this data" (browse-only) | "manage these records" (full or partial CRUD) | "humans gate AI output" (browse → detail → approve/reject) |
| **Data** | records, pasted or invented on request (JSON array or CSV) | API endpoints (method + path) for list/get/create/update/delete; field shape (schema, sample response, or prose) | endpoints for inbox list, detail, and the two action POSTs; the fields a reviewer needs to see |
| **Extras that change the spec** | header metrics, filters, second entity | scope selector (`{scope.companyId}`), delete placement (detail, not row), filters | acts embedded on detail (never row actions), status filter, outcome navigation after approve/reject |
| **Explicit non-goals** | no API wiring, agent must not invent endpoints | — | approve/reject as top-level operations or row buttons |

The interesting variable is **form and timing**: everything up front vs. drip-fed; JSON vs. CSV vs. YAML vs. prose; user who knows the constraints vs. user who doesn't.

---

## Logging

All run logging lives in the companion doc: **`.cursor/chat-exploration-findings-v1.2.md`** (v1.2 re-run) — agent instructions, [transcript extraction checklist](chat-exploration-findings-v1.2.md#transcript-extraction-checklist), run-entry template, dashboard, per-use-case findings, and the final "changes to make" section. v1.1 baseline: [chat-exploration-findings.md](chat-exploration-findings.md). Log **every run** (3× per scenario) before starting the next run. Assisting agent: `npm run fetch:exploration-evidence -- {sessionId} {runId}`.

---

## UC1 — Static browse (paste-your-data dashboard)

### UC1-S1 — Thin opener, JSON arrives on request

The most common real path: the user leads with intent only, and the data exists but isn't in the first message. Tests whether the agent asks for data instead of inventing it or (worse) inventing API paths.

**Turn 1 (user):**

> hey, I need a quick internal page that shows our current incidents. nothing fancy, just a table.

**Expected agent behavior:** asks what the data looks like / whether there's an API or pasted data. It must not assume API mode.

**Turn 2 (user):** paste this verbatim:

> here's what we've got, just use this:
>
> ```json
> [
>   { "id": "INC-1042", "title": "Checkout latency spike", "severity": "high", "status": "open", "owner": "Priya" },
>   { "id": "INC-1041", "title": "Stale cache on pricing page", "severity": "medium", "status": "investigating", "owner": "Marco" },
>   { "id": "INC-1037", "title": "Email digest duplicated", "severity": "low", "status": "resolved", "owner": "Dana" }
> ]
> ```

**Turn 3 (user):** confirm whatever plan it proposes: "yep, that works. save it."

**Watch for:** `data.mode: static` with the three records embedded verbatim; no invented endpoints; a sensible `/incidents` route. **v1.2:** no save on turn 2 (data paste); draft turn after validate on turn 2; save only on turn 3.

---

### UC1-S2 — CSV in the very first message

Same destination, different serialization, zero back-and-forth offered. Tests the documented CSV support and whether the agent can go one-shot → clarify-once → save without needing the user to structure anything.

**Turn 1 (user):**

> I want a page for our team roster. data is below, it's from a spreadsheet export. table view is fine.
>
> ```
> team,lead,headcount,region
> Payments,Ana Torres,8,EMEA
> Search,Kenji Mori,5,APAC
> Growth,Sam Ortiz,11,AMER
> ```

**Turn 2 (user):** "looks right, go ahead and save."

**Watch for:** correct CSV parsing (headers → columns, rows → records), `headcount` treated sensibly, no phantom fields. This is the scenario that proves the "paste from a spreadsheet" story actually works — most real internal-tool users live in Sheets, not JSON.

**Optional riders (rerun if the base case passes):** a quoted field containing a comma (`"Torres, Ana",Payments,...`) to test real CSV parsing rather than naive splitting; and a 25–30 row export to see whether all records get embedded, silently truncated, or trigger a question.

---

### UC1-S3 — No data at all: "make something up"

Users prototyping a UI before the data exists. The current canonical eval prompt is a cousin of this; here we do it the way a human actually would — vague, and with the metrics ask arriving late.

**Turn 1 (user):**

> I'm mocking up an ops dashboard to show my manager tomorrow. two screens: incidents and teams. I don't have real data yet, just invent something believable, like 3 rows each.

**Turn 2 (user, after agent proposes):**

> oh and can the incidents page have a couple of numbers up top? like open count and resolved today. then save it.

**Watch for:** invented records that are actually believable (not `foo/bar`); header metrics landing in `presentation.header.metrics[]` (a known failure shape is putting them at `presentation.metrics`); metric values consistent with the invented records (if 2 of the 3 incidents are open, "open count" should be 2, not a random number); both routes present. Justification: this exercises the *invent* path plus a mid-conversation requirement change — the smallest version of "the user remembered something after the plan."

---

### UC1-S4 — Messy real-world JSON, user delegates judgment

Real pasted data is never clean. Tests whether the agent selects sensible columns instead of dumping every key, and asks rather than guessing when the data is ambiguous.

**Turn 1 (user):**

> can you make a browse page out of this? it's a dump from our tool, just show whatever's important, not all of it
>
> ```json
> [
>   { "id": 883, "ttl": "VPN flaking for contractors", "sev": 2, "created_ts": 1754324991, "assignee": { "name": "Priya", "id": "u_19" }, "tags": ["network", "vpn"], "resolved": null },
>   { "id": 871, "ttl": "Billing export missing rows", "sev": 1, "created_ts": 1754239110, "assignee": { "name": "Marco", "id": "u_04" }, "tags": ["billing"], "resolved": true },
>   { "id": 869, "ttl": "Login page typo", "sev": 4, "created_ts": 1754151600, "assignee": null, "tags": [], "resolved": true }
> ]
> ```

**Turn 2 (user):** answer whatever it asks (e.g. "sev 1 is worst"; "assignee name is enough"; "skip tags"). Then: "good, save it."

**Watch for:** does it ask about `sev` ordering and the nested `assignee` object **before drafting**, or silently guess? Does it flatten `assignee.name`? Cryptic keys (`ttl`) should become human labels; epoch timestamps should become human-readable dates. **v1.2:** semantics questions must land before the draft turn — not after a premature save.

---

### UC1-S5 — Second entity added after the plan is agreed

Drip-feed of scope. The canonical UC1 case asks for both screens up front; humans routinely don't.

**Turn 1 (user):**

> simple page listing our open incidents — severity, status, owner. don't build anything yet, just tell me what you'd make of this first. data: `[{"id":"INC-9","title":"API 500s","severity":"high","status":"open","owner":"Dana"},{"id":"INC-7","title":"Slow search","severity":"low","status":"open","owner":"Kenji"}]`

**Turn 2 (user, after agent proposes single-screen plan):**

> actually while you're at it add a second screen for teams. make up 3 teams, whatever. no need to link the two screens.

**Turn 3 (user):** wait for draft in panel (agent validates after scope expansion).

**Turn 4 (user):**

> looks good, save it.

**Watch for:** restraint — the agent must *not* compose, validate, or save on turn 1 when explicitly told to hold off (plan-only mode); then extending its plan instead of restarting; two entities, each with its own entrypoint; no forced navigation between unrelated screens. **v1.2:** turn 1 is prose plan only — no `validate_rui`, no draft JSON. Explicit save on turn 4 only.

---

### UC1-S6 — API-shaped data, but the user wants it static

The hardest version of the static-vs-API call. The paste is *shaped* like an API response (envelope, `items`, even a `total`) and the user names the API — but the intent is an unwired mock. UC1 tests pure static and UC2/UC3 pure API; this is the boundary between them, and it's a very plausible real request ("demo tomorrow, backend isn't ready").

**Turn 1 (user):**

> here's a sample response from our orders API — don't wire anything up yet, the backend isn't stable. just mock it statically so I can demo the screen tomorrow.
>
> ```json
> {
>   "items": [
>     { "id": "ord_301", "customer": "Acme Co", "total": 1240.5, "status": "shipped" },
>     { "id": "ord_298", "customer": "Globex", "total": 87.0, "status": "pending" },
>     { "id": "ord_290", "customer": "Initech", "total": 430.25, "status": "refunded" }
>   ],
>   "total": 3
> }
> ```

**Turn 2 (user):** "yep, exactly. save it."

**Watch for:** `data.mode: static` despite every API-shaped signal in the paste; records unwrapped from the `items` envelope (not the whole envelope embedded as one record); no invented `GET /api/orders` binding. A validator backstop exists (`STATIC_API_CONFLICT`), but the interesting question is whether the agent gets it right *before* validation. Justification: this directly tests cross-run question #1 at its hardest point — if the agent only distinguishes static from API by surface format, this run exposes it.

---

## UC2 — CRUD admin (real API)

Premise for all of these: the UI must bind to a real API, so the user has to hand over endpoints + data shape *somehow*. Each scenario is a different "somehow."

### UC2-S1 — Thin opener, plain endpoint list on request (canonical path)

Matches the current eval case. This is the baseline — run it manually so we have a felt sense of what "passing" sounds like before comparing the variants.

UC2 needs **endpoints and field shape** (see [basic information](#what-the-agent-actually-needs-the-basic-information)). Turn 1 is intent-only; turn 2 delivers the contract when the agent asks — endpoints, CRUD rules, scope, **and** a prose field list (same shape as the golden spec and UC2-S2). Turn 3 confirms build and, if the agent asks, picks the scope UX (dropdown on the users list, not a separate Companies entity).

**Turn 1 (user):**

> I need an admin UI for our Users API.

**Expected agent behavior:** asks for endpoints, CRUD scope, and User field shape. It cannot proceed without them.

**Turn 2 (user):**

> endpoints:
> - GET /api/users (list, supports ?companyId=)
> - GET /api/users/{userId}
> - POST /api/users
> - PATCH /api/users/{userId}
> - DELETE /api/users/{userId}
> - GET /api/companies (for a company picker)
>
> full CRUD. delete should live on the detail screen. list is scoped by company — use {scope.companyId} in the paths.
>
> users have id, email, role (admin or member), notes, and active (boolean).

**Turn 3 (user):** if the agent asks how to model company scope (dropdown vs separate Companies screen), answer:

> dropdown company picker on the users list, bound to GET /api/companies. paths use {scope.companyId}.

**Turn 4 (user)** — or **turn 3** if no scope question was asked, after the draft appears in the panel:

> looks good, save it.

**Watch for:** all five op types (browse, read, create, update, delete-on-read); delete embedded on `read`; `cta` transition browse→create; scope selector bound to `/api/companies`; create/update forms use `email`, `role`, `notes`, `active` with sensible types (email, select, textarea, checkbox). **v1.2:** agent should ask about list response envelope (`valuePath`) if not given. Draft after contract; explicit save on final turn only — never "build it" without "save".

**Note:** `crud-admin-v0.2` eval script omits the field list — a known gap. Use this scenario's turn 2 wording when promoting to eval.

---

### UC2-S2 — Everything in one prompt (power user, zero clarification)

Some users front-load everything. Tests whether the agent can skip the interview when it genuinely has enough, or whether it asks redundant questions (a real UX cost).

**Turn 1 (user):**

> Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have id, email, role (admin|member), notes, and active (boolean). List and companies responses wrap arrays in `{items: [...]}`; company options use `id` + `name`. Delete goes on the detail screen with a confirm. Validate and save when it passes.

**Turn 2 (user):** at most one confirmation: "yep, go."

**Watch for:** turns-to-save (should be minimal); no re-asking for information already given. Justification: our eval scripts assume a clarify turn exists — if the agent behaves differently on a complete prompt, the scripts need a one-shot variant.

---

### UC2-S3 — OpenAPI YAML paste

The "backend already has a spec" path — arguably the most realistic for teams with an actual API. The agent has no OpenAPI parser tool; it has to read the YAML as text and extract methods, paths, params, and field shapes itself.

**Turn 1 (user):**

> we have an openapi spec for the service, here's the relevant part. I want an admin portal for users off of this.
>
> ```yaml
> openapi: 3.0.3
> info: { title: Users API, version: 1.0.0 }
> paths:
>   /api/users:
>     get:
>       parameters:
>         - { name: companyId, in: query, required: true, schema: { type: string } }
>       responses:
>         '200':
>           content:
>             application/json:
>               schema:
>                 type: object
>                 properties:
>                   items: { type: array, items: { $ref: "#/components/schemas/User" } }
>                   total: { type: integer }
>     post:
>       requestBody:
>         content:
>           application/json:
>             schema: { $ref: "#/components/schemas/UserWrite" }
>   /api/users/{userId}:
>     get:
>       responses:
>         '200':
>           content:
>             application/json:
>               schema: { $ref: "#/components/schemas/User" }
>     patch:
>       requestBody:
>         content:
>           application/json:
>             schema: { $ref: "#/components/schemas/UserWrite" }
>     delete: {}
>   /api/companies:
>     get:
>       responses:
>         '200':
>           content:
>             application/json:
>               schema:
>                 type: object
>                 properties:
>                   items:
>                     type: array
>                     items:
>                       type: object
>                       properties:
>                         id: { type: string }
>                         name: { type: string }
> components:
>   schemas:
>     User:
>       type: object
>       required: [id, email, role]
>       properties:
>         id: { type: string }
>         email: { type: string, format: email }
>         role: { type: string, enum: [admin, member] }
>         notes: { type: string }
>         active: { type: boolean }
>     UserWrite:
>       type: object
>       required: [email, role]
>       properties:
>         email: { type: string, format: email }
>         role: { type: string, enum: [admin, member] }
>         notes: { type: string }
>         active: { type: boolean, default: true }
> ```

**Turn 2 (user):**

> full CRUD. delete on the detail screen with confirm. dropdown company picker on the users list, bound to GET /api/companies — list and item calls use ?companyId={scope.companyId}.

**Turn 3 (user):** after the draft appears in the panel:

> looks good, save it.

**Watch for:** does it build forms from `UserWrite` — the write shape — rather than `User` (i.e. no `id` field on create/update forms)? Email as email input, role as select with the enum, active as checkbox? Does it carry the required `companyId` query param into every binding? **v1.2:** turn 2 has no save word; save only on turn 3.

---

### UC2-S4 — No schema, just sample responses

The user who can hit the API but has no spec document. Field shape arrives as example 200 bodies; the agent must infer types and the `valuePath`.

**Turn 1 (user):**

> admin UI for users. I don't have a schema doc but here's what the API actually returns.
>
> GET /api/users?companyId=c_11 → 200:
>
> ```json
> { "items": [ { "id": "u_04", "email": "marco@acme.dev", "role": "member", "active": true, "notes": "" } ], "total": 41 }
> ```
>
> GET /api/users/u_04 → 200:
>
> ```json
> { "id": "u_04", "email": "marco@acme.dev", "role": "member", "active": true, "notes": "contractor until Q4" }
> ```
>
> create is POST /api/users, edit is PATCH /api/users/{userId}, delete is DELETE /api/users/{userId}. companies for the scope dropdown come from GET /api/companies which returns `{ "items": [ { "id": "c_11", "name": "Acme" } ] }`.

**Turn 2 (user):** "delete from the detail page please. otherwise looks good, build and save."

**Watch for:** `valuePath: "items"` inferred from the envelope (this is a real, load-bearing inference — get it wrong and the rendered table is empty); `labelKey`/`valueKey` on the companies binding; sensible `bodyMap` on create/update. Justification: sample-response-driven setup is probably *more* common than OpenAPI in small teams, and it exercises inference our current eval prompts never test.

---

### UC2-S5 — Read-only first, CRUD added before saving

Scope grows inside one conversation. Also the natural home for testing that the agent re-plans instead of bolting things on inconsistently.

**Turn 1 (user):**

> to start I just want a read-only view of users: a list and a detail page. GET /api/users (returns `{items: [...]}`) and GET /api/users/{userId}. fields: id, email, role (admin or member), active (boolean), notes.

**Turn 2 (user, after it proposes browse + read):**

> you know what, let's just do the whole thing while we're here. POST /api/users to create, PATCH /api/users/{userId} to edit, DELETE /api/users/{userId} — delete from the detail screen with a confirm. create and edit forms use email, role, notes, active (same fields as read). no company scope, single tenant.

**Turn 3 (user):** "save it."

**Watch for:** the create/update outcomes (`success`/`error`/`cancel`) all present — outcomes tend to get dropped exactly when ops are added late; the `cta` browse→create transition appearing after the expansion; no leftover read-only framing in titles. Justification: this mirrors how UC2 fails today ("missing cta", "delete as top-level op") but reaches those risks through a human path rather than a compressed script line.

---

### UC2-S6 — cURL notes forwarded from a backend engineer

The API contract arrives as copied shell commands with *concrete* IDs baked in — the way it actually gets pasted from a README or a Slack thread. The trap: the agent must normalize `usr_101` and `co_01` into `{userId}` and `{scope.companyId}` placeholders instead of hardcoding sample IDs into declarative paths.

**Turn 1 (user):**

> our backend guy sent me this, can you make a users admin out of it? full CRUD, scoped by company, delete on the detail page.
>
> ```bash
> # companies for the picker
> curl /api/companies
> # => {"items":[{"id":"co_01","name":"Northwind"}]}
>
> # list
> curl "/api/users?companyId=co_01"
> # => {"items":[{"id":"usr_101","email":"maya@example.com","role":"admin","active":true,"notes":"Owner"}]}
>
> # detail
> curl "/api/users/usr_101?companyId=co_01"
>
> # create
> curl -X POST "/api/users?companyId=co_01" -d '{"email":"new@example.com","role":"member","active":true,"notes":""}'
>
> # update
> curl -X PATCH "/api/users/usr_101?companyId=co_01" -d '{"email":"maya@example.com","role":"admin","active":true,"notes":"Owner"}'
>
> # delete
> curl -X DELETE "/api/users/usr_101?companyId=co_01"
> ```
>
> role is admin or member.

**Turn 2 (user):** "yep that's it. build and save."

**Watch for:** no `usr_101` or `co_01` anywhere in the saved spec — every path parameterized; `valuePath: "items"` picked up from the commented responses; write bodies driving the form fields. Justification: copied cURL is arguably the most common real-world handoff format for small teams, and it's the only input form where the sample-ID-in-path failure mode can occur at all.

---

## UC3 — AI review queue (HITL)

Premise: AI drafts something, a human approves or rejects before it ships. The structural trap is specific and known: approve/reject must be **embedded `act` actions on the read/detail operation** — not top-level operations, not row buttons.

### UC3-S1 — Story + endpoints up front, one clarify turn (canonical path)

The baseline, matching the current eval case. Run it by hand first for the same reason as UC2-S1.

**Turn 1 (user):**

> Build an internal UI for reviewing AI-drafted support replies before they send. Queue shows pending drafts with confidence, model, and source ticket. Reviewer opens a draft and approves or rejects it from the detail screen.
>
> API: GET /api/drafts (inbox), GET /api/drafts/{draftId}, POST /api/drafts/{draftId}/approve, POST /api/drafts/{draftId}/reject.

**Turn 2 (user):** "approve and reject are buttons on the detail screen, not on the rows. add a status filter on the inbox."

**Turn 3 (user):** after the draft appears in the panel:

> looks good, save it.

**Watch for:** two `act` actions on `read` with outcomes (success should navigate back to the inbox); `row` transition inbox→detail; `presentation.filter` (singular) for status. **v1.2:** turn 2 has no save word; save only on turn 3.

---

### UC3-S2 — Everything in a single message

One-shot completeness test, HITL edition.

**Turn 1 (user):**

> Review queue for AI-generated support replies. GET /api/drafts returns {items:[{id, ticketId, confidence, model, status, draftText}]}. GET /api/drafts/{draftId} for the full draft. Approve = POST /api/drafts/{draftId}/approve, reject = POST /api/drafts/{draftId}/reject — both as buttons on the detail screen, both go back to the queue on success. status filter on the queue (pending/approved/rejected). validate and save.

**Turn 2 (user):** "go."

**Watch for:** same artifact as S1 with fewer turns; whether the pasted response shape correctly drives `valuePath: "items"` and the detail fields. Justification: paired with S1 it isolates *conversation structure* from *information content* — same facts, different packaging.

---

### UC3-S3 — User asks for the invalid thing (row-level approve buttons)

The user doesn't know our vocabulary and asks for approve/reject icons on each table row — which the schema can't express. Still a *success* scenario: the run passes if the agent explains the constraint and lands the valid alternative, per its own instruction to "say so and offer a valid alternative."

**Turn 1 (user):**

> we get ~50 AI-drafted replies a day and I want my team to burn through them fast. list of drafts with little approve/reject buttons right on each row so nobody has to click into anything. API: GET /api/drafts, GET /api/drafts/{draftId}, POST /api/drafts/{draftId}/approve, POST /api/drafts/{draftId}/reject.

**Expected agent behavior:** push back — explain acts live on the detail screen, offer the row→detail→act flow (and maybe frame it as safer for HITL anyway).

**Turn 2 (user):** "hm ok, fine — as long as it's fast. do it that way and save."

**Watch for:** does it negotiate, or does it silently build the invalid thing and burn validate attempts? How many attempts does it take if it tries row actions first? Justification: this is the single most likely real-user request for this use case, and it's exactly the failure mode ("approve/reject on rows") we've seen in eval runs. We need to know whether the *prompt* catches it before the *validator* has to.

---

### UC3-S4 — Vague opener, agent must interview for everything

The user has the problem but none of the framing. Tests the full discovery interview: the agent has to extract the entity, the endpoints, and the reviewable fields step by step.

**Turn 1 (user):**

> our support bot writes reply drafts and right now they just… send. I want a human checkpoint in between. can you build something for that?

**Expected agent behavior:** asks (in some order) what a reviewer needs to see, where drafts come from, and what approve/reject should call.

**Turn 2 (user):**

> reviewers need the draft text, which ticket it's for, the model's confidence. drafts come from GET /api/drafts, single one is GET /api/drafts/{draftId}.

**Turn 3 (user):**

> approving is POST /api/drafts/{draftId}/approve, rejecting POST /api/drafts/{draftId}/reject. after either one, back to the list.

**Turn 4 (user):** "that plan works, save it."

**Watch for:** whether the agent's questions actually cover the required inputs (or whether it starts building after turn 2 with no action endpoints — a guaranteed dead end); turns-to-save. **v1.2:** must not present a complete draft or save until approve/reject endpoints are known (turn 3+); no invented update/send ops.

---

### UC3-S5 — Same shape, different domain (content moderation)

Swap support replies for AI-flagged marketplace listings. The RUI shape should be isomorphic to UC3; only fields, endpoints, and labels change.

**Turn 1 (user):**

> internal moderation queue: our classifier flags marketplace listings and a human decides. list of flagged listings with the flag reason and a score, click into one to see the listing, then either "remove listing" or "dismiss flag."
>
> GET /api/flags returns `{items:[{id, listingId, reason, score}]}`. GET /api/flags/{flagId} adds listing fields (listingTitle, listingDescription, listingPrice, listingSeller). POST /api/flags/{flagId}/remove-listing, POST /api/flags/{flagId}/dismiss.

**Turn 2 (user):** "both actions on the detail view. remove listing is the destructive one — make it danger variant. build and save."

**Watch for:** the two acts generalized correctly (labels/variants — "remove listing" should read as the dangerous one); success outcomes navigate back to browse; `row` transition; **`valuePath: "items"`** when envelope hinted; no support-domain residue. Justification: if UC3 only works when the words "draft" and "approve" appear, our agent has memorized the eval case rather than learned the pattern.

---

### UC3-S6 — Endpoints with no story attached

The inverse of UC3-S4: the user hands over the full API contract but zero domain context. The endpoint names *suggest* a review workflow, but the agent should confirm the human meaning — what's being reviewed, what a reviewer needs to see, where to go after acting — rather than building a generic API explorer.

**Turn 1 (user):**

> need an internal UI for these:
>
> ```
> GET  /api/drafts            → { "items": [ { "id": "dr_201", "preview": "Thanks for reporting…", "ticketId": "T-8841", "model": "gpt-4.1", "confidence": 0.86, "status": "pending" } ] }
> GET  /api/drafts/{draftId}
> POST /api/drafts/{draftId}/approve
> POST /api/drafts/{draftId}/reject
> ```

**Expected agent behavior:** asks what these drafts are, what fields the detail view needs, whether approve/reject happen from detail, and what happens after.

**Turn 2 (user):**

> they're AI-written support replies waiting on a human. detail adds body, ticketSubject, customerMessage. buttons on the detail screen, back to the list after either one. save it when it's good.

**Watch for:** does the agent ask about *meaning* (what is a draft, what does a reviewer judge) or only mechanics? Does it correctly refuse to treat approve/reject as create/update CRUD writes? **v1.2:** no save on turn 1 — turn 1 is endpoints-only; save intent is turn 2 ("save it when it's good"). Agent must interview for meaning before drafting.

---

## D-series — Draft workflow isolation (UC2 users-admin domain)

Run on the UC2 users-admin domain to reuse known contracts. Three scenarios × 3 runs each — log as D1.1–D3.3. Priority: run D1–D3 **first** in the v1.2 re-run before revisiting the full base set.

### D1 — Power-user explicit save (escape hatch)

UC2-S2 opener verbatim. Tests that explicit save in the opener bypasses the draft detour.

**Turn 1 (user):**

> Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have id, email, role (admin|member), notes, and active (boolean). List and companies responses wrap arrays in `{items: [...]}`; company options use `id` + `name`. Delete goes on the detail screen with a confirm. Validate and save when it passes.

**Turn 2 (user):** at most one confirmation: "yep, go."

**Watch for:** one-shot save on turn 1 (escape hatch); no draft detour; same artifact as UC2-S2. Premature-save victim under v1.1 — must stay one-shot under v1.2.

---

### D2 — Complete contract, no save word (draft gate)

UC2-S2 turn 1 **without** the final "Validate and save when it passes" sentence. Tests the draft-first gate.

**Turn 1 (user):**

> Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have id, email, role (admin|member), notes, and active (boolean). List and companies responses wrap arrays in `{items: [...]}`; company options use `id` + `name`. Delete goes on the detail screen with a confirm.

**Turn 2 (user):** "looks good, save it."

**Watch for:** draft + summary + confirm ask on turn 1, **no save** until turn 2; panel shows validated spec; exactly one `save_rui` in the session. Observe session state for a no-save bail (click New chat after draft) should be **`draft`**, not **`abandoned`**.

---

### D3 — Draft iteration (iterate-then-save)

D2 opener; turn 2 requests a change; turn 3 confirms save. Tests the iteration loop and single final save.

**Turn 1 (user):** same as D2.

**Turn 2 (user):** "drop the notes column, add a status badge."

**Turn 3 (user):** "looks good, save it."

**Watch for:** rebuilt re-validated draft on turn 2 with everything else carried forward (outcomes, transitions, scope — the known casualties); **no save** on turn 2; exactly **one** `save_rui` on turn 3. Notes column absent, status badge present in final artifact.

---

## S+1 — Post-save iteration (append to any scenario)

Every real session will include this, and no scenario above covers it: the agent saves, the user opens the `viewUrl`, and comes back with a change. Run it as a follow-up turn after any successful save — ideally at least once per use case.

**Turn (user, after the agent shares a viewUrl):**

> just looked at it — rename the app to "Ops Console" and add the owner column to the incidents table. save it again.

(Adapt the specifics to whichever scenario you just ran: a renamed title plus one small structural change is the right size.)

**Mechanics to know:** `save_rui` always POSTs `/api/specs` — every save creates a **new** spec with a new ID and URL. There is no update-in-place.

**Watch for:**

- does the agent carry the *full* previous spec forward, or rebuild from memory and drop pieces (outcomes and transitions are the usual casualties)?
- does it re-validate before the second save, per its own workflow?
- does it tell the user this is a **new spec with a new URL**, not "updated"?
- one change requested → exactly one change made (no drive-by "improvements").
- **v1.2 draft-first after save:** the scripted S+1 turn uses explicit save phrasing ("save it again") → immediate re-save after validate. If the S+1 turn is a **change request without save phrasing**, expect a re-draft + confirm ask, not a save — log as finding if the agent saves without save intent.

Justification: iterate-after-seeing-it is the most human behavior in the whole doc, and it's also the seed for UC4 (`spec-update`) — what we observe here tells us what `load_spec` actually needs to do.

---

## After the runs

Three things to extract from the logs, all feeding directly back into `eval/cases/`:

1. **Which user turns were actually load-bearing.** Wherever a scenario needed a turn our current scripts don't have (data-cleaning answers in UC1-S4, the pushback exchange in UC3-S3, the interview in UC3-S4), that's a missing `conversationScript` step. Combined with the `mockApi` harness gap above, this is likely the real reason UC2/UC3 pass rates lag — the fix is scripts that carry the contract in-band, shaped like the successful runs here.
2. **Which input forms the agent handles natively** (JSON paste, CSV, YAML, sample responses, cURL notes, prose) vs. which need product guidance. Anything it handles well becomes a legitimate eval variant; anything it fumbles becomes either a prompt fix or an explicit "paste it like this" hint in the UI.
3. **Answers to the cross-run questions.** Across all runs, regardless of scenario:
   - Does it reliably distinguish pasted static data from an API contract (never inventing endpoints for UC1, never embedding static records for UC2/UC3)?
   - Once it has enough information, does it present a draft (v1.2) instead of saving prematurely or keep interviewing past the draft point?
   - On successful saves: zero `save_rui` before the save-intent turn and exactly one `save_rui` total (except S+1 re-save)?
   - Does it ever invent paths, envelopes, fields, or scope behavior it wasn't given?
   - Which successful paths were stable enough (same shape across reruns) to promote into scripted cases as-is?
   - Do D2/D3 no-save bails show Observe session state **`draft`** (not **`abandoned`**)?
