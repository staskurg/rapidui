# Chat agent v1.2 — plan

**Status:** WS1–WS3 complete (2026-08-10). WS4–WS5 pending. Follows the chat exploration cycle ([scenarios](chat-exploration-scenarios.md), [v1.1 findings](chat-exploration-findings.md), [v1.2 findings](chat-exploration-findings-v1.2.md)).
**Goal:** the agent presents a validated **draft** and waits for user confirmation before `save_rui` — unless the user explicitly asked to save. Ship as **prompt v1.2** together with the other exploration-driven prompt fixes, improve **agent Observe** (single **session state** column including **Draft** funnel + optional list UI polish: env, cost, drop empty eval-case column), update the exploration docs, re-run the explorations, then update eval cases.
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
4. **Observe: single session state (not outcome + milestone).** Replace the five-value `AgentRunOutcome` display model (`saved` / `failed` / `abandoned` / `abandoned_inferred` / `in_progress`) with one derived **`AgentSessionState`**: `saved` · `draft` · `active` · `failed` · `abandoned`. The v1.2 funnel metric is **`draft`** — passing validate, no published spec. Ingest still writes terminal hints to `agent_runs.outcome` (`saved` / `failed` / `abandoned`); display state is event-derived. Retires `abandoned_inferred` from the UI and supersedes the 2026-08-07 persistence-plan rule that transcript sessions stay `in_progress` forever ([supersession notes](#observe-session-state-supersedes-persistence-plan)).
5. **`maxUserTurns: 5`** on eval cases (was 4) — draft/confirm turns make 4 tight; UC3-S4-style discovery + confirm needs the headroom. Supersedes v1.1 findings guidance that `maxUserTurns: 3` was viable post-fix.
6. **All v1.2 prompt fixes ship in one cutover** (one re-baseline, not two).
7. **Agent Observe list polish (WS2B — non-gating).** Drop **eval case** from the list table and filters (almost always empty on manual `/chat` — case performance belongs on `/observe/evals`). Add **`env`** (`local` | `prod`) so local dev sessions don't pollute prod metrics. Add **est. cost** beside tokens (derived from turn token counts + model price table). Keep `eval_case_id` in DB for `eval:run` cross-links; show on session detail only when set. **Does not gate 7.4 baselines** — ship when convenient; re-run needs only WS2A **Draft** state.

### Shipped deviations (2026-08-10)

WS1–WS2 shipped with these intentional differences from the plan text below:

| Deviation | Plan said | Shipped |
|---|---|---|
| **State funnel location** | Saved / Draft / Active / … stat cards on `/observe/agent` | Funnel on **`/observe` hub** only (Runs · Saved · Draft · Active); agent page has state badge + filter per row |
| **Agent dashboard cards** | Replace outcome cards with state cards | **Tokens + est. cost** cards instead (operational focus) |
| **Est. cost pricing** | List price only (`input × price + output × price`) | **Cache-aware** via migration **011** + `cache_read_tokens`; `~` prefix for legacy rows without cache data |
| **`env` ingest** | Python agent + Next.js | **Python agent only** (`RAPIDUI_ENV` in `agent/config.py` + `agent/telemetry.py`) |

### Observe session state (reference — locked)

One column answers: *where is this session in the journey?*

| State | Meaning |
|---|---|
| **`saved`** | Spec published (≥1 successful `POST /api/specs` in `api_events`) |
| **`draft`** | Passing validate, no save — draft ready in panel (live or stale); **v1.2 funnel metric** |
| **`active`** | Recent activity, no passing validate yet — still working toward a draft |
| **`failed`** | Explicit terminal agent/harness failure (`agent_runs.outcome = 'failed'`) — **not** "last validate was red" |
| **`abandoned`** | Idle/closed, never reached a passing validate |

**Derivation** (display-only; precedence top to bottom):

```typescript
hasSave           = api_events: successful POST /api/specs
hasPassValidate   = api_events: POST /api/validate AND valid = true
dbFailed          = agent_runs.outcome = 'failed'
dbAbandoned       = agent_runs.outcome = 'abandoned'
isRecent          = last activity < AGENT_STALE_SESSION_MS

if hasSave                              → saved
if dbFailed                             → failed   // above draft — crash after green validate → Failed
if hasPassValidate && !hasSave          → draft
if dbAbandoned                          → abandoned  // short-circuit recency (New chat without validate)
if isRecent                             → active
else                                    → abandoned
```

**Semantics worth locking in the plan:**

- **`failed`** = explicit terminal agent/harness failure only. Failed validate retries are normal; do not mirror API Observe's `lastValidateValid === false` rule.
- **`dbFailed` above `hasPassValidate`:** a session that reached a green draft and then hit a terminal error shows **Failed**, not Draft — crash is more actionable than a stale draft.
- **`hasPassValidate` above `dbAbandoned`:** New chat after a green draft (exploration protocol) → **Draft**, not Abandoned. Explicit abandon without validate → **Abandoned** immediately (fixes the old "Active for 30m" bug).
- **Resume self-healing:** state flips back to **active** / **draft** when **new turns or api_events** update recency — opening `/chat/{sessionId}` alone does not move `last_activity_at`.
- **Ingest unchanged:** `agent_runs.outcome` remains `saved` | `failed` | `abandoned` | null. Save signal authoritative from `api_events`, same as API Observe.
- **Retired from UI:** `AgentRunOutcome`, `abandoned_inferred`, milestone axis, separate "Validated, not saved" metric (= **Draft count**).

### Observe session state supersedes persistence plan

The 2026-08-07 amendment ([chat-session-persistence-plan.md](chat-session-persistence-plan.md)) locked: sessions with `transcript_jsonb` never go stale — stay **`in_progress`** until explicit terminal outcome. **Superseded by this model:** stale transcript sessions without a passing validate → **abandoned**; with passing validate → **draft**. Update persistence plan, Phase 6/7.3½ in [rapidui-v0.2-implementation.md](rapidui-v0.2-implementation.md), and [agent/README.md](../agent/README.md) when WS2A ships.

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

- [x] `agent/prompts/v1.2.txt` created with rules 1–8
- [x] `RAPIDUI_AGENT_PROMPT_VERSION=v1.2` set in `agent/.env`; agent restarted; Observe shows `v1.2`
- [x] Spot-check 4 manual chats: (a) no save word → draft + confirm → save; (b) "validate and save" opener → one-shot; (c) change request on draft → rebuilt draft, single final save; (d) "don't build yet" opener → plan only on turn 1, no validate (UC1-S5 shape)

---

## Workstream 2 — Observe agent dashboard

Two tracks on `/observe/agent`: **2A session state** (required for v1.2 re-run) and **2B list UI polish** (optional cleanup — **non-gating** for 7.4).

---

### 2A — Session state (replaces outcome + milestone)

**Design:** one derived **`AgentSessionState`** per session — see [Observe session state (reference)](#observe-session-state-reference--locked). Replaces `resolveAgentRunOutcome()` / `AgentRunOutcomeBadge` in the UI. Both Agent and API Observe trust **`api_events`** for save and validate signals; Agent Observe adds **draft** / **abandoned** / **active** split.

**Headline funnel metric:** **`draftCount`** — sessions in **`draft`** state (passing validate, no save). Includes live sessions awaiting confirm and exploration runs where the human clicked New chat after a green draft.

### Tasks

1. **`lib/observe/queries.ts`**
   - Add `AgentSessionState` type: `"saved" | "draft" | "active" | "failed" | "abandoned"`.
   - Add `resolveAgentSessionState(signals)` — pure function implementing the locked precedence.
   - Add helpers for `hasSave`, `hasPassValidate` from `api_events` (batch in list/summary queries).
   - Replace `outcome: AgentRunOutcome` with `state: AgentSessionState` on `AgentRunListRow` + `AgentRunDetail.run`.
   - Replace summary counts: `savedCount`, `draftCount`, `activeCount`, `abandonedCount`, `failedCount` (drop `inProgressCount`, merge inferred abandon into `abandonedCount`).
   - Wire into `listAgentRuns`, `getAgentRunDetail`, `getAgentObserveSummary`.
2. **Dashboard** (`app/observe/agent/page.tsx`) — replace outcome stat cards with **Saved / Draft / Active / Abandoned / Failed**; tooltip on **Draft**: "Reached a passing validate but never published a spec".
3. **Session list + detail** — replace `AgentRunOutcomeBadge` with **`AgentSessionStateBadge`**; single **State** column (not Outcome + Milestone).
4. **Filters** — **State** filter (all · saved · draft · active · failed · abandoned).
5. **`lib/observe/__tests__/resolveAgentSessionState.test.ts`** — cases: save → saved; dbFailed after validate → failed (not draft); validate only → draft; dbAbandoned without validate → abandoned (even when recent); recent no validate → active; stale no validate → abandoned; New chat after draft → draft.
6. **`scripts/smoke-observe-agent.ts`** — exercise session state; retire `abandoned_inferred` assertions.
7. **`scripts/fetch-exploration-evidence.ts`** — print **`state`**; suggest exploration label: `no-save` + state `draft` vs `abandoned`.
8. **Retirement cleanup (same PR — no dangling superseded model)** — once all call sites use `resolveAgentSessionState()` / `AgentSessionStateBadge`, **delete** (do not deprecate):
   - `resolveAgentRunOutcome()` and exported **`AgentRunOutcome`** type from `lib/observe/queries.ts`
   - `lib/observe/__tests__/resolveAgentRunOutcome.test.ts`
   - `components/observe/AgentRunOutcomeBadge.tsx`
   - Any remaining imports of the above (agent list/detail pages, smoke script, `lib/eval/processMetrics.ts` if it reads display outcome — switch to `state` or ingest `agent_runs.outcome` as needed)
   - **`agent_runs.outcome` ingest enum unchanged** — eval runner / New chat terminal POSTs (`saved` / `failed` / `abandoned`) are unaffected; only the Observe **display** layer retires.

### Checklist (WS2A)

- [x] `AgentSessionState` + `resolveAgentSessionState()` + api_events helpers implemented
- [x] List/detail rows use **state**; summary includes **Draft** count (hub — see [shipped deviations](#shipped-deviations-2026-08-10))
- [x] State badge + filter on `/observe/agent`; `abandoned_inferred` retired from UI
- [x] Unit tests + smoke script pass
- [x] Evidence script reports session state
- [x] **Retirement cleanup:** old outcome resolver, type, badge, and test file deleted; no remaining consumers
- [x] Supersession notes applied in persistence plan, implementation plan Phase 6/7.3½, `agent/README.md`

---

### 2B — Agent list UI/UX polish (non-gating)

**Problem today:** Eval case column is empty for almost all rows — `eval_case_id` is only set when `eval:run` sends `X-RapidUI-Eval-Case` or chat starts from a starter chip with a pending case. Manual exploration and normal `/chat` never populate it. Mixing localhost and rapidui.dev sessions makes aggregate latency/tokens/save-rate misleading.

**Principle:** Agent Observe answers *"what happened in chat sessions?"* Eval Observe (7.6) answers *"how did eval cases perform?"* Link **trial → agent session**, not eval case on every agent row.

**Scope:** ship when convenient — **does not block 7.4 baselines** or the v1.2 exploration re-run.

#### List table (`app/observe/agent/page.tsx`)

| Change | Detail |
|---|---|
| **Remove** eval case column + filter | Drop from list and filter bar. Keep `eval_case_id` on `agent_runs` for automated runs. |
| **Add env** column | Values: `local` · `prod` · `—` (legacy rows). Filter: All / local / prod. |
| **Add est. cost** column | Immediately after **Tokens**. Label **Est. cost**; show `—` when model or turn tokens missing. |
| **Keep** | Session, State, Model, Validates, Platform calls, Tokens, Started |

**Suggested column order:** Session · State · Env · Model · Validates · Platform calls · Tokens · Est. cost · Started

#### Session detail (`app/observe/agent/sessions/[sessionId]/page.tsx`)

- Show **env**, **est. cost** in summary (state from 2A).
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
- **Formula:** `(input × inputPrice + output × outputPrice) / 1e6`. No persist on `agent_runs` in v1.2 — compute in query or list mapper (same pattern as session state).
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

- [x] `env` migrated, ingested from agent, filterable on dashboard
- [x] Eval case removed from agent list + filters; detail shows eval case only when set
- [x] Est. cost column + pricing helper; `—` when data insufficient
- [x] Tooltips + smoke coverage

### Checklist (WS2)

- [x] **WS2A complete** (session state — gates re-run and 7.4)
- [x] WS2B optional (env / cost / eval-case cleanup — does not gate 7.4)

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

### Findings docs

**New file:** `chat-exploration-findings-v1.2.md` — fresh run log for the v1.2 re-run. v1.1 findings stay in `chat-exploration-findings.md` (baseline, do not append v1.2 runs there).

1. New platform marker: **`post-fix (prompt v1.2 draft-first)`**; v1.1 entries stay as baseline — do not merge stability counts across versions.
2. **Result vocabulary:** **`saved-unconfirmed`** — saved before user save intent (off-target even when the artifact is correct).
3. Extraction checklist additions: identify the draft turn in the transcript; confirm zero `save_rui` tool parts before the save-intent turn; on successful saves confirm exactly **one** `save_rui`; log Observe **session state** (`draft` = funnel success for no-save draft runs; `abandoned` = bailed before validate).
4. Empty dashboard + run-entry sections in the new v1.2 doc.
5. **Update "Changes to make":** v1.2 deliverable lives in the new doc; v1.1 doc links here for WS4/WS5 updates.

### Checklist (WS3)

- [x] Scenarios doc: definition of done, save-intent table, global watch-fors, D1–D3, workload updated
- [x] Findings doc: new `chat-exploration-findings-v1.2.md` with v1.2 marker, `saved-unconfirmed`, checklist, dashboard, changes section; v1.1 doc reverted to baseline-only

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
  7. **Funnel:** D2/D3 `no-save` runs show Observe state **`draft`** (not confused with early bail = **`abandoned`**).
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
WS2A session state       ─┼→ WS3 docs update → WS4 re-run explorations → WS5 eval cases → Phase 7.4 baselines
WS2B list polish (opt.)  ─┘   (WS1+WS2A parallel; WS3 before any v1.2 run is logged)
                          │
                          └── 7.4 migrations / evalTrials.ts may be built in parallel (no baselines until exit criteria)
```

**Proceed to 7.4 baselines when:** D1–D3 stable 3/3 · premature-save victims clean under v1.2 · one-shots still one-shot · **Draft** session state visible in Observe (stat + filter + evidence script) · UC1–UC3 eval cases updated and passing `eval:run` locally · 7.5 blocker variants drafted.

**Then in 7.4:** persist trials with `prompt_version: v1.2` in the config snapshot; `final_spec_id` = latest save. *(Optional v0.3+: persist `session_state` on `eval_trials` process snapshot for automated funnel reporting.)*

## Out of scope

- DB draft rows / spec status column / new agent tools (draft is in-chat only — decision 2; panel wiring already shipped)
- Ingest contract changes for **session state** or **est. cost** (both display-derived in v1.2; **`env`** is the one new persisted run field via migration **010** — WS2B, non-gating)
- Full **7.7** versioned model price table (v1.2 uses `lib/observe/modelPricing.ts` stub — WS2B)
- `AgentRunOutcome` / `abandoned_inferred` / milestone axis in UI (superseded by single **`AgentSessionState`**)
- `load_spec` / UC4 / `spec-update-v0.2` (unchanged: post-v0.2)
- New renderer/preview tab work (panel already shows draft from `validate_rui`; separate polish track if needed)
- Validator/schema changes (v1.1-cycle rules closed the known classes; none needed here)
