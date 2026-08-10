# Chat agent v1.2 — plan

**Status:** planned (2026-08-10). Follows the chat exploration cycle ([scenarios](chat-exploration-scenarios.md), [findings](chat-exploration-findings.md)).
**Goal:** the agent presents a validated **draft** and waits for user confirmation before `save_rui` — unless the user explicitly asked to save. Ship as **prompt v1.2** together with the other exploration-driven prompt fixes, improve **agent Observe** (session milestone funnel + list UI polish: env, cost, drop empty eval-case column), update the exploration docs, re-run the explorations, then update eval cases.
**Gates Phase 7.4 baselines:** yes — do not persist or compare baselines until the re-run confirms the new flow is stable (see [Sequencing](#sequencing--exit-criteria)). **7.4 schema/work (`007`/`008`, `evalTrials.ts`) may be drafted in parallel** with WS1–WS4; first `eval:run` batches and baseline snapshots wait for exit criteria.

---

## Motivation (run evidence)

The post-v1.1 failure mode is **premature saving**, not under-informing:

- UC3-S6.1–.3 — agent saved in the same reply as turn 1; scripted turn 2 unreachable 3/3.
- UC3-S1.3 — one-shot save dropped the load-bearing status-filter turn.
- UC1-S4.1–.3 — saved messy-JSON specs 3/3 without asking `sev` ordering / nested `assignee` / timestamp semantics.
- UC3-S4.1 — saved before approve/reject endpoints existed; invented spurious `op-update-draft`.
- UC1-S3.1/.3, UC2-S5.1–.3 — interim "dual saves" creating throwaway spec rows.

One rule — *validated draft first, save only on user confirmation* — addresses all five patterns, and matches the product direction (chat panel preview/renderer as the draft review surface; save = publish). **Draft UI already exists:** `lib/demo/useSpecPanelListener.ts` drives the panel from passing `validate_rui` — no new frontend work in this plan.

## Locked decisions

1. **Draft-first gate with explicit-save escape hatch.** No save instruction from the user → agent presents a draft and waits. Explicit save intent (e.g. "save it", "validate and save", "build and save") → save immediately after a passing validate. Evidence the escape hatch matters: UC2-S2, UC3-S2, UC3-S5 went 3/3 clean as one-shots *because* the opener said save.
2. **A draft is a validated, unsaved spec presented in the chat panel.** No new tools, no DB draft rows, no spec status column. `save_rui` keeps its single meaning (publish, POSTs `/api/specs`). Chat session persistence (shipped 2026-08-08, migration **009**) makes the draft survive refresh.
3. **Draft presentation is one consolidated turn** — summary of what will be built (screens, operations, bindings) + spec visible in the panel + exactly one ask ("any changes, or should I save it?"). Validation happens **before** presenting, so the confirm turn is never spent on an invalid spec. Do not regress into pre-v1.1 serial interviewing.
4. **Observe: outcome + milestone (not a `draft` outcome).** Keep lifecycle **outcomes** small (`saved` / `failed` / `abandoned` / `in_progress`). Add a derived **milestone** from `api_events`: `none` → `validated` → `saved`. The funnel metric we care about — **Validated, not saved** — is `milestone = validated` (≥1 passing validate, no save). Ingest enum unchanged; both axes retroactive over history.
5. **`maxUserTurns: 5`** on eval cases (was 4) — draft/confirm turns make 4 tight; UC3-S4-style discovery + confirm needs the headroom. Supersedes v1.1 findings guidance that `maxUserTurns: 3` was viable post-fix.
6. **All v1.2 prompt fixes ship in one cutover** (one re-baseline, not two).
7. **Agent Observe list polish.** Drop **eval case** from the list table and filters (almost always empty on manual `/chat` — case performance belongs on `/observe/evals`). Add **`env`** (`local` | `prod`) so local dev sessions don't pollute prod metrics. Add **est. cost** beside tokens (derived from turn token counts + model price table). Keep `eval_case_id` in DB for `eval:run` cross-links; show on session detail only when set.

### Observe model (reference)

| Layer | Question | Values |
|---|---|---|
| **Outcome** | How did the session end? | `in_progress` · `saved` · `failed` · `abandoned` · `abandoned_inferred` |
| **Milestone** | How far did they get? | `none` · `validated` · `saved` |

**Validated, not saved** = milestone `validated` (any outcome except `saved`). Typical cases: `abandoned` + validated (user left after green validate); `in_progress` + validated (still in chat with draft in panel).

---

## Workstream 1 — Prompt v1.2

**Files:** `agent/prompts/v1.2.txt` (copy from `v1.1.txt`, then edit) · set in `agent/.env`: `RAPIDUI_AGENT_PROMPT_VERSION=v1.2` (maps to `rapidui_agent_prompt_version` in `agent/config.py`).
**Remember:** restart the agent service — uvicorn `--reload` does not watch `prompts/*.txt`. Verify Observe shows `prompt_version: v1.2` on the first run.
**Headline diff from v1.1:** replace workflow step 5 ("When validation passes, call `save_rui`") with the save gate below.

### Rules to add

1. **Save gate (the headline change).**
   - After composing and passing `validate_rui`, present the draft (rule 2) and **wait**. Call `save_rui` only after the user expresses save intent.
   - **Escape hatch:** if the user's request already contains explicit save intent, save immediately after a passing validate — do not add a dead confirm turn.
   - "Looks good", "yes, build it" style confirmations of a *plan* are not save intent by themselves **unless** the agent's draft turn asked "should I save it?" — then an affirmative reply is save intent.
   - **Eval scripts:** confirm turns must use explicit save phrasing ("save it", "looks good — save it") — "build it" alone is not save intent (see WS5).
2. **Draft presentation shape.** One turn: concise summary (screens, operations, data bindings, anything inferred rather than given) + note that the spec is in the panel + one closing question. No new interview questions in the draft turn.
3. **Iteration loop.** On change requests: rebuild the **full** draft (carry everything forward — outcomes and transitions are the known casualties, evidence S+1 watch-fors), re-validate, re-present. Exactly one `save_rui` per approved spec.
4. **Envelope / `valuePath` question.** When binding a list operation to an API endpoint whose response shape was not given, ask one question (bare array vs `{items: [...]}`) before drafting — evidence: browse `valuePath` omitted 3/3 in UC2-S1 post-fix and 3/3 in UC3-S1; missing `valuePath` renders an empty table (worst silent failure).
5. **Messy-data semantics.** When pasted records contain cryptic keys, nested objects, or epoch-timestamp-like numbers, clarify *those* before drafting (severity ordering, flatten-or-drop nested fields, human-readable dates) — not domain naming/filters. Evidence: UC1-S4.1–.3 interviewed on the wrong axis 3/3; `created_ts` embedded raw 3/3.
6. **HITL hold.** Do not present a review-queue draft as complete (and never save one) until the action endpoints (approve/reject or equivalents) are known. Do not default to update/send operations the user did not request. Evidence: UC3-S4.1.
7. **Minor nudges.** Enum-like fields with known values → `select`, not `text` (UC2-S4.1/.2 `role`). After a post-save iteration, say the result is a **new spec with a new URL**, not "updated" (S+1.1/.2 wording finding).
8. **Plan-only mode (UC1-S5).** When the user asks to hold off ("don't build yet", "just tell me what you'd make"), respond with a prose operations plan only — **no `validate_rui`, no draft JSON, no save**. Draft-first must not collapse this into "always validate then draft." Once the user adds scope or says to build, proceed through the normal discover → validate → draft → confirm loop.

### Checklist (WS1)

- [ ] `agent/prompts/v1.2.txt` created with rules 1–8
- [ ] `RAPIDUI_AGENT_PROMPT_VERSION=v1.2` set in `agent/.env`; agent restarted; Observe shows `v1.2`
- [ ] Spot-check 4 manual chats: (a) no save word → draft + confirm → save; (b) "validate and save" opener → one-shot; (c) change request on draft → rebuilt draft, single final save; (d) "don't build yet" opener → plan only on turn 1, no validate (UC1-S5 shape)

---

## Workstream 2 — Observe agent dashboard

Two parallel tracks on `/observe/agent`: **session milestone** (funnel analytics) and **list UI/UX polish** (env, cost, eval-case cleanup). Same files, ship together.

---

### 2A — Session milestone

**Design: two axes, both derived at display time from existing telemetry.** Outcomes stay on `resolveAgentRunOutcome()` — unchanged enum. Milestone is a **separate column/chip**, not a replacement outcome.

**Milestone resolution** (from `api_events`, authoritative):

| Milestone | Rule |
|---|---|
| **`saved`** | ≥1 successful `POST /api/specs` (same signal as saved outcome) |
| **`validated`** | ≥1 passing `POST /api/validate` (`valid IS TRUE`) and no save |
| **`none`** | No passing validate (may still have failed validate attempts) |

**Headline funnel metric:** **`validatedNotSavedCount`** — sessions where `milestone === 'validated'`. Includes in-progress sessions still sitting on a draft (useful live signal) and abandoned sessions that never confirmed save.

**Do not** add `draft` to `AgentRunOutcome`. Abandoned stays Abandoned; milestone tells you *how far* they got.

### Tasks

1. **`lib/observe/queries.ts`**
   - Add `AgentSessionMilestone` type: `"none" | "validated" | "saved"`.
   - Add `resolveAgentSessionMilestone(hasPassingValidate, hasSave)` — pure function.
   - Add `sessionHasPassingValidate(sessionId)` and `sessionHasSave(sessionId)` helpers (or one `getSessionMilestoneSignals(sessionId)` query).
   - Extend `AgentRunListRow` + `AgentRunDetail.run` with `milestone: AgentSessionMilestone`.
   - Extend `AgentObserveSummary` with `validatedNotSavedCount` (and optionally `milestoneSavedCount` for cross-check).
   - Wire milestone into `listAgentRuns`, `getAgentRunDetail`, `getAgentObserveSummary`.
2. **Dashboard** (`app/observe/agent/page.tsx`) — keep existing outcome stat cards; add **Validated, not saved** stat card + `lib/observe/metric-tooltips.ts` copy ("Reached a passing validate but never published a spec").
3. **Session list + detail** — outcome badge unchanged; add **`AgentSessionMilestoneBadge`** (or chip on list row): None / Validated / Saved. Detail view shows both outcome and milestone.
4. **Filters** — add **Milestone** filter (all · none · validated · saved). Optional compound preset: outcome = abandoned + milestone = validated ("validated leak").
5. **`lib/observe/__tests__/resolveAgentSessionMilestone.test.ts`** — cases: no validate → none; passing validate only → validated; save → saved (even if validate also ran); failed validates only → none.
6. **`scripts/smoke-observe-agent.ts`** — exercise milestone resolution alongside outcomes.
7. **`scripts/fetch-exploration-evidence.ts`** — print `milestone` + outcome; suggest exploration label: `no-save` + milestone `none` vs `validated` ("validated, not saved").

### Checklist (WS2A)

- [ ] `AgentSessionMilestone` + `resolveAgentSessionMilestone()` + api_events helpers implemented
- [ ] List/detail rows include milestone; summary includes **Validated, not saved** count
- [ ] Milestone badge on list/detail; tooltip copy added
- [ ] Milestone filter (and optional validated-leak preset) on `/observe/agent`
- [ ] Unit tests + smoke script pass; existing outcome tests unchanged
- [ ] Evidence script reports outcome + milestone

---

### 2B — Agent list UI/UX polish

**Problem today:** Eval case column is empty for almost all rows — `eval_case_id` is only set when `eval:run` sends `X-RapidUI-Eval-Case` or chat starts from a starter chip with a pending case. Manual exploration and normal `/chat` never populate it. Mixing localhost and rapidui.dev sessions makes aggregate latency/tokens/save-rate misleading.

**Principle:** Agent Observe answers *"what happened in chat sessions?"* Eval Observe (7.6) answers *"how did eval cases perform?"* Link **trial → agent session**, not eval case on every agent row.

#### List table (`app/observe/agent/page.tsx`)

| Change | Detail |
|---|---|
| **Remove** eval case column + filter | Drop from list and filter bar. Keep `eval_case_id` on `agent_runs` for automated runs. |
| **Add env** column | Values: `local` · `prod` · `—` (legacy rows). Filter: All / local / prod. |
| **Add est. cost** column | Immediately after **Tokens**. Label **Est. cost**; show `—` when model or turn tokens missing. |
| **Keep** | Session, Outcome, Model, Validates, Platform calls, Tokens, Started — plus milestone chip from 2A. |

**Suggested column order:** Session · Outcome · Milestone · Env · Model · Validates · Platform calls · Tokens · Est. cost · Started

#### Session detail (`app/observe/agent/sessions/[sessionId]/page.tsx`)

- Show **env**, **milestone**, **est. cost** in summary.
- **Eval case:** only when `eval_case_id` is set — muted link line ("Eval case: …") pointing at `/observe/evals` trial when 7.6 exists; plain text until then. Not a primary field.

#### Env ingest

| Source | How |
|---|---|
| **Agent** | Include `env` on run payload from `RAPIDUI_ENV` (`local` \| `prod`) in `agent/config.py` + `agent/telemetry.py`. |
| **Next.js** | Same env var at ingest if run row is created from the app side. |
| **Defaults** | `local` when unset in development; `prod` on deployed rapidui.dev (document in README / agent `.env.example`). |

**Schema:** migration **`010_agent_runs_env.sql`** — `ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS env TEXT NULL;` Index optional (`env` + `started_at` for filtered dashboards). Existing rows stay `NULL` → display `—`.

#### Est. cost (display-derived for v1.2)

- **Input:** sum `agent_turns.input_tokens` / `output_tokens` for the session + `agent_runs.model`.
- **Price table:** `lib/observe/modelPricing.ts` — minimal hardcoded USD per 1M tokens for models in use (`o4-mini` first). Full versioned table deferred to **7.7**; stub is enough for session-level "how much did this chat cost?"
- **Formula:** `(input × inputPrice + output × outputPrice) / 1e6`. No persist on `agent_runs` in v1.2 — compute in query or list mapper (same pattern as milestone).
- **Summary card (optional):** avg est. cost per saved run — only when ≥3 saved runs with cost computable.

#### Eval case — what stays

| Keep | Remove from agent UI |
|---|---|
| `eval_case_id` column in DB + ingest | List column + filter dropdown |
| `listDistinctEvalCases` for API Observe if used there | — |
| Cross-link eval trial → agent session (7.6) | Eval case performance metrics on agent page |

### Tasks (2B)

1. Migration **`010_agent_runs_env.sql`** + register in `scripts/migrate.ts`.
2. **`lib/observe/schemas.ts`** — optional `env` on run payload enum (`local` \| `prod`).
3. **`agent/config.py`** + **`agent/telemetry.py`** — read `RAPIDUI_ENV`, include on ingest.
4. **`lib/observe/modelPricing.ts`** + **`estimateSessionCostUsd(model, inputTokens, outputTokens)`**.
5. **`lib/observe/queries.ts`** — `env` on list/detail rows; aggregate turn tokens for cost; `listDistinctEnvs()` for filter; extend `AgentObserveFilters.env`.
6. **`app/observe/agent/page.tsx`** — remove eval case UI; add env filter, env + est. cost columns.
7. **`app/observe/agent/sessions/[sessionId]/page.tsx`** — env, cost, conditional eval case line.
8. **`lib/observe/metric-tooltips.ts`** — env + est. cost copy.
9. **Tests** — pricing helper unit tests; smoke ingest with `env: local`.

### Checklist (WS2B)

- [ ] `env` migrated, ingested from agent, filterable on dashboard
- [ ] Eval case removed from agent list + filters; detail shows eval case only when set
- [ ] Est. cost column + pricing helper; `—` when data insufficient
- [ ] Tooltips + smoke coverage

### Checklist (WS2 — both tracks)

- [ ] WS2A + WS2B complete (milestone + list polish ship together on `/observe/agent`)

---

## Workstream 3 — Exploration docs update (before the re-run)

Update **before** running, so watch-fors and turn shapes are defined up front.

### `chat-exploration-scenarios.md`

1. **Definition of done** now has two valid terminal shapes: (a) explicit-save opener → one-shot save; (b) draft presented → user confirms → save. Saving without either is a finding (`saved-unconfirmed`).
2. **Per-scenario save-intent classification table** — for each of the 19 scenarios: which turn carries save intent, and therefore the earliest legitimate save turn. Examples:
   - **One-shot (escape hatch):** UC2-S2, UC3-S2, UC3-S5 — save intent in opener or turn 1.
   - **Turn 2 save after draft:** UC1-S2 ("go ahead and save"), UC3-S6 turn 2 ("save it when it's good" — **not** turn 1; turn 1 is endpoints-only, agent must interview first).
   - **Turn 3+ save:** UC1-S1 turn 3 ("save it") — under v1.2 the previously skipped turn 3 becomes reachable and required.
   - **Ambiguous "build it" turns:** UC2-S1 turn 3, UC3-S1 turn 2 — not save intent until agent's draft turn asks "should I save it?" or user says "save".
   - **S+1 (post-save iteration):** rule 1 applies after a save too. The scripted S+1 turn keeps explicit phrasing ("save it again") → immediate re-save; an S+1 change request *without* save phrasing should produce a re-draft + confirm ask, not a save. Add this as an S+1 watch-for.
3. **Global watch-fors added to every scenario:**
   - *No `save_rui` before user save-intent turn.*
   - *Draft turn contains summary + single confirm ask.*
   - *Plan-only restraint when user said "don't build yet" (UC1-S5).*
4. **New D-series scenarios** (draft-workflow isolation; run on the UC2 users-admin domain to reuse known contracts):
   - **D1 — power-user explicit save:** UC2-S2 opener verbatim (contains "Validate and save when it passes"). Expect one-shot save, no draft detour. Tests the escape hatch.
   - **D2 — complete contract, no save word:** UC2-S2 turn 1 **without** the final sentence — opener verbatim:
     > Build a users admin. Full CRUD. API: GET/POST /api/users, GET/PATCH/DELETE /api/users/{userId}, GET /api/companies for a required company scope selector — list and item calls take ?companyId={scope.companyId}. Users have id, email, role (admin|member), notes, and active (boolean). List and companies responses wrap arrays in `{items: [...]}`; company options use `id` + `name`. Delete goes on the detail screen with a confirm.
     Turn 2: "looks good, save it" → save. Expect draft + summary + confirm ask on turn 1, **no save** until turn 2. Tests the gate.
   - **D3 — draft iteration:** D2 opener; turn 2 requests a change ("drop the notes column, add a status badge"); expect rebuilt re-validated draft with everything else carried forward, no save; turn 3 confirms → save. Exactly **one** save in the session. Tests iterate-then-save.
5. **Turn-count / workload table updated:**
   - **Stays ~same:** UC2-S2, UC3-S2, UC3-S5 (explicit save in opener); UC1-S2 (turn 2 already says "save").
   - **Gains a turn:** UC1-S1, UC2-S1, UC3-S1, UC3-S6, most non-explicit-save 2-turn flows → typically 3-turn (draft + confirm).
   - **+9 D-series runs** (D1–D3 × 3); total ~66 base + S+1.

### `chat-exploration-findings.md`

1. New platform marker: **`post-fix (prompt v1.2 draft-first)`**; v1.1 entries stay as baseline — do not merge stability counts across versions.
2. **Result vocabulary:** add **`saved-unconfirmed`** — saved before user save intent (off-target even when the artifact is correct).
3. Extraction checklist additions: identify the draft turn in the transcript; confirm zero `save_rui` tool parts before the save-intent turn; on successful saves confirm exactly **one** `save_rui`; log Observe **outcome + milestone** (`validated` + not saved = funnel leak).
4. Fresh dashboard section for v1.2 runs (keep the v1.1 dashboard as-is above it).
5. **Update "Changes to make":** mark v1.1 prompt/runner items superseded by this plan; link here.

### Checklist (WS3)

- [ ] Scenarios doc: definition of done, save-intent table, global watch-fors, D1–D3, workload updated
- [ ] Findings doc: v1.2 marker, `saved-unconfirmed`, checklist additions, fresh dashboard, "Changes to make" header updated

---

## Workstream 4 — Exploration re-run

Protocol unchanged (fresh session per run, 3 countable runs per scenario, log before next run).

- **Scope:** all 19 base scenarios + D1–D3, 3× each (~66 runs), plus S+1 at least once per use case.
- **Priority order if time-boxed:** D1–D3 first (the new behavior), then the premature-save victims (**UC3-S6, UC3-S1, UC1-S1, UC1-S4, UC3-S4, UC1-S3, UC2-S5**), then the rest.
- **What the re-run must answer:**
  1. Does the gate hold without regressing into over-interviewing (turns-to-save vs v1.1 baselines +1, not +2/+3)?
  2. Does the escape hatch keep one-shots one-shot (D1, UC2-S2, UC3-S2, UC3-S5)?
  3. Do drafts survive iteration intact (D3, S+1 carry-forward watch-fors)?
  4. Did rules 4–6 land (browse `valuePath` present or asked in UC2-S1/UC3-S1; semantics questions in UC1-S4; no premature HITL save in UC3-S4)?
  5. Do dual-saves disappear (UC1-S3, UC2-S5 → single save at confirm)?
  6. **Transcript audit:** on successful runs, zero `save_rui` before save-intent turn and exactly one `save_rui` total.
  7. **Funnel:** D2/D3 `no-save` stalls show milestone **validated** in Observe (not confused with early abandon = milestone **none**).
- **Deliverable:** findings report + updated "Changes to make" section (supersede v1.1 items, cite v1.2 run IDs), same shape as the v1.1 cycle.

### Checklist (WS4)

- [ ] D1–D3 stable (3/3 each on expected flow)
- [ ] Premature-save victims re-run clean under v1.2
- [ ] Full base set re-logged with v1.2 marker
- [ ] Findings blocks + cross-run findings drafted and confirmed
- [ ] "Changes to make" updated; v1.1 guidance marked superseded

---

## Workstream 5 — Eval case updates (after the re-run, before 7.4 baselines)

Informed by re-run turn shapes; carries forward the P0 items from the exploration analysis.

1. **Resolve the `mockApi` harness gap** — recommended: delete the `mockApi` blocks from `crud-admin-v0.2.json` / `ai-review-queue-v0.2.json` and carry contracts inside prompt/script turns (matches how every successful exploration run delivered them). Alternative (only if there's a reason to keep the block): make `scripts/eval-run.ts` render it into the prompt. **`spec-update-v0.2` unchanged** — UC4 / no `load_spec`; already at `maxUserTurns: 5`.
2. **`crud-admin-v0.2`** — turn 2 = full contract (endpoints + CRUD rules + scope + **field list**, UC2-S1 scenario wording); add confirm turn with explicit save ("Looks good — save it." — not "Yes, build it."); `maxUserTurns: 5`. Scope-fork turn 3 may become optional if agent drafts without re-asking — script should tolerate skip.
3. **`ai-review-queue-v0.2`** — prompt carries endpoints + field keys + `{items:[...]}` envelope (UC3-S1/S2 wording); turn 2 = detail-buttons + status filter clarify; confirm turn with explicit save; `maxUserTurns: 5`.
4. **`static-browse-v0.2`** — opener already says "Validate and save when the spec passes" → stays the explicit-save/one-shot case; bump `maxUserTurns: 5` for consistency.
5. **New variant cases** (Phase **7.5** behavioral variants):
   - **7.5 blockers (required before 7.7):**
     - Clarification variant (UC3-S4 4-turn shape) — discovery interview.
     - Negotiation variant (UC3-S3 shape) — row-actions pushback, uses existing `forbiddenEmbeddedAction`.
   - **Also script (may land with 7.5):**
     - Power-user one-shot (D1 / UC2-S2 shape) — escape-hatch regression case.
     - Draft-iterate (D3 shape) — correction-style variant; assert single final spec with the change applied.
6. **Runner note:** driver's stop-on-save already tolerates both flows (draft turns are ordinary agent replies; script advances on `after_agent_reply`). Draft-first should eliminate routine dual-saves; keep "grade the **latest** save" as a known runner improvement for S+1-style cases, tracked for 7.4's `final_spec_id` semantics (= last save).

### Checklist (WS5)

- [ ] `mockApi` decision executed (delete or render)
- [ ] UC1–UC3 canonical cases updated (contracts in-band, explicit-save confirm turns, `maxUserTurns: 5`); goldens/grader still pass
- [ ] `eval:run` green on all three updated cases locally
- [ ] 7.5 blocker variant JSONs drafted (UC3-S4 clarification + UC3-S3 negotiation)
- [ ] Optional variant JSONs drafted (D1 one-shot, D3 iterate)

---

## Sequencing & exit criteria

```txt
WS1 prompt v1.2        ─┐
WS2 Observe dashboard    ─┼→ WS3 docs update → WS4 re-run explorations → WS5 eval cases → Phase 7.4 baselines
  (2A milestone + 2B UI)  ┘   (WS1+WS2 parallel; WS3 before any v1.2 run is logged)
                          │
                          └── 7.4 migrations / evalTrials.ts may be built in parallel (no baselines until exit criteria)
```

**Proceed to 7.4 baselines when:** D1–D3 stable 3/3 · premature-save victims clean under v1.2 · one-shots still one-shot · **Validated, not saved** + **env filter** visible in Observe · UC1–UC3 eval cases updated and passing `eval:run` locally · 7.5 blocker variants drafted.

**Then in 7.4:** persist trials with `prompt_version: v1.2` in the config snapshot; `final_spec_id` = latest save. *(Optional v0.3+: persist `milestone` on `eval_trials` process snapshot for automated funnel reporting.)*

## Out of scope

- DB draft rows / spec status column / new agent tools (draft is in-chat only — decision 2; panel wiring already shipped)
- Ingest contract changes for **milestone** or **est. cost** (both display-derived in v1.2; **`env`** is the one new persisted run field via migration **010**)
- Full **7.7** versioned model price table (v1.2 uses `lib/observe/modelPricing.ts` stub)
- New `draft` agent outcome enum (superseded by outcome + milestone model)
- `load_spec` / UC4 / `spec-update-v0.2` (unchanged: post-v0.2)
- New renderer/preview tab work (panel already shows draft from `validate_rui`; separate polish track if needed)
- Validator/schema changes (v1.1-cycle rules closed the known classes; none needed here)
