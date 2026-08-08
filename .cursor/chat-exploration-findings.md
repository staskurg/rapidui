# Chat exploration findings — run log & report

**Companion to:** `.cursor/chat-exploration-scenarios.md` (the scenario scripts live there; this doc holds what happened).  
**Prerequisite infra:** [`.cursor/chat-session-persistence-plan.md`](chat-session-persistence-plan.md) — ✅ shipped (2026-08-08). Bulk scenario runs can proceed.
**End goal:** the [Changes to make](#changes-to-make) section at the bottom, backed by run evidence. Everything above it exists to feed it.

---

## Instructions for the assisting agent

You are helping a human who is running the scenarios from `chat-exploration-scenarios.md` in a browser beside you. Your job is to keep this document current. Rules:

1. **After each run**, append one run entry (template below) under the matching scenario heading, and update the dashboard row.
2. **Extract, don't invent.** Fill fields only from what the human pastes or what you can read from evidence. If you don't know a value, write `?` — never a plausible guess.
3. **Where evidence lives:** see [Transcript extraction checklist](#transcript-extraction-checklist) — Observe for metrics, transcript for conversation quality, saved spec for artifact correctness.
4. **Keep entries short.** Quote the agent verbatim only when the exact wording is the finding (a great clarifying question, a bad invention). No full transcripts in this doc — link `/chat/{sessionId}` or the transcript API instead.
5. **Run IDs:**
   - Base scenarios: `<scenario>.<n>` — e.g. `UC1-S1.2` is the second run of UC1-S1.
   - Optional riders (e.g. UC1-S2 CSV edge cases): `<scenario>r<n>` — e.g. `UC1-S2r1`. Note the rider variant in the dashboard **Notes** column; riders are separate from the base `.1`–`.3` stability count unless you intentionally substitute one.
6. **After finishing a use case's runs**, draft its findings block (below the run entries) and ask the human to confirm before moving on.
7. **Runs per scenario:** the human repeats each variant **3 times**. Stability: `stable: yes` when 2+ of 3 runs share the same result and artifact shape; `stable: no` when all 3 differ or only 1/3 matches.
8. **`error` runs** (infra/tool failure, not a model result) **do not count** toward the 3 — rerun until you have 3 countable results (`saved-*` or `no-save`).

**Result vocabulary** (one per run):

- `saved-clean` — saved, artifact matches the scenario's watch-fors
- `saved-off-target` — saved, but artifact deviates from watch-fors (say how)
- `saved-negotiated` — saved after the agent redirected an unsupported request (UC3-S3 style)
- `no-save` — conversation ended without `save_rui` (say where it stalled)
- `error` — infra/tool failure, not a model result (don't count toward stability)

---

## Dashboard

Update after every run. `Stable` = 2+ of 3 runs with the same result and artifact shape.

| Scenario | Runs | Last result | Stable | Notes |
|---|---|---|---|---|
| UC1-S1 | 0 | — | — | |
| UC1-S2 | 0 | — | — | |
| UC1-S3 | 0 | — | — | |
| UC1-S4 | 0 | — | — | |
| UC1-S5 | 0 | — | — | |
| UC1-S6 | 0 | — | — | |
| UC2-S1 | 0 | — | — | |
| UC2-S2 | 0 | — | — | |
| UC2-S3 | 0 | — | — | |
| UC2-S4 | 0 | — | — | |
| UC2-S5 | 0 | — | — | |
| UC2-S6 | 0 | — | — | |
| UC3-S1 | 0 | — | — | |
| UC3-S2 | 0 | — | — | |
| UC3-S3 | 0 | — | — | |
| UC3-S4 | 0 | — | — | |
| UC3-S5 | 0 | — | — | |
| UC3-S6 | 0 | — | — | |
| S+1 | 0 | — | n/a | per-parent; note which scenario it followed |

---

## Run entry template

Copy this under the scenario's heading; delete lines that are genuinely empty rather than leaving blanks.

```md
#### <scenario>.<n> — <date>
- **Result:** saved-clean | saved-off-target | saved-negotiated | no-save | error
- **Session / spec:** <sessionId> / <specId or viewUrl> · **Chat:** `/chat/{sessionId}`
- **Turns / validates / errors:** <user turns> / <validate attempts> / <error codes or none>
- **Interview:** what it asked, in order — were these the high-value questions?
- **Inventions:** anything not given by the user (endpoints, fields, envelopes, scope) — or "none"
- **Artifact vs target:** deviations from the scenario's watch-fors — or "matches"
- **Feed-forward:** one line — what this run implies for the prompt, the case, or the script
```

---

## Transcript extraction checklist

After each run, the assisting agent pulls evidence and fills the run entry. **Do not paste the full transcript** — link `/chat/{sessionId}` and extract only the fields below.

### How to fetch evidence

**Base URL:** `http://localhost:3000` (Path A dev server). Override with `RAPIDUI_BASE_URL` if needed.

**Preferred — one command** (uses DB directly; requires `.env.local` / `DATABASE_URL`):

```bash
npm run fetch:exploration-evidence -- {sessionId} {runId}
# e.g. npm run fetch:exploration-evidence -- abc-123-def UC1-S1.1
```

Prints transcript summary, Observe validate count + error codes, save specIds from tool parts, and a **run-entry skeleton** with mechanical fields pre-filled. Fill only the judgment fields: Interview, Inventions, Artifact vs target, Feed-forward.

**Manual / curl** (when the script is unavailable):

| Source | Command / path |
|---|---|
| Transcript | `curl -s http://localhost:3000/api/chat/sessions/{sessionId}/transcript` |
| Spec JSON | `curl -s -H "X-RapidUI-Session-Id: {sessionId}" http://localhost:3000/api/specs/{specId}` |
| Observe UI | `http://localhost:3000/observe/agent/sessions/{sessionId}` (HTML only — no JSON API) |

`GET /api/specs/{id}` requires a non-empty `X-RapidUI-Session-Id` (telemetry gate, not auth — the run's real session id is fine). **It writes no `api_events` row**, so curling specs for artifact checks cannot pollute that run's Observe validate count or timeline.

Observe metrics (validate attempts, error codes, timeline) come from `getAgentRunDetail()` in `lib/observe/queries.ts` — the fetch script uses this; do not scrape the HTML page.

### Evidence sources (who owns what)

| Source | URL | Use for |
|---|---|---|
| Transcript API | `GET /api/chat/sessions/{sessionId}/transcript` | User turn count, interview prose, negotiation wording, tool-part sequence, `run.outcome` / `run.specId` |
| Chat UI | `/chat/{sessionId}` | Human replay; same content as transcript |
| Observe | `/observe/agent/sessions/{sessionId}` or fetch script | Validate attempt count (authoritative), error codes, per-turn timeline |
| Saved spec | `GET /api/specs/{specId}` (JSON) or `/specs/{specId}` (HTML) | Declarative artifact — check scenario watch-fors |

**Rule:** Observe counts validates and errors; transcript explains *why*; saved spec proves *what* landed.

### Per-run extraction (map → run entry template)

Work through these six buckets in order. Write `?` for anything not observable; never guess.

#### 1. Outcome & IDs → **Result**, **Session / spec**

From transcript GET (top-level fields):

- [ ] `turnCount` — user messages sent (→ **Turns**)
- [ ] `run.outcome` — `saved` | `failed` | `abandoned` | `null`
- [ ] `run.specId` — latest saved spec in `agent_runs` (after multiple saves, this is the **most recent** spec, not the first)
- [ ] **`run.outcome: null` is normal** for stalled runs until you click **New chat** (which posts `abandoned`). Judge `no-save` from absence of `save_rui` in the transcript — do not wait for a terminal outcome.
- [ ] Assign **Result** vocabulary:
  - `saved` + artifact matches watch-fors → `saved-clean`
  - `saved` + artifact deviates → `saved-off-target` (say how in **Artifact vs target**)
  - `saved` after redirecting unsupported ask (UC3-S3, etc.) → `saved-negotiated`
  - no `save_rui` in transcript → `no-save` (even if `run.outcome` is still `null`)
  - infra/503/tool handler crash → `error` (don't count toward stability)

#### 2. Metrics → **Turns / validates / errors**

From Observe session detail (authoritative — do not count validates from transcript alone):

- [ ] Validate attempt count (→ second number in **Turns / validates / errors**)
- [ ] Error codes from failed validates (comma-separated, or `none`)
- [ ] Did any turn call validate without a subsequent save? (stall signal for `no-save`)

From transcript tool parts (supplementary — for *when*, not *how many*):

Match either shape: `part.type === "tool-validate_rui"` / `"tool-save_rui"`, **or** `part.type === "dynamic-tool"` with `part.toolName === "validate_rui"` / `"save_rui"`.

- [ ] First user turn with a validate tool part (turn index)
- [ ] Turn with save tool part (or confirm absent)
- [ ] All `save_rui` specIds in order (first = parent spec; last = latest — use for S+1 split)
- [ ] On failed validates: did the agent revise in prose before retrying?

#### 3. Interview → **Interview**

From transcript assistant **text** parts only (chronological order):

- [ ] List every question the agent asked before first validate
- [ ] Mark each as **high-value** (scenario needed this) or **redundant** (info already given)
- [ ] Note if it **skipped** expected questions (e.g. UC1-S1 should ask for data; UC3-S4 should ask for endpoints)
- [ ] Note if it **kept interviewing** after having enough (→ cross-run "knowing when to stop")
- [ ] Quote verbatim **only** when wording is the finding (great clarifier, bad assumption, good pushback)

#### 4. Inventions → **Inventions**

Cross transcript prose + saved spec:

- [ ] Endpoints not given by the user
- [ ] Fields, envelopes (`valuePath`), or scope behavior not given
- [ ] Static vs API mode wrong for scenario (UC1 inventing API paths; UC2/UC3 embedding static records)
- [ ] Record which **turn** the invention first appeared (transcript) and whether it **survived** into the saved spec

Write `none` only if both prose and artifact are clean.

#### 5. Artifact → **Artifact vs target**

From saved spec JSON at `GET /api/specs/{specId}` (use the run's `sessionId` in `X-RapidUI-Session-Id`) — walk the scenario's **Watch for** list in `chat-exploration-scenarios.md`:

- [ ] Check each watch-for bullet; note pass/fail per bullet
- [ ] Summarize deviations in one line, or write `matches`
- [ ] For `no-save`: write where it stalled instead (e.g. "stuck after 4 validates, STATIC_API_CONFLICT")

#### 6. Synthesis → **Feed-forward**

One line tying this run to action:

- [ ] Prompt fix, eval script turn to add, harness change, or product hint
- [ ] Cite the specific finding that motivates it (not generic advice)

### Scenario-specific transcript signals

Extra items to scan when the scenario ID matches:

| Scenario | Also check in transcript / spec |
|---|---|
| UC1-S3 | Metrics in `presentation.header.metrics[]` (not `presentation.metrics`); values consistent with invented rows |
| UC1-S5 | Turn 1: no compose/save when user said "don't build yet" |
| UC1-S6 | `data.mode: static` despite API-shaped paste; records unwrapped from `items` |
| UC2-S3 | Forms from write schema (`UserWrite`), not read schema |
| UC2-S4, S6 | `valuePath: "items"` inferred; no hardcoded sample IDs in paths |
| UC2-S5 | After scope expansion: `cta`, delete on detail, outcomes present |
| UC3-S3 | Pushback **before** first validate (prompt) vs error-driven retry (validator only) |
| UC3-S4 | Did not start building before action endpoints arrived (turn 3+) |
| UC3-S5 | No support-domain residue; destructive act has `confirm` |
| S+1 | Second save: full spec carried forward, re-validated, new URL explained — see [S+1 workflow](#s1-workflow) below |

### S+1 workflow

S+1 is a follow-up turn in the **same session** as the parent save. Evidence merges — handle it explicitly:

1. **Log the parent scenario run first** (before sending the S+1 user turn). Parent metrics must not include S+1 activity.
2. **Then** send the S+1 turn and log a separate S+1 entry (run ID e.g. `S+1.1`, note parent e.g. "after UC1-S1.1").
3. **Parent spec** → first `save_rui` tool part in the transcript, or the specId already logged in the parent entry.
4. **S+1 spec** → last `save_rui` tool part, or the `viewUrl` from the agent's S+1 reply. `run.specId` in the transcript API also points to the **latest** spec (not the parent).
5. **Validate/error deltas for S+1** → compare Observe totals to the parent entry, or count tool parts after the S+1 user message.
6. **Dashboard stability for S+1** is **`n/a`** — each S+1 follows a different parent; judge per-parent, not across S+1 runs.

### What not to copy into this doc

- Full message arrays or tool JSON payloads
- Complete spec JSON (link `/specs/{id}`; describe deltas only)
- Token counts or latency (Observe detail has them; not needed for findings)
- Duplicate of the user's pasted data blocks

---

## UC1 — Static browse

### Run entries

#### UC1-S1

#### UC1-S2

#### UC1-S3

#### UC1-S4

#### UC1-S5

#### UC1-S6

### UC1 findings (fill after runs)

- **Reliable paths to save:** which scenarios saved clean, in how many turns?
- **Data handling:** JSON vs CSV vs invented vs messy — what did it parse natively, what needed help?
- **Static/API discrimination:** did it ever invent endpoints (S1, S4) or wire the S6 envelope as an API?
- **Recurring deviations:** e.g. metrics placement, filter shape, route naming.
- **Script implications:** which turns proved load-bearing that the current `static-browse-v0.2` script doesn't have?

---

## UC2 — CRUD admin

### Run entries

#### UC2-S1

#### UC2-S2

#### UC2-S3

#### UC2-S4

#### UC2-S5

#### UC2-S6

### UC2 findings (fill after runs)

- **Reliable paths to save:** which input forms (list, one-shot, OpenAPI, samples, staged, cURL) reached save cleanly?
- **Contract extraction:** did it get methods, paths, params, and envelopes right per form? Where did `valuePath`/`bodyMap`/scope go wrong?
- **Known failure modes:** missing `cta`, delete as top-level op, wrong scope placeholders — did they appear, and in which scenarios?
- **Interview quality (S1, S5):** did it ask for the right missing pieces, in a sensible order?
- **Script implications:** what must the fixed `crud-admin-v0.2` prompt/script contain, phrased like the successful runs here? (Remember: the runner never sends `mockApi`.)

---

## UC3 — AI review queue

### Run entries

#### UC3-S1

#### UC3-S2

#### UC3-S3

#### UC3-S4

#### UC3-S5

#### UC3-S6

### UC3 findings (fill after runs)

- **Reliable paths to save:** which scenarios saved clean?
- **HITL structure:** acts embedded on `read` with outcomes every time? Any top-level act/row-action attempts, and did the prompt or only the validator catch them?
- **Pushback quality (S3):** did it negotiate before building, or burn validate attempts first?
- **Discovery halves (S4 vs S6):** which is weaker — extracting the contract from a story, or the meaning from a contract?
- **Generalization (S5):** any support-domain residue or structural drift in the moderation variant?
- **Script implications:** what must the fixed `ai-review-queue-v0.2` prompt/script contain?

---

## S+1 — Post-save iteration

### Run entries

(Log here regardless of which scenario it followed; name the parent run, e.g. "after UC2-S3.1". Use [S+1 workflow](#s1-workflow) — log parent entry **before** sending the S+1 turn.)

### S+1 findings (fill after runs)

- Did it carry the full spec forward, or drop outcomes/transitions on the rebuild?
- Did it re-validate before the second save?
- Did it explain the new spec ID/URL?
- What does this imply for UC4 / `load_spec`?

---

## Cross-run findings (fill last)

- **Static vs API discrimination:** reliable across all 19 scenarios?
- **Knowing when to stop:** once it had enough, did it go validate → save, or keep interviewing?
- **Inventions:** every instance of unrequested paths/fields/envelopes/scope, across all runs.
- **Turn economy:** actual turns-to-save per scenario vs the `maxUserTurns: 4` cap — which promotable scenarios don't fit?
- **Stability:** which scenarios produced the same result and shape across reruns (dashboard `stable: yes`)?

---

## Changes to make

The deliverable. Every item must cite run evidence (`UC2-S3.1`, `UC3-S4.2`, …).

### Eval case changes (`eval/cases/*.json`)

<!-- e.g. "Fold endpoint list into crud-admin prompt turn 2, phrased as in UC2-S1.1 — evidence: UC2-S1.1 saved-clean, current script no-save" -->

### Agent prompt changes (`agent/prompts/v1.txt`)

<!-- e.g. "Add explicit rule about X — evidence: invention in UC1-S4.2" -->

### Runner / harness changes (`scripts/eval-run.ts`, driver)

<!-- e.g. "Raise maxUserTurns for interview variants — evidence: UC3-S4.1 hit the cap" -->

### New eval variants worth scripting

<!-- scenarios that proved stable and distinct enough to promote, with the turn content to script -->

### Product / docs changes

<!-- e.g. "UI hint: paste endpoints as a list — evidence: YAML fumbled in UC2-S3.*" -->
