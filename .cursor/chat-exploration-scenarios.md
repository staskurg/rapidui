# Chat exploration scenarios — UC1 / UC2 / UC3

**Status:** exploration doc, written after Phase 7.3 sign-off. **Infra:** chat session persistence ✅ shipped — [plan](chat-session-persistence-plan.md). Ready for bulk UC1–UC3 scenario runs.
**Purpose:** manually walk the agent to a saved RUI spec through *human-realistic* conversations, so we learn which paths reliably reach `save_rui` and which stall. What we learn here becomes the raw material for stronger `conversationScript`s in `eval/cases/` — but this doc itself is not an eval plan. It's a script for a human sitting in `/chat`.

**Definition of done for every scenario:** the agent validates (≤5 attempts), calls `save_rui`, and shares a `viewUrl`. Anything else is a finding, not a failure to ignore.

**Deliberately out of scope:** failure paths (validation never passing, user abandoning mid-run). This doc maps the *successful* routes; unhappy paths are a later exercise.

---

## How to run

1. Start the agent service and the Next.js app (README, Path A), then open `/chat`. After the first message, the URL updates to `/chat/{sessionId}` ([chat-session-persistence-plan.md](chat-session-persistence-plan.md)).
2. **Fresh chat session per scenario run** — use **New chat** (new URL/session id). Never reuse a session; it contaminates the next run.
3. **Repeat each scenario 3 times** before moving on (`UC1-S1.1`, `.2`, `.3`, then UC1-S2, …). An `error` run (infra failure) does not count — rerun until you have 3 countable results. See [findings doc — run protocol](chat-exploration-findings.md#instructions-for-the-assisting-agent).
4. Paste user turns verbatim, including the code blocks. Wait for the agent to finish each reply before the next turn.
5. Where the evidence lives afterward:
   - **Full conversation (restore):** `/chat/{sessionId}` — same UI as the live run
   - **Transcript API:** `GET /api/chat/sessions/{sessionId}/transcript`
   - **Validate attempts, tool calls, errors:** `/observe/agent/sessions/{sessionId}` (human UI) or `npm run fetch:exploration-evidence -- {sessionId} {runId}` (assisting agent)
   - **The saved artifact:** the `viewUrl` the agent returns (`/specs/{id}`), or `GET /api/specs/{id}` with `X-RapidUI-Session-Id: {sessionId}` for JSON
6. **Log each run** in `.cursor/chat-exploration-findings.md` before starting the next run. Include the chat URL in each run entry.
7. **S+1 (post-save iteration):** run as an extra turn in the **same session** after a successful save. Log the parent scenario run **first**, then send the S+1 turn and log S+1 separately. Do not extract parent metrics after S+1 — they will include the follow-up turn.

**Workload:** 19 scenarios × 3 runs ≈ **57 base runs**, plus S+1 at least once per use case (3+), plus optional UC1-S2 riders. Budget accordingly.

## Scenario index

User-turn counts include the opener (the guided runner counts the first prompt as turn 1 and aborts past a case's `maxUserTurns` — currently 4 in all three cases; note UC3-S4 sits exactly at that cap).

| ID | Input form | Skill isolated | User turns |
|---|---|---|---|
| UC1-S1 | JSON paste (on request) | asks for data instead of inventing | 3 |
| UC1-S2 | CSV paste (up front) | CSV parsing, one-shot flow | 2 |
| UC1-S3 | none (invent) | believable invention, late requirement | 2 |
| UC1-S4 | messy JSON | column judgment, clarifying questions | 2–3 |
| UC1-S5 | inline JSON | restraint ("don't build yet"), scope expansion | 3 |
| UC1-S6 | API-shaped JSON envelope | static-vs-API discrimination at the boundary | 2 |
| UC2-S1 | prose endpoint list (on request) | interview for the API contract | 3 |
| UC2-S2 | everything in one prompt | skipping redundant questions | 2 |
| UC2-S3 | OpenAPI YAML | schema extraction, read vs write shapes | 2–3 |
| UC2-S4 | sample 200 responses | envelope/`valuePath` inference | 2 |
| UC2-S5 | prose, staged | re-planning when scope grows | 3 |
| UC2-S6 | cURL notes | normalizing concrete IDs to placeholders | 2 |
| UC3-S1 | story + endpoints | canonical HITL path | 2 |
| UC3-S2 | everything in one prompt | one-shot HITL | 2 |
| UC3-S3 | endpoints + invalid ask | pushback on row actions | 2 |
| UC3-S4 | prose, drip-fed | full discovery interview | 4 |
| UC3-S5 | different domain | pattern generalization | 2 |
| UC3-S6 | endpoints, no story | confirming human meaning | 2 |
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

All run logging lives in the companion doc: **`.cursor/chat-exploration-findings.md`** — agent instructions, [transcript extraction checklist](chat-exploration-findings.md#transcript-extraction-checklist), run-entry template, dashboard, per-use-case findings, and the final "changes to make" section. Log **every run** (3× per scenario) there before starting the next run. Assisting agent: `npm run fetch:exploration-evidence -- {sessionId} {runId}`.

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

**Watch for:** `data.mode: static` with the three records embedded verbatim; no invented endpoints; a sensible `/incidents` route.

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

**Watch for:** does it ask about `sev` ordering and the nested `assignee` object, or silently guess? Does it flatten `assignee.name`? Cryptic keys (`ttl`) should become human labels. This is the scenario that tells us how much data-cleaning conversation our eval scripts need to budget for.

---

### UC1-S5 — Second entity added after the plan is agreed

Drip-feed of scope. The canonical UC1 case asks for both screens up front; humans routinely don't.

**Turn 1 (user):**

> simple page listing our open incidents — severity, status, owner. don't build anything yet, just tell me what you'd make of this first. data: `[{"id":"INC-9","title":"API 500s","severity":"high","status":"open","owner":"Dana"},{"id":"INC-7","title":"Slow search","severity":"low","status":"open","owner":"Kenji"}]`

**Turn 2 (user, after agent proposes single-screen plan):**

> actually while you're at it add a second screen for teams. make up 3 teams, whatever. no need to link the two screens.

**Turn 3 (user):** "ok that's the plan. save it."

**Watch for:** restraint — the agent must *not* compose or save JSON on turn 1 when explicitly told to hold off; then extending its plan instead of restarting; two entities, each with its own entrypoint; no forced navigation between unrelated screens. Justification: scope expansion mid-flight is the #1 way real conversations diverge from our current two-line scripts, and "shape it with me first" is a common collaborative mode our scripts never exercise.

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

**Turn 1 (user):**

> I need an admin UI for our Users API.

**Expected agent behavior:** asks for endpoints / CRUD scope. It cannot proceed without them.

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

**Turn 3 (user):** "yes, build it."

**Watch for:** all four op types; delete embedded on `read`; `cta` transition browse→create; scope selector bound to `/api/companies`. This is exactly what the grader asserts, so any drift here is a prompt problem, not a case problem.

---

### UC2-S2 — Everything in one prompt (power user, zero clarification)

Some users front-load everything. Tests whether the agent can skip the interview when it genuinely has enough, or whether it asks redundant questions (a real UX cost).

**Turn 1 (user):**

> Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have email, role (admin|member), notes, active. Delete goes on the detail screen with a confirm. Validate and save when it passes.

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
>     post:
>       requestBody:
>         content:
>           application/json:
>             schema: { $ref: "#/components/schemas/UserWrite" }
>   /api/users/{userId}:
>     get: {}
>     patch:
>       requestBody:
>         content:
>           application/json:
>             schema: { $ref: "#/components/schemas/UserWrite" }
>     delete: {}
>   /api/companies:
>     get: {}
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

**Turn 2 (user):** answer its questions (delete on detail, yes company scope), then "build it."

**Watch for:** does it build forms from `UserWrite` — the write shape — rather than `User` (i.e. no `id` field on create/update forms)? Email as email input, role as select with the enum, active as checkbox? Does it carry the required `companyId` query param into every binding? Justification: if YAML-paste works, it's the lowest-effort onboarding story we have; if it doesn't, we know to say "paste an endpoint list" in the product copy instead. The read/write schema split is deliberate — building forms from the read shape is a silent, plausible-looking failure.

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

> to start I just want a read-only view of users: a list and a detail page. GET /api/users (returns {items: [...]}) and GET /api/users/{userId}. fields: email, role, active, notes.

**Turn 2 (user, after it proposes browse + read):**

> you know what, let's just do the whole thing while we're here. POST /api/users to create, PATCH /api/users/{userId} to edit, DELETE /api/users/{userId} — delete from the detail screen with a confirm. no company scope, single tenant.

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
> curl -X POST "/api/users?companyId=co_01" -d '{"email":"new@example.com","role":"member","active":true}'
>
> # update
> curl -X PATCH "/api/users/usr_101?companyId=co_01" -d '{"email":"maya@example.com","role":"admin","active":true}'
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

**Turn 2 (user):** "approve and reject are buttons on the detail screen, not on the rows. add a status filter on the inbox. build it."

**Watch for:** two `act` actions on `read` with outcomes (success should navigate back to the inbox); `row` transition inbox→detail; `presentation.filter` (singular) for status.

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

**Watch for:** whether the agent's questions actually cover the required inputs (or whether it starts building after turn 2 with no action endpoints — a guaranteed dead end); turns-to-save. Justification: this measures the interview quality directly, which is what our current thin-script evals for UC3 are really failing on — "we don't know yet how to communicate with the agent," and neither does a first-time user.

---

### UC3-S5 — Same shape, different domain (content moderation)

Swap support replies for AI-flagged marketplace listings. The RUI shape should be isomorphic to UC3; only fields, endpoints, and labels change.

**Turn 1 (user):**

> internal moderation queue: our classifier flags marketplace listings and a human decides. list of flagged listings with the flag reason and a score, click into one to see the listing, then either "remove listing" or "dismiss flag."
>
> API: GET /api/flags, GET /api/flags/{flagId}, POST /api/flags/{flagId}/remove-listing, POST /api/flags/{flagId}/dismiss.

**Turn 2 (user):** "both actions on the detail view. removing needs a confirm since it's destructive. build and save."

**Watch for:** the two acts generalized correctly (labels/variants — "remove listing" should read as the dangerous one, with a `confirm`); no support-domain residue. Justification: if UC3 only works when the words "draft" and "approve" appear, our agent has memorized the eval case rather than learned the pattern. This scenario is the honesty check, and it directly seeds a future eval variant with different `dataPath` assertions.

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

**Watch for:** does the agent ask about *meaning* (what is a draft, what does a reviewer judge) or only mechanics? Does it correctly refuse to treat approve/reject as create/update CRUD writes? Justification: paired with UC3-S4 this isolates the two halves of discovery — S4 has the story and no contract, S6 has the contract and no story. If either half fails, we know which side the eval scripts need to spell out.

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
- does it tell the user this is a new spec with a new URL, or hand back a link with no explanation?
- one change requested → exactly one change made (no drive-by "improvements").

Justification: iterate-after-seeing-it is the most human behavior in the whole doc, and it's also the seed for UC4 (`spec-update`) — what we observe here tells us what `load_spec` actually needs to do.

---

## After the runs

Three things to extract from the logs, all feeding directly back into `eval/cases/`:

1. **Which user turns were actually load-bearing.** Wherever a scenario needed a turn our current scripts don't have (data-cleaning answers in UC1-S4, the pushback exchange in UC3-S3, the interview in UC3-S4), that's a missing `conversationScript` step. Combined with the `mockApi` harness gap above, this is likely the real reason UC2/UC3 pass rates lag — the fix is scripts that carry the contract in-band, shaped like the successful runs here.
2. **Which input forms the agent handles natively** (JSON paste, CSV, YAML, sample responses, cURL notes, prose) vs. which need product guidance. Anything it handles well becomes a legitimate eval variant; anything it fumbles becomes either a prompt fix or an explicit "paste it like this" hint in the UI.
3. **Answers to the cross-run questions.** Across all runs, regardless of scenario:
   - Does it reliably distinguish pasted static data from an API contract (never inventing endpoints for UC1, never embedding static records for UC2/UC3)?
   - Once it has enough information, does it *stop asking* and go validate → save, or does it keep interviewing?
   - Does it ever invent paths, envelopes, fields, or scope behavior it wasn't given?
   - Which successful paths were stable enough (same shape across reruns) to promote into scripted cases as-is?
