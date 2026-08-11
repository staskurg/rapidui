# Chat exploration findings — run log & report (v1.1)

**Status:** v1.1 exploration complete — **frozen baseline**. v1.2 re-run logs go in **[chat-exploration-findings-v1.2.md](chat-exploration-findings-v1.2.md)**.

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

**Post-fix runs (platform cutover 2026-08-08):** After enriching `GET /api/schema` (`shapes` + neutral-domain `examples`) and shipping prompt **v1.1**, UC2-S1 is rerun as a **fresh acceptance gate**. Pre-fix entries (prompt v1, sparse schema) stay as baseline evidence — do not merge into post-fix stability counts. Log post-fix runs with **`Platform: post-fix (prompt v1.1)`** in the run entry (Observe `prompt_version` should read `v1.1`). **Restart the agent** after changing the prompt — uvicorn `--reload` does not watch `prompts/*.txt`.

**v1.2 re-run:** log in **[chat-exploration-findings-v1.2.md](chat-exploration-findings-v1.2.md)** — do not append v1.2 runs here.

**Platform cutover 2026-08-08 (validator):** `INVALID_BINDING_PLACEHOLDER` rejects malformed or undeclared `{...}` tokens in API binding paths (e.g. `{scope.params.userId}` from UC2-S4.2). Only adds error detection — post-change runs stay comparable; catching errors loudly is strictly better than silent bad saves. Log UC3 runs after this cutover with **`Platform: post-fix (prompt v1.1 + binding placeholder validator)`** when the deployed validator includes the rule.

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
| UC1-S1 | 3 | saved-clean | yes | 2-turn path; identical artifact all 3 runs |
| UC1-S2 | 3 | saved-clean | yes | 1-turn one-shot all 3 runs |
| UC1-S3 | 3 | saved-clean | yes | 3/3 clean; flow varies (dual-save vs propose→save) |
| UC1-S4 | 3 | saved-off-target | yes | 3/3 off-target; .3 best artifact (assigneeName flattened, tags asked) |
| UC1-S5 | 3 | saved-clean | yes | 2-turn expand-and-save all 3; turn 1 restraint ✓ |
| UC1-S6 | 3 | saved-clean | yes | 3/3 clean; 1-turn one-shot 2/3 runs |
| UC2-S1 | 3 (post-fix) | saved-clean | yes | post-fix 3/3 saved-clean; 2-turn save, 1 validate each |
| UC2-S2 | 3 | saved-clean | yes | 3/3 one-shot, 1 turn / 1 validate each |
| UC2-S3 | 3 | saved-clean | yes | 3/3 YAML path, UserWrite forms, 2-turn save |
| UC2-S4 | 3 | saved-clean | no | 2/3 clean; .2 off-target (`{scope.params.userId}`) |
| UC2-S5 | 3 | saved-clean | yes | 3/3 dual-save expand→CRUD; final artifact clean |
| UC2-S6 | 3 | saved-clean | yes | 3/3 IDs normalized; 1–2 turn save |
| UC3-S1 | 3 | saved-off-target | yes | 2/3 clean on 2-turn script; .3 one-shot skipped turn 2 → no filter |
| UC3-S2 | 3 | saved-clean | yes | 3/3 one-shot; valuePath ✓ |
| UC3-S3 | 3 | saved-negotiated | yes | 3/3 pushback before validate |
| UC3-S4 | 3 | saved-clean | no | 2/3 clean; .1 premature save + update op |
| UC3-S5 | 3 | saved-clean | yes | 3/3 one-shot turn 1; turn 2 optional |
| UC3-S6 | 3 | saved-off-target | yes | 3/3 one-shot; turn 2 unreachable (agent saves turn 1) |
| S+1 | 2 | saved-clean | n/a | .1 after UC2-S1; .2 after UC3-S6.3 — both clean |

---

## Run entry template

Copy this under the scenario's heading; delete lines that are genuinely empty rather than leaving blanks.

```md
#### <scenario>.<n> — <date>
- **Platform:** pre-fix (prompt v1) | post-fix (prompt v1.1) — omit for UC1 runs before cutover
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
| UC2-S1 | **Example-domain leakage (post-fix):** saved spec must not contain illustration-only terms (`/api/projects`, `/api/departments`, `departmentId`, `/api/submissions`, `ent-projects`, `op-browse-events`, accept/decline submission paths) unless the user asked for that domain. `{scope.companyId}`, `/api/companies`, `/api/users` from user turn 2 are **not** leakage. **No vocabulary-hint turns** on post-fix acceptance runs. |
| UC3-S1 | **Example-domain leakage (post-fix):** saved spec must not contain HITL illustration terms (`submissions`, accept/decline submission paths, `ent-submissions`) unless the user asked for that domain. User-provided **`drafts` / `approve` / `reject`** (S1–S4, S6) and S5's **`flags` / `remove-listing` / `dismiss`** are **not** leakage — they come from the scenario script. |
| UC2-S3 | Forms from write schema (`UserWrite`), not read schema |
| UC2-S4, S6 | `valuePath: "items"` inferred; no hardcoded sample IDs in paths |
| UC2-S5 | After scope expansion: `cta`, delete on detail, outcomes present |
| UC3-S3 | Pushback **before** first validate (prompt) vs error-driven retry (validator only) |
| UC3-S4 | Did not start building before action endpoints arrived (turn 3+) |
| UC3-S5 | No support-domain residue; Remove Listing **`variant: danger`**; **`valuePath: "items"`** when envelope in turn 1 |
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

#### UC1-S1.1 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 8dc94624-4ffd-493e-b339-09c87644b117 / 626ed528-461f-4c35-a9b0-c0580328e6fe · **Chat:** `/chat/8dc94624-4ffd-493e-b339-09c87644b117`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked (1) data source — API vs static sample records **high-value**; (2) which columns **redundant** (no data yet, but reasonable); (3) filters/pre-filters **redundant** ("nothing fancy, just a table"). Did not assume API mode or invent endpoints.
- **Inventions:** none
- **Artifact vs target:** matches — `data.mode: static`, three records verbatim, `/incidents` route, columns id/title/severity/status/owner
- **Feed-forward:** Agent saved immediately after data paste without turn 3 confirm — acceptable one-shot variant; note for eval script that turn 3 may be optional when user says "just use this"

#### UC1-S1.2 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 1c8b11a1-532f-4e7c-a60c-f7bf811b1495 / 96576b64-a0ae-4cdd-8622-210f2d36710b · **Chat:** `/chat/1c8b11a1-532f-4e7c-a60c-f7bf811b1495`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked (1) data source — static JSON/CSV vs API (e.g. GET /api/incidents) **high-value**; (2) columns **redundant**; (3) filters **redundant**. Did not assume API mode.
- **Inventions:** none — API path mentioned only as interview example, not in spec
- **Artifact vs target:** matches — identical shape to UC1-S1.1 (same contentHash); static mode, three records verbatim, `/incidents`, columns id/title/severity/status/owner
- **Feed-forward:** Confirms UC1-S1.1 pattern — 2-turn save after data paste is stable; turn 3 confirm not required

#### UC1-S1.3 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 7593d4f7-ff1a-4006-acb4-a5b118be6659 / 9293a663-cd64-4a6b-ad9e-94e1b84269d2 · **Chat:** `/chat/7593d4f7-ff1a-4006-acb4-a5b118be6659`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked (1) API vs static sample records **high-value**; (2) fields/columns **redundant**; (3) filtering **redundant**. Also offered "paste sample rows" — helpful nudge. Did not assume API mode.
- **Inventions:** none
- **Artifact vs target:** matches — same contentHash as UC1-S1.1/.2; static mode, three records verbatim, `/incidents`, columns id/title/severity/status/owner
- **Feed-forward:** UC1-S1 stable at 3/3 saved-clean, 2 turns, 1 validate — strong candidate for eval promotion as 2-turn script (interview → data paste → auto-save)

#### UC1-S2

#### UC1-S2.1 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 0075e08c-d1e1-4256-9abc-5388b3e40c41 / 7bb736ef-a4d2-468a-80b5-5d18fa0e11fe · **Chat:** `/chat/0075e08c-d1e1-4256-9abc-5388b3e40c41`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — CSV complete in turn 1; agent went straight to validate → save (no clarify turn)
- **Inventions:** none
- **Artifact vs target:** matches — CSV parsed correctly (team/lead/headcount/region → 3 records); headcount as numbers (8, 5, 11); columns match headers; `data.mode: static`; route `/teams`; no phantom fields
- **Feed-forward:** Stronger one-shot than scripted 2-turn flow; eval script can be 1 turn when CSV is in the opener

#### UC1-S2.2 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 2a1df32e-63dd-487a-a573-3b70729b2847 / cee9950f-6813-44c9-ba18-bfc4fb28b919 · **Chat:** `/chat/2a1df32e-63dd-487a-a573-3b70729b2847`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — same one-shot as UC1-S2.1
- **Inventions:** none
- **Artifact vs target:** matches — same shape as UC1-S2.1 (static, `/teams`, 3 records, headcount numeric, columns team/lead/headcount/region); different contentHash (minor normalization variance)
- **Feed-forward:** Confirms 1-turn CSV one-shot is repeatable

#### UC1-S2.3 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 39938e8f-b74b-4a77-8d7a-573132f41cb2 / 9bfd8d55-dc1f-4ccb-ad1d-42286560411c · **Chat:** `/chat/39938e8f-b74b-4a77-8d7a-573132f41cb2`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — one-shot again
- **Inventions:** none
- **Artifact vs target:** matches — same contentHash as UC1-S2.2; static, `/teams`, 3 records, headcount numeric, columns team/lead/headcount/region
- **Feed-forward:** UC1-S2 stable at 3/3 saved-clean, 1 turn — promote as 1-turn eval script (CSV in opener)

#### UC1-S3

#### UC1-S3.1 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 04d3fcc9-7027-4acf-bc76-42e730c16155 / 310f5218-f3f7-4d77-966f-054663adf9a2 (final; first save 23ea8a78-7779-4d86-9b58-a2fd029adfc6 on turn 1) · **Chat:** `/chat/04d3fcc9-7027-4acf-bc76-42e730c16155`
- **Turns / validates / errors:** 2 / 2 / none
- **Interview:** none — user authorized invent; agent built immediately on turn 1 (saved without metrics), turn 2 added metrics per user ask
- **Inventions:** none — invented records/fields per user request; no endpoints
- **Artifact vs target:** matches — believable invented data (3 rows each); metrics in `presentation.header.metrics[]` (Open=2, Resolved Today=1); values align with statuses (Open+Investigating=2, Resolved=1); both `/incidents` and `/teams`; static mode
- **Feed-forward:** Agent saved on turn 1 then iterated on turn 2 (dual-save within scenario) — final artifact correct; eval script needs both turns for metrics requirement

#### UC1-S3.2 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** c7704f45-7024-47fc-8800-d77f09249b36 / 1cf4b9ca-7e31-4132-9585-c93411c5397f · **Chat:** `/chat/c7704f45-7024-47fc-8800-d77f09249b36`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 proposed plan only (entities, ops, mock fields) — asked if list-only is OK **high-value** restraint; did not save until turn 2
- **Inventions:** none — invented data per user request; no endpoints
- **Artifact vs target:** matches — metrics in `presentation.header.metrics[]` (Open=2, Resolved Today=1); values match records (2 Open statuses, 1 Resolved on 2026-08-08); both `/incidents` and `/teams`; believable invented rows; static mode
- **Feed-forward:** Better-aligned flow vs UC1-S3.1 — propose on turn 1, build+save on turn 2; prefer this for eval script

#### UC1-S3.3 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 2b1682f5-7bda-4c3d-8c49-8c6c9e156549 / 7394acde-ec0a-4fce-82b3-a13bc98b63c9 (final; first save f35e1808-d996-489a-bf84-4d1eaa0305bb on turn 1) · **Chat:** `/chat/2b1682f5-7bda-4c3d-8c49-8c6c9e156549`
- **Turns / validates / errors:** 2 / 2 / none
- **Interview:** none — saved on turn 1 without metrics (like UC1-S3.1), turn 2 added metrics
- **Inventions:** none — invented data per user request; no endpoints
- **Artifact vs target:** matches — metrics in `presentation.header.metrics[]` (Open=1, Resolved Today=0); values align with records (1 literal Open status; 0 resolved on 2026-08-08); both `/incidents` and `/teams`; believable invented rows; static mode
- **Feed-forward:** Dual-save pattern again (2/3 runs); final artifact always correct — eval script should use 2 turns regardless of turn-1 save vs propose

#### UC1-S4

#### UC1-S4.1 — 2026-08-08
- **Result:** saved-off-target
- **Session / spec:** d137923e-a74f-4941-a76d-6c2c2495cca7 / 445b192a-30f4-4379-865c-3c111eaefb67 · **Chat:** `/chat/d137923e-a74f-4941-a76d-6c2c2495cca7`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** **skipped** — no questions about `sev` ordering, nested `assignee`, or tags; one-shot save on turn 1 (scripted turn 2 clarify never sent)
- **Inventions:** none — column subset was agent judgment, not invented fields/endpoints
- **Artifact vs target:** partial — `ttl`→label "Title", `sev`→"Severity" ✓; subset columns (id/title/sev/created_ts/resolved), tags omitted from table ✓; **assignee not flattened** (nested object kept in records, excluded from columns); **no clarify on sev semantics**; `created_ts` raw unix in records
- **Feed-forward:** Agent one-shots messy JSON without interviewing — eval script must include turn 2 clarify answers; prompt may need "ask before guessing on ambiguous fields"

#### UC1-S4.2 — 2026-08-08
- **Result:** saved-off-target
- **Session / spec:** 0adf0d0f-340f-4a76-adfb-549bd6770155 / 712db2eb-a1c8-4a4f-b5f2-80aff7f513d5 · **Chat:** `/chat/0adf0d0f-340f-4a76-adfb-549bd6770155`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked domain name **redundant** and filters **redundant** — **skipped** high-value questions (sev ordering, assignee flattening, tags); user answered "whatever is suitable" / "plain is ok" (not scripted sev/assignee/tags answers)
- **Inventions:** none
- **Artifact vs target:** improved vs UC1-S4.1 — `assignee.name` column key ✓; `ttl`→"Title", `sev`→"Severity" ✓; tags omitted from table ✓; still no sev semantics clarify; `created_ts` raw unix; nested assignee object remains in records
- **Feed-forward:** Agent interviews on wrong axis (domain/filters) when data shape is ambiguous — prompt should prioritize field semantics over entity naming

#### UC1-S4.3 — 2026-08-08
- **Result:** saved-off-target
- **Session / spec:** 6c94190c-0f32-40b0-acd8-df50ec41beab / b402fc2d-29c3-49b5-a5ff-c25a4c5124c2 · **Chat:** `/chat/6c94190c-0f32-40b0-acd8-df50ec41beab`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 proposed column plan (incl. assignee name) and asked tags **high-value** + filters **redundant**; user answered "skips tags" — still **skipped** sev ordering and explicit assignee clarify
- **Inventions:** none — `assigneeName` derived from nested assignee per user direction
- **Artifact vs target:** best of 3 runs — `assigneeName` flattened in records ✓; tags stripped from records ✓; `ttl`→"Title", `sev`→"Severity" ✓; no sev semantics clarify; `created_ts` raw unix
- **Feed-forward:** UC1-S4 stable off-target — eval script must inject sev/assignee/tags answers in turn 2; only .3 asked tags without prompting

#### UC1-S5

#### UC1-S5.1 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 50d42e94-d086-446a-9d8e-09bd99b37e18 / 932dad34-3482-4740-b0b4-c72ae5cbc9f9 · **Chat:** `/chat/50d42e94-d086-446a-9d8e-09bd99b37e18`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 proposed plan only (no validate/save) **restraint ✓**; asked title/id columns and detail drill **high-value**; turn 2 scope expansion → saved without turn 3 confirm
- **Inventions:** none — 3 invented teams per user turn 2 request
- **Artifact vs target:** matches — two entities (`/incidents`, `/teams`) each with entrypoint; incidents columns severity/status/owner; 2 user records + 3 invented teams; `transitions: []` (no cross-link); static mode
- **Feed-forward:** Restraint on "don't build yet" works; scope expansion on turn 2 triggers save — eval can be 2 turns (plan hold → expand+save)

#### UC1-S5.2 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 9c8a5ac5-d5c6-4bea-8436-55fe2094eba9 / cbdb0d16-681d-4817-816a-2c134b597dfd · **Chat:** `/chat/9c8a5ac5-d5c6-4bea-8436-55fe2094eba9`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 plan only **restraint ✓**; asked status filter and detail drill **high-value**; turn 2 scope expansion → saved (no turn 3)
- **Inventions:** none — 3 invented teams per user turn 2
- **Artifact vs target:** matches — two entrypoints `/incidents` `/teams`; incidents incl. id/title/severity/status/owner; 3 invented teams (id/name); `transitions: []`; static mode
- **Feed-forward:** Confirms UC1-S5.1 pattern — restraint + 2-turn expand-and-save stable; column breadth varies run-to-run (ok)

#### UC1-S5.3 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** c2b70923-2509-4ce6-a330-7e0aacd81167 / a7b18bfc-fc86-4e97-be41-75b39ac38080 · **Chat:** `/chat/c2b70923-2509-4ce6-a330-7e0aacd81167`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 detailed plan only **restraint ✓**; offered filter/sort/detail/API options **high-value**; turn 2 scope expansion → saved (no turn 3)
- **Inventions:** none — 3 invented teams (Infrastructure/Platform/Security) per user turn 2
- **Artifact vs target:** matches — two entrypoints; incidents with user records + full columns; 3 teams with id/name/lead; `transitions: []`; static mode
- **Feed-forward:** UC1-S5 stable at 3/3 saved-clean — promote as 2-turn eval (hold → expand+save); turn 3 confirm unnecessary

#### UC1-S6

#### UC1-S6.1 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 03b768b2-865d-4d36-9c42-aa8794ccf383 / 2d669ff1-9e03-4549-b56f-2c7d99225005 · **Chat:** `/chat/03b768b2-865d-4d36-9c42-aa8794ccf383`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 proposed static mock plan (explicitly no API wiring) and asked confirm **high-value** — honored "don't wire anything up yet"; turn 2 user confirmed → save
- **Inventions:** none — no `GET /api/orders` or API bindings
- **Artifact vs target:** matches — `data.mode: static`; 3 records unwrapped from `items` envelope (not envelope-as-record); orders verbatim; route `/orders`; no API paths
- **Feed-forward:** Static-vs-API boundary handled correctly when user intent is explicit — 2-turn confirm path works here

#### UC1-S6.2 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 5fb6d3fd-8b44-40e9-94ae-cfaac1162394 / bb4c293c-cd10-4877-b981-eb37b4fd7415 · **Chat:** `/chat/5fb6d3fd-8b44-40e9-94ae-cfaac1162394`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — one-shot save; user intent explicit in turn 1 ("mock statically", "don't wire") made confirm unnecessary
- **Inventions:** none
- **Artifact vs target:** matches — identical contentHash to UC1-S6.1; static mode, items unwrapped, no API bindings, `/orders`
- **Feed-forward:** Confirms explicit static intent in opener enables 1-turn path without mis-wiring API

#### UC1-S6.3 — 2026-08-08
- **Result:** saved-clean
- **Session / spec:** 731be165-ccea-4cc5-a9b5-3d0aec952e25 / 442c0870-eca7-4271-a3b2-fc526a61d160 · **Chat:** `/chat/731be165-ccea-4cc5-a9b5-3d0aec952e25`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — one-shot like UC1-S6.2
- **Inventions:** none
- **Artifact vs target:** matches — static mode, 3 records unwrapped from `items`, no API bindings, `/orders`; different contentHash from .1/.2 (minor normalization) but same shape
- **Feed-forward:** UC1-S6 stable at 3/3 saved-clean — static-vs-API boundary reliable when user intent is explicit

### UC1 findings (fill after runs)

- **Reliable paths to save:** S1 3/3 clean (2 turns); S2 3/3 clean (1 turn); S3 3/3 clean (2 turns); S4 3/3 off-target (saved but wrong/missing interview); S5 3/3 clean (2 turns); S6 3/3 clean (1–2 turns). **17/18 UC1 runs reached save**; only failure mode is interview quality on S4, not save itself.
- **Data handling:** JSON paste (S1), CSV (S2), invent+metrics (S3), API-shaped envelope (S6) all parse natively. Messy JSON (S4) parses and saves but agent skips or mis-aims clarify turns — **turn 2 answers must be scripted**, not discovered.
- **Static/API discrimination:** No invented endpoints across 18 runs. S6 never wired `GET /api/orders` despite API-shaped paste — **reliable when user says "static"/"don't wire"**. S1 always asked API vs static before building.
- **Recurring deviations:** Confirm turns often skipped when opener is complete (S1 turn 3, S2 turn 2, S6 turns 2–3). S3 saved early on turn 1 in 2/3 runs (dual-save). S4 never asked `sev` ordering in any run. Column breadth varies run-to-run (acceptable). Metrics always landed in `header.metrics[]` when requested (S3).
- **Script implications:** Promote S1 as 2-turn, S2 as 1-turn, S3 as 2-turn (metrics turn load-bearing), S5 as 2-turn (hold → expand), S6 as 1-turn when intent explicit. **S4 eval must inject** turn 2: "sev 1 is worst; assignee name is enough; skip tags" — evidence UC1-S4.1–.3. Current `static-browse-v0.2` likely missing: CSV one-shot, invent+metrics, scope expansion, messy-JSON clarify, API-envelope static.

---

## UC2 — CRUD admin

### Run entries

#### UC2-S1

**Pre-fix (prompt v1, sparse `/api/schema`) — baseline; 2026-08-08.** All three runs needed turn 4+ vocabulary paste; none achieved 3-turn save alone.

#### UC2-S1.1 (pre-fix) — 2026-08-08
- **Platform:** pre-fix (prompt v1)
- **Result:** saved-clean
- **Session / spec:** 7c0dd751-58f3-45ae-9c51-f2b168b5675d / af2c36f5-bf5a-48d9-a715-f654f44d086b · **Chat:** `/chat/7c0dd751-58f3-45ae-9c51-f2b168b5675d` · **View:** `/specs/af2c36f5-bf5a-48d9-a715-f654f44d086b`
- **Turns / validates / errors:** 4 / 3 / INVALID_PROP_TYPE, UNKNOWN_PROP (turns 3–4 only; turn 4 validate passed)
- **Interview:** Turn 1 asked CRUD scope, api vs static, field list, filters **high-value**. Turn 2 user supplied endpoints + fields + scope rules; agent returned full operations plan (scope selector on Users entity, embedded delete, cta, outcomes) **without** re-asking the scope UX fork — turn 3 scope answer was redundant but harmless. Turn 3 “build it” → 1 failed validate → agent asked **user** for `scope.selectors` and form `presentation` shape **wrong axis** (`fetch_schema` does not expose these shapes). Turn 4 user pasted schema snippets → 2 validates (1 fail, 1 pass) → save.
- **Inventions:** none on endpoints/paths/scope placeholders. Minor golden deltas: browse `read` omits `valuePath: "items"` (not in user paste); create/update `write` omits `bodyMap` (validator allows absent); cta transition lacks `label`/`placement`; read detail lacks `context.breadcrumb`; delete action id `act-delete-user` vs golden `op-delete-user`. No browse role filter (user did not ask — correct).
- **Artifact vs target:** matches watch-fors — browse/read/create/update ops; delete embedded on `read` with confirm + DELETE binding; `cta` browse→create; `scope.selectors[0].binding.read` → `GET /api/companies` with `valuePath`/`labelKey`/`valueKey`; paths use `{scope.companyId}`; forms use `email`/`role`/`notes`/`active` with email/select/textarea/checkbox. Diff vs golden: missing browse `valuePath`, missing `bodyMap`, minor presentation labels.
- **Feed-forward:** Complete contract (endpoints + fields) in turn 2 is sufficient for structure **if** agent knows v0.2 form/scope JSON — today it does not without user paste or prompt fix. Enrich `GET /api/schema` or `agent/prompts/v1.txt` with scope-selector + form-field examples (evidence: turn 3 stall). Fold turn 2 field line into `crud-admin-v0.2` script. Runs 2–3: try **3-turn script only** (no turn 4 hints) to measure repeatability.

#### UC2-S1.2 (pre-fix) — 2026-08-08
- **Platform:** pre-fix (prompt v1)
- **Result:** saved-clean
- **Session / spec:** 1f2a2807-147c-46c7-80d5-4729a7fb6157 / 88a9dbd7-62c0-4c62-ab68-04eed8282879 · **Chat:** `/chat/1f2a2807-147c-46c7-80d5-4729a7fb6157` · **View:** `/specs/88a9dbd7-62c0-4c62-ab68-04eed8282879`
- **Turns / validates / errors:** 5 / 12 / INVALID_PROP_TYPE, UNKNOWN_PROP, SCOPE_PLACEHOLDER_MISSING, INVALID_FORM_FIELD, ROUTE_PARAM_MISMATCH, INVALID_TRANSITION_MAP
- **Interview:** Turn 1 asked attributes, filters, api vs static, endpoints **high-value**. Turn 2 user pasted full contract (endpoints + fields + scope + delete-on-detail); agent fired **2 validates before answering**, then asked scope selector vs route param + embedded delete vs standalone delete **high-value** (matches scenario turn 3 fork). Turn 3 user answered both + “build it”; agent asked form field types + scope.selector binding keys **wrong axis** (schema not in `/api/schema`). Turn 4 user pasted form/scope vocabulary; **4 failed validates**; agent asked detail `presentation.actions[]` vs `sections[].actions[]` **wrong axis**. Turn 5 user pasted embedded-delete shape → **6 validates (5 fail, 1 pass)** → save.
- **Inventions:** none on endpoints or `{scope.companyId}`. User supplied `valuePath`/`labelKey`/`valueKey` for companies selector in turn 3 — not invention. Minor golden deltas: browse `read` still omits `valuePath: "items"`; read detail omits `id` field (user listed id); cta lacks `label`/`placement`; delete action id `act-delete-user`. **Improvement vs S1.1:** create/update include `bodyMap`.
- **Artifact vs target:** matches watch-fors — browse/read/create/update; delete embedded on `read` (`presentation.actions[]`, confirm, DELETE with scope); `cta` browse→create; scope selector → `GET /api/companies` with `valuePath`/`labelKey`/`valueKey`; paths use `{scope.companyId}`; forms use email/role/notes/active with correct types. Diff vs golden: missing browse list `valuePath`, minor labels/ids.
- **Feed-forward:** **3-turn script alone is not viable** without prompt/schema fix — S1.2 needed turns 4–5 vocabulary pastes (repeat of S1.1 pattern). Agent also **prematurely validated** on turn 2 (2 attempts) before scope/delete UX was confirmed. Add to prompt: form field enum, scope.selector shape, detail `presentation.actions[]` (not section-nested). Eval `maxUserTurns: 4` is insufficient for this discovery path if hints are required. S1.3: optional skip hints to confirm stall is deterministic.

#### UC2-S1.3 (pre-fix) — 2026-08-08
- **Platform:** pre-fix (prompt v1)
- **Result:** saved-off-target
- **Session / spec:** b872e51f-294e-44d9-9bf0-84fa71eb7722 / 8c964026-e2c1-46f8-a376-7262549191ea · **Chat:** `/chat/b872e51f-294e-44d9-9bf0-84fa71eb7722` · **View:** `/specs/8c964026-e2c1-46f8-a376-7262549191ea`
- **Turns / validates / errors:** 5 / 5 / INVALID_PROP_TYPE, UNKNOWN_PROP, INVALID_FORM_FIELD, ROUTE_PARAM_MISMATCH, INVALID_TRANSITION_MAP (turns 4–5; first validate turn 4)
- **Interview:** Turn 1 asked ops, fields, endpoints, filters, form subset, special actions **high-value**. Turn 2 user pasted full contract; agent returned ops plan (scope picker, embedded delete, cta) **without** validate or scope UX fork. Turn 3 user gave scenario turn 3 scope line + “build it”. Turn 4 user “let’s go with what we have” — agent still asked form/detail vocabulary (`presentation.form` vs `layout: "form"`) **wrong axis** + 1 failed validate. Turn 5 user pasted combined form + detail + actions shape → **4 validates (3 fail, 1 pass)** → save.
- **Inventions:** none on endpoints. Paths use `{scope.companyId}` but **`entities[0].scope.selectors` omitted entirely** — company picker not wired despite turns 2–3. Minor golden deltas: browse `read` omits `valuePath: "items"`; update `outcomes.cancel` → browse not read; cta lacks label/placement. **Improvements vs S1.1:** `bodyMap` present; read detail includes `id` field.
- **Artifact vs target:** **partial** — browse/read/create/update ✓; delete embedded on `read` ✓; `cta` ✓; forms email/role/notes/active ✓; paths reference `{scope.companyId}` ✓; **`scope.selectors` + `/api/companies` binding missing** ✗ (watch-for fail). Diff vs golden: no entity scope block; missing browse list `valuePath`.
- **Feed-forward:** Vocabulary paste on turn 5 fixed forms/detail/delete but agent **dropped scope.selectors** — prompt should treat scope block as required when user specifies company picker. Turn 4 “go with what we have” does not unblock; agent always needs schema shapes today. Three runs: **none achieved 3-turn save**; all needed turn 4+ hints.

#### UC2-S1 findings (3/3 runs — confirm before UC2-S2)

- **Reliable paths to save:** 3/3 reached `save_rui` **only after user pasted v0.2 JSON vocabulary** (turn 4 and/or 5). Scripted 3-turn path **never saved** in any run. With hints: S1.1 4 turns / 3 validates; S1.2 5 turns / 12 validates; S1.3 5 turns / 5 validates.
- **Contract extraction:** Endpoints, CRUD scope, field list, embedded delete, and `{scope.companyId}` in paths extracted reliably once turn 2 contract is complete. **`valuePath: "items"` on browse list** never inferred (3/3 omit). **S1.3 dropped `scope.selectors`** while keeping scope placeholders in paths — silent off-target save.
- **Known failure modes:** No top-level delete op or row delete (0/3). **`cta` present 3/3.** Primary failure mode is **schema vocabulary** (form `name` vs detail `key`, `presentation.actions[]`, scope.selector shape) — not missing endpoints. Agent repeatedly asks **user** instead of fixing from tools.
- **Interview quality:** Turn 1 interview solid 3/3. Turn 2 plan-after-contract works well. S1.2 re-asked scope/delete after user already stated them (+ premature validate). Vocabulary stalls **3/3** after “build it”.
- **Script implications:** `crud-admin-v0.2` must include turn 2 **field list** + endpoint block (scenario wording). Eval cannot pass at 3 turns until prompt/`/api/schema` enriched. **`maxUserTurns` ≥ 5** if vocabulary hint turns remain in script. Do not promote 3-turn variant as-is.
- **Stability:** `stable: no` — 2/3 `saved-clean`, 1/3 `saved-off-target`; three distinct `contentHash`es; turn count 4–5; validate count 3–12.

**Post-fix acceptance (prompt v1.1, enriched `/api/schema`) — log below when rerun completes.**

- **Gate:** 3-turn script from scenarios doc; **no** user vocabulary paste unless run is `no-save` (then log as failed gate, do not hint-and-continue in the same run).
- **Watch-fors:** scenario watch-fors + [example-domain leakage](#scenario-specific-transcript-signals) + Observe `prompt_version: v1.1`.

#### UC2-S1 post-fix run entries

#### UC2-S1.postfix.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 58f93622-8ff8-4ea2-8026-dd86bec01099 / d1623dac-af76-4385-8b43-28c4e5040d95 · **Chat:** `/chat/58f93622-8ff8-4ea2-8026-dd86bec01099` · **View:** `/specs/d1623dac-af76-4385-8b43-28c4e5040d95`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked field shape, API vs static, endpoints, filters/scopes **high-value**. Turn 2 user pasted full contract (endpoints + CRUD + scope + fields); agent validated and saved **without** turn 3 confirm or scope UX re-ask — user turn 2 already specified `{scope.companyId}`, companies picker endpoint, embedded delete.
- **Inventions:** none on endpoints/paths/scope. Minor golden deltas: browse `read` omits `valuePath: "items"`; browse table omits `notes` column; detail GET omits `?companyId=` query (write/delete include it).
- **Artifact vs target:** matches watch-fors — browse/read/create/update ops; delete embedded on `read` (`presentation.actions[]`, confirm, DELETE binding); `cta` browse→create with label/placement; `scope.selectors[0]` → `GET /api/companies` with `labelKey`/`valueKey`; paths use `{scope.companyId}`; forms email/select/textarea/checkbox for email/role/notes/active. No example-domain leakage.
- **Feed-forward:** **Post-fix gate passed on run 1** — 2-turn save with zero vocabulary paste (vs pre-fix 4–5 turns). Confirm `prompt_version: v1.1` on Observe; runs 2–3 for stability.

#### UC2-S1.postfix.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 2324e685-da11-46ce-b088-c1848b369106 / 33175db4-b021-4ff5-a7f6-dabe5bf55647 · **Chat:** `/chat/2324e685-da11-46ce-b088-c1848b369106` · **View:** `/specs/33175db4-b021-4ff5-a7f6-dabe5bf55647`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked fields, endpoints, needed operations **high-value** (slightly narrower than .1 — no explicit API-vs-static or scope ask). Turn 2 full contract → validate → save; no turn 3, no scope UX re-ask.
- **Inventions:** none. Minor golden deltas: browse `read` omits `valuePath: "items"`; browse table omits `notes`; scope selector binding omits `labelKey`/`valueKey` (`.1` had both). **Improvement vs .1:** read/update GET paths include `?companyId={scope.companyId}`.
- **Artifact vs target:** matches watch-fors — browse/read/create/update; delete embedded on `read`; `cta` browse→create; `scope.selectors[0]` → `GET /api/companies`; paths use `{scope.companyId}`; forms email/select/textarea/checkbox. No example-domain leakage.
- **Feed-forward:** Repeat of .1 pattern — 2-turn gate pass, 1 validate. Artifact shape closely matches .1 (minor selector-key delta). One more run for post-fix stability count.

#### UC2-S1.postfix.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 9dee3391-7204-4938-9442-d64ef9c4ebe0 / b08ba631-c760-42c0-abdf-f5fb340ff946 · **Chat:** `/chat/9dee3391-7204-4938-9442-d64ef9c4ebe0` · **View:** `/specs/b08ba631-c760-42c0-abdf-f5fb340ff946`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked ops, API vs static, endpoints, fields, filters/pagination **high-value** (most thorough opener of the three). Turn 2 user pasted contract **plus scenario turn 3 scope/build line in the same message** (combined turns 2+3); agent validated and saved — no separate turn 3.
- **Inventions:** none. Minor golden delta: browse list `read` still omits `valuePath: "items"`. **Best artifact of post-fix set:** scope selector has `labelKey`/`valueKey`/`valuePath: "items"`; browse table includes `notes`; read/update GET include `?companyId=`.
- **Artifact vs target:** matches watch-fors — full CRUD structure, embedded delete, `cta`, scope selector → `/api/companies`, `{scope.companyId}` in paths, correct form types. No example-domain leakage.
- **Feed-forward:** Third consecutive gate pass. Post-fix acceptance complete — confirm findings block below before UC2-S2.

#### UC2-S1 post-fix findings (3/3 — confirm before UC2-S2)

- **Gate:** **passed 3/3** — every run saved without vocabulary paste. Actual path **2 user turns** (agent saves after contract turn; turn 3 confirm often unnecessary when turn 2 is complete). `.3` merged scenario turns 2+3 into one message — still valid.
- **Reliable paths to save:** 3/3 → `save_rui` on turn 2; **1 validate, 0 errors** each run (vs pre-fix 4–5 turns, 3–12 validates, vocabulary paste required).
- **Contract extraction:** Endpoints, CRUD, embedded delete, `{scope.companyId}`, scope selector, forms — **3/3**. **`valuePath: "items"` on browse list** still omitted 3/3; scope selector `valuePath` appeared on `.3` only. **`scope.selectors` never dropped** (pre-fix S1.3 failure mode gone).
- **Known failure modes (post-fix):** none observed — no vocabulary stalls, no top-level delete, no example-domain leakage, no premature validate loops.
- **Interview quality:** Turn 1 solid 3/3 (breadth varies). Turn 2 contract → save 3/3; scope UX fork never needed when turn 2 specifies companies picker + `{scope.companyId}`.
- **Script implications:** Eval `crud-admin-v0.2` should include turn 2 field list (unchanged). **`maxUserTurns: 3` viable post-fix**; optional turn 3 confirm may be skipped by agent when contract is complete. Pre-fix **`maxUserTurns ≥ 5`** guidance superseded for v1.1.
- **Stability:** `stable: yes` — 3/3 `saved-clean`; same 2-turn / 1-validate flow; three distinct `contentHash`es (minor presentation deltas: notes column, selector keys, `?companyId=` on GET).

#### UC2-S2

#### UC2-S2.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 30656c97-5e42-4b17-8781-1939dd3a4570 / b4f9d024-9d00-4a36-9009-2f7d52f5609d · **Chat:** `/chat/30656c97-5e42-4b17-8781-1939dd3a4570` · **View:** `/specs/b4f9d024-9d00-4a36-9009-2f7d52f5609d`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — complete opener sufficient; agent validated and saved on turn 1 without clarifying questions **ideal for S2**.
- **Inventions:** none. Minor golden deltas: browse table omits `notes` column (field present on detail/forms); delete action id `delete-user` vs golden `op-delete-user`.
- **Artifact vs target:** matches S2 watch-fors (minimal turns, no redundant interview) and UC2 structure — browse/read/create/update; delete embedded on `read`; `cta` browse→create; `scope.selectors[0]` → `GET /api/companies` with `valuePath: "items"`, `labelKey`/`valueKey`; browse list `valuePath: "items"` ✓ (envelope hint landed); paths use `{scope.companyId}`; forms email/select/textarea/checkbox. No leakage.
- **Feed-forward:** Strong one-shot variant — promote as 1-turn eval script when opener includes full contract + envelope hint; turn 2 confirm unnecessary.

#### UC2-S2.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 2849c5ea-0f7a-4e99-9c22-31b8486b1086 / 638f47d0-cc1a-4e85-b42e-ab4bbb26b244 · **Chat:** `/chat/2849c5ea-0f7a-4e99-9c22-31b8486b1086` · **View:** `/specs/638f47d0-cc1a-4e85-b42e-ab4bbb26b244`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — same one-shot as .1; no clarifying questions.
- **Inventions:** none. Minor golden deltas vs .1: `cta` omits `placement: "toolbar"`; browse columns omit `format`; browse table omits `notes`; delete action id `delete-user`.
- **Artifact vs target:** matches — same structural shape as .1 (distinct contentHash): full CRUD, embedded delete, `cta`, scope selector with `valuePath`/`labelKey`/`valueKey`, browse `valuePath: "items"`, `{scope.companyId}` paths, correct form types. No leakage.
- **Feed-forward:** Confirms .1 one-shot pattern — 2/2 runs identical flow (1 turn / 1 validate). One more run for stability.

#### UC2-S2.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** a6d6f317-ae18-445a-9d2d-9828371beb8a / b0dff596-9882-4087-90ce-e8e97636501f · **Chat:** `/chat/a6d6f317-ae18-445a-9d2d-9828371beb8a` · **View:** `/specs/b0dff596-9882-4087-90ce-e8e97636501f`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — third consecutive one-shot; no clarifying questions.
- **Inventions:** none. Minor golden deltas: browse table omits `notes`; delete action id `delete-user`.
- **Artifact vs target:** matches — full CRUD, embedded delete, `cta` with `placement: "toolbar"`, scope selector complete, browse `valuePath: "items"`, correct forms. No leakage.
- **Feed-forward:** UC2-S2 complete — see findings block below.

#### UC2-S2 findings (3/3 — confirm before UC2-S3)

- **Reliable paths to save:** 3/3 one-shot on turn 1 — **1 validate, 0 errors** each; turn 2 confirm never needed.
- **Interview quality:** 3/3 skipped interview entirely when opener is complete — **ideal S2 behavior**, no redundant questions.
- **Contract extraction:** Full CRUD, scope selector, embedded delete, `{scope.companyId}`, form fields, **`valuePath: "items"` on browse + companies** — 3/3 (envelope hint in opener is load-bearing vs UC2-S1).
- **Known failure modes:** none — no vocabulary stalls, no leakage, no top-level delete.
- **Recurring deviations:** browse table omits `notes` column 3/3 (present on detail/forms); three distinct `contentHash`es (minor presentation variance); `cta` `placement` varies run-to-run.
- **Script implications:** **Promote as 1-turn eval variant** — opener must include endpoints, fields, scope, delete placement, **and** envelope hint. Current `crud-admin-v0.2` 2-turn script is conservative; S2 proves 1-turn viable for power-user prompt.
- **Stability:** `stable: yes` — 3/3 `saved-clean`, same 1-turn / 1-validate flow, same artifact family.

#### UC2-S3

#### UC2-S3.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** b8cc1d6f-9013-4bc1-afc9-26fbeb75fac0 / c7f6afad-c0fe-4b42-bceb-cfe89fb60951 · **Chat:** `/chat/b8cc1d6f-9013-4bc1-afc9-26fbeb75fac0` · **View:** `/specs/c7f6afad-c0fe-4b42-bceb-cfe89fb60951`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 agent parsed OpenAPI (paths, User/UserWrite schemas, `companyId` param, response envelopes) and returned detailed ops plan — asked confirm **high-value** (delete on detail + scope implied from YAML). Turn 2 user pasted scripted scope/delete/build line → validate → save.
- **Inventions:** none. Minor golden deltas: browse table omits `notes`; role select labels lowercase `admin`/`member` vs title case.
- **Artifact vs target:** matches S3 watch-fors — **forms from `UserWrite`** (email/role/notes/active, **no `id` on create/update**); email/select/textarea/checkbox types; `companyId` on all scoped bindings; browse + companies `valuePath: "items"` from response schemas; full CRUD, embedded delete, `cta`, scope selector with `labelKey`/`valueKey`. No leakage.
- **Feed-forward:** OpenAPI YAML path works post-fix — 2-turn plan→build; read/write schema split respected. Runs 2–3 for stability.

#### UC2-S3.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 8e802d8c-ed1a-458d-96fd-6ac8ab087149 / d9a60020-ba5c-4b29-a995-e2c784274999 · **Chat:** `/chat/8e802d8c-ed1a-458d-96fd-6ac8ab087149` · **View:** `/specs/d9a60020-ba5c-4b29-a995-e2c784274999`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 agent parsed YAML, proposed company scope selector, asked scope UX confirm **high-value** (shorter plan than .1 — no full ops enumeration). Turn 2 scripted build line → validate → save.
- **Inventions:** none. Minor golden deltas: browse table omits `notes`; distinct contentHash from .1.
- **Artifact vs target:** matches S3 watch-fors — forms from `UserWrite` (no `id` on create/update); email/select/textarea/checkbox; `companyId` on bindings; browse + companies `valuePath: "items"`; full CRUD, embedded delete, `cta`, scope selector. No leakage.
- **Feed-forward:** Same 2-turn pattern as .1; turn 1 interview briefer but scope question still landed. One more run for stability.

#### UC2-S3.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 1cd04b0d-85a8-40a4-9867-55b29acd0d03 / 8dde7520-63ee-4851-8efa-a64598d64b67 · **Chat:** `/chat/1cd04b0d-85a8-40a4-9867-55b29acd0d03` · **View:** `/specs/8dde7520-63ee-4851-8efa-a64598d64b67`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 agent asked scope UX only (company selector for `companyId` param) **high-value** — same narrow fork as .2, no full ops plan. Turn 2 scripted build → validate → save.
- **Inventions:** none. Minor golden deltas: browse table omits `notes`; third distinct contentHash.
- **Artifact vs target:** matches S3 watch-fors — `UserWrite` forms (no `id`); correct field types; `companyId` bindings; `valuePath: "items"`; full CRUD, embedded delete, `cta`, scope selector. No leakage.
- **Feed-forward:** UC2-S3 complete — see findings block below.

#### UC2-S3 findings (3/3 — confirm before UC2-S4)

- **Reliable paths to save:** 3/3 saved on turn 2 — **2 user turns, 1 validate, 0 errors** each; turn 2 scripted scope/delete/build line load-bearing when turn 1 ends with confirm ask.
- **OpenAPI extraction:** Paths, `User`/`UserWrite` schemas, response envelopes, `companyId` param, `/api/companies` — extracted 3/3. **`UserWrite` on forms 3/3** — no `id` on create/update (read/write split never failed).
- **Interview quality:** Turn 1 always asks before build — .1 full ops plan + confirm; .2/.3 narrow scope-selector question only. None re-asked endpoints or field list already in YAML.
- **Known failure modes:** none — no forms-from-read-schema failure, no vocabulary stalls, no leakage.
- **Recurring deviations:** browse `notes` column omitted 3/3; three distinct `contentHash`es; turn 1 plan depth varies (.1 verbose, .2/.3 scope-only).
- **Script implications:** Promote as **2-turn eval variant** — turn 1 YAML paste + turn 2 scope/delete/build confirm (scenario wording). Response schemas in YAML are load-bearing for `valuePath`/`labelKey`/`valueKey`.
- **Stability:** `stable: yes` — 3/3 `saved-clean`, same 2-turn / 1-validate flow, same artifact family.

#### UC2-S4

#### UC2-S4.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** f931741f-2810-4032-9af2-060a5f2d8748 / 1f65db7a-6796-417e-b583-0414e6118b57 · **Chat:** `/chat/f931741f-2810-4032-9af2-060a5f2d8748` · **View:** `/specs/1f65db7a-6796-417e-b583-0414e6118b57`
- **Turns / validates / errors:** 1 / 3 / INVALID_PROP_TYPE, SCOPE_PLACEHOLDER_MISSING (turn 1 only; passed on attempt 3)
- **Interview:** none — agent one-shotted on turn 1; **turn 2 never sent** (delete-on-detail inferred from DELETE endpoint, not explicit user line).
- **Inventions:** none on paths — `c_11`/`u_04` normalized to `{scope.companyId}`/`{userId}`. Minor deltas: `role` field `type: "text"` not `select` (sample showed `"member"` only); browse table omits `notes`.
- **Artifact vs target:** matches S4 watch-fors — **`valuePath: "items"`** on browse + companies ✓; **`labelKey`/`valueKey`** (`name`/`id`) ✓; **`bodyMap`** on create/update ✓; no hardcoded sample IDs in paths ✓; full CRUD, embedded delete, `cta`, scope selector. No leakage.
- **Feed-forward:** Sample-response inference works but needed **3 validates** (scope placeholder + prop type fixes). One-shot skipped scripted turn 2 — acceptable when opener is complete. Watch `role` type inference on runs 2–3.

#### UC2-S4.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-off-target
- **Session / spec:** c2c4bd1b-345a-4f10-ada6-e1bdb9e366dd / f58752f6-67f8-4d5b-8b39-3e40a6b3a3d4 · **Chat:** `/chat/c2c4bd1b-345a-4f10-ada6-e1bdb9e366dd` · **View:** `/specs/f58752f6-67f8-4d5b-8b39-3e40a6b3a3d4`
- **Turns / validates / errors:** 1 / 2 / SCOPE_PLACEHOLDER_MISSING (turn 1; passed attempt 2)
- **Interview:** none — one-shot like .1; turn 2 never sent.
- **Inventions:** **update `write.path` uses `{scope.params.userId}`** instead of `{userId}` — invalid route param binding (read/delete paths correct). `role` as `text` not `select` (same as .1).
- **Artifact vs target:** **partial** — S4 inference watch-fors mostly pass (`valuePath: "items"`, `labelKey`/`valueKey`, `bodyMap`, no `c_11`/`u_04` in paths) but **update PATCH path wrong** ✗; full CRUD + embedded delete + `cta` + scope otherwise ✓.
- **Feed-forward:** Sample-response path can pass validate with a broken update binding — check whether validator should reject `{scope.params.*}` in route paths. Run 3 for stability.

#### UC2-S4.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** cedc2985-be94-4eb6-a2f0-6b757816379d / 0c55e442-2888-4494-a1c4-15a359fcc101 · **Chat:** `/chat/cedc2985-be94-4eb6-a2f0-6b757816379d` · **View:** `/specs/0c55e442-2888-4494-a1c4-15a359fcc101`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 detailed ops plan from samples (valuePath, scope, CRUD) — asked **role options** before build **high-value**; turn 2 user scripted delete/build line (did not answer role enum) → validate → save.
- **Inventions:** none. **Best S4 artifact:** browse includes `notes` column; `role` as `select` (admin/member inferred); all paths use `{userId}` correctly (fixes .2 failure mode).
- **Artifact vs target:** matches S4 watch-fors — `valuePath: "items"`, `labelKey`/`valueKey`, `bodyMap`, no hardcoded sample IDs; full CRUD, embedded delete, `cta`, scope selector. No leakage.
- **Feed-forward:** UC2-S4 complete — 2-turn scripted path (.3) produced cleanest artifact vs one-shot .1/.2.

#### UC2-S4 findings (3/3 — confirm before UC2-S5)

- **Reliable paths to save:** 3/3 reached save — flow split: **2/3 one-shot** (.1/.2 turn 1 only), **1/3 scripted 2-turn** (.3). Validates: 3, 2, 1 respectively.
- **Sample inference:** **`valuePath: "items"` 3/3**; **`labelKey`/`valueKey` 3/3**; **`bodyMap` 3/3**; sample ID normalization 3/3 (no `c_11`/`u_04` in saved paths). **`.2` update PATCH used `{scope.params.userId}`** — silent off-target pass.
- **Known failure modes:** One-shot can save with wrong update path (.2); `role` as `text` when one-shot (.1/.2). Turn 1 plan + turn 2 confirm (.3) avoids bad path and gets `select` for role.
- **Interview quality:** .1/.2 no interview (immediate save). .3 asked role options — user skipped answer, agent still inferred admin/member select.
- **Script implications:** Prefer **2-turn script** for S4 eval (samples turn 1 + delete/build turn 2) — evidence .3 cleanest. Consider validator rule for `{scope.params.*}` in route paths (.2).
- **Stability:** `stable: no` — 2/3 `saved-clean`, 1/3 `saved-off-target`; turn count 1–2; validate count 1–3.

#### UC2-S5

#### UC2-S5.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 2e684609-53e9-4ddc-b1c8-88fd99b64fae / da37ba7c-510f-4912-9d10-1688b0645cd7 (latest; read-only interim save b209a111-a68a-4345-bbd6-0fc2cccf3943) · **Chat:** `/chat/2e684609-53e9-4ddc-b1c8-88fd99b64fae` · **View:** `/specs/da37ba7c-510f-4912-9d10-1688b0645cd7`
- **Turns / validates / errors:** 2 / 3 / INVALID_PROP_TYPE
- **Interview:** Turn 1 user asked read-only; agent **saved read-only spec immediately** (dual-save pattern) without propose-only hold. Turn 2 scope expansion → full CRUD rebuild + second save; turn 3 "save it" **not sent**.
- **Inventions:** none. Single-tenant paths omit `companyId` ✓; no scope block ✓.
- **Artifact vs target (latest spec):** matches S5 watch-fors — **`cta` browse→create** after expansion ✓; **delete embedded on read** with confirm ✓; **create/update outcomes** (success/error/cancel) all present ✓; titles CRUD-appropriate (not read-only framing); `valuePath: "items"` on browse; forms email/select/checkbox/textarea. No leakage.
- **Feed-forward:** Dual-save on turn 1 (read-only) then expand on turn 2 — judge final artifact; eval script may need turn 2 expansion only if turn 1 save is acceptable. Runs 2–3 for stability.

#### UC2-S5.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 3721a4c7-0093-4a47-8859-ad485e8376de / ed568624-a1aa-4baf-8b0e-7d63b9e26220 (latest; read-only interim 99759412-1d26-43df-aaef-ce1d5ff317f4) · **Chat:** `/chat/3721a4c7-0093-4a47-8859-ad485e8376de` · **View:** `/specs/ed568624-a1aa-4baf-8b0e-7d63b9e26220`
- **Turns / validates / errors:** 2 / 2 / none
- **Interview:** Same dual-save as .1 — turn 1 read-only request → immediate save; turn 2 expansion → full CRUD second save; turn 3 not sent.
- **Inventions:** none. Single-tenant, no scope ✓.
- **Artifact vs target:** matches S5 watch-fors — `cta` with placement, embedded delete with confirm, create/update outcomes complete, CRUD titles, `valuePath: "items"`, correct form types. No leakage.
- **Feed-forward:** Confirms .1 dual-save + expand pattern with cleaner validates (2 vs 3). One more run for stability.

#### UC2-S5.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 202f641f-6737-4adc-90fe-7b9ea9c47da7 / 3a5674aa-df6a-4ae7-aba1-2125dac26bd2 (latest; read-only interim 7c73b233-6fc6-4323-be4e-906e12484005) · **Chat:** `/chat/202f641f-6737-4adc-90fe-7b9ea9c47da7` · **View:** `/specs/3a5674aa-df6a-4ae7-aba1-2125dac26bd2`
- **Turns / validates / errors:** 2 / 2 / none
- **Interview:** Third dual-save repeat — turn 1 read-only → save; turn 2 expansion → full CRUD save; turn 3 not sent.
- **Inventions:** none. Single-tenant ✓.
- **Artifact vs target:** matches S5 watch-fors — `cta`, embedded delete + confirm, create/update outcomes, no read-only titles on CRUD ops, `valuePath: "items"`. No leakage.
- **Feed-forward:** UC2-S5 complete — see findings block below.

#### UC2-S5 findings (3/3 — confirm before UC2-S6)

- **Reliable paths to save:** 3/3 reached save on **latest spec** after turn 2 expansion — **dual-save every run** (read-only interim save on turn 1, full CRUD on turn 2). Turn 3 "save it" **never sent** 3/3.
- **Scope expansion quality:** **`cta` 3/3**, **embedded delete 3/3**, **create/update outcomes 3/3** — late-added ops did not drop outcomes or misplace delete. Agent re-planned cleanly; no top-level delete.
- **Known failure modes:** none on final artifacts. Turn 1 premature read-only save is consistent (not a watch-for fail — user did ask for read-only first).
- **Interview quality:** No propose-only hold on turn 1 — agent saves read-only immediately 3/3, then rebuilds on turn 2.
- **Script implications:** Eval as **2-turn minimum** (read-only → expand); turn 3 confirm optional. Expect **two spec IDs per session** — grader must target latest save. `.1` had 3 validates (INVALID_PROP_TYPE); `.2`/`.3` had 2 validates, 0 errors.
- **Stability:** `stable: yes` — 3/3 `saved-clean` on final artifact; same dual-save + 2-turn flow; three distinct `contentHash`es (minor presentation variance).

#### UC2-S6

#### UC2-S6.1 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** e75c161d-3b8c-474b-8365-fe48365b44de / 55e4d907-14be-4cb4-babd-1556b0915727 · **Chat:** `/chat/e75c161d-3b8c-474b-8365-fe48365b44de` · **View:** `/specs/55e4d907-14be-4cb4-babd-1556b0915727`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 parsed cURL block; asked Edit link + cancel navigation confirm **reasonable** (not redundant — cURL doesn't specify UX). Turn 2 "yep that's it. build and save." → validate → save.
- **Inventions:** none. **`co_01`/`usr_101` normalized** to `{scope.companyId}`/`{userId}` ✓.
- **Artifact vs target:** matches S6 watch-fors — no hardcoded sample IDs in paths; **`valuePath: "items"`** on browse + companies; **form fields from cURL bodies** (email, role, notes, active); full CRUD, embedded delete, `cta`, scope selector with `labelKey`/`valueKey`. No leakage.
- **Feed-forward:** cURL handoff path works cleanly — 2-turn, 1 validate. Runs 2–3 for stability.

#### UC2-S6.2 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** b4175c4a-f474-49cb-8428-fe6987892c05 / c7de37e1-8594-4482-b17a-16b2bcea8d5d · **Chat:** `/chat/b4175c4a-f474-49cb-8428-fe6987892c05` · **View:** `/specs/c7de37e1-8594-4482-b17a-16b2bcea8d5d`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — **one-shot** on turn 1; turn 2 confirm **not sent** (opener complete enough).
- **Inventions:** none. `co_01`/`usr_101` → `{scope.companyId}`/`{userId}` ✓.
- **Artifact vs target:** matches S6 watch-fors — no hardcoded IDs; `valuePath: "items"`; forms from cURL bodies; full CRUD, embedded delete, `cta`, scope selector complete. No leakage.
- **Feed-forward:** Confirms cURL path can one-shot like S2 — distinct contentHash from .1. Run 3 for stability.

#### UC2-S6.3 — 2026-08-08
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** b900e55b-1edb-4ea1-b2bd-c890d6a176c1 / f8602404-b090-4244-a46e-9a11eeaf8e6d · **Chat:** `/chat/b900e55b-1edb-4ea1-b2bd-c890d6a176c1` · **View:** `/specs/f8602404-b090-4244-a46e-9a11eeaf8e6d`
- **Turns / validates / errors:** 1 / 2 / INVALID_TRANSITION_MAP (turn 1; passed attempt 2)
- **Interview:** none — one-shot like .2; turn 2 not sent.
- **Inventions:** none. `co_01`/`usr_101` normalized ✓.
- **Artifact vs target:** matches S6 watch-fors — no hardcoded IDs; `valuePath: "items"`; forms from cURL bodies; full CRUD, embedded delete, `cta`, scope selector. No leakage.
- **Feed-forward:** UC2-S6 complete — see findings block below.

#### UC2-S6 findings (3/3 — UC2 complete)

- **Reliable paths to save:** 3/3 saved — **sample-ID normalization never failed** (`co_01`/`usr_101` → placeholders 3/3). Flow: .1 **2-turn** (UX confirm), .2/.3 **1-turn** one-shot.
- **cURL extraction:** `valuePath: "items"` 3/3; form fields from `-d` bodies 3/3; scope/companies binding 3/3; full CRUD structure 3/3.
- **Known failure modes:** none on final artifacts — **primary S6 trap (hardcoded IDs) avoided 3/3**. `.3` needed 2 validates (`INVALID_TRANSITION_MAP` self-corrected).
- **Interview quality:** .1 asked Edit/cancel UX (reasonable); .2/.3 skipped interview when opener complete.
- **Script implications:** cURL paste is viable onboarding story post-fix. Eval variant: turn 1 cURL block; turn 2 optional confirm. One-shot works when opener includes CRUD + scope + delete placement + role enum.
- **Stability:** `stable: yes` — 3/3 `saved-clean`; ID normalization reliable; turn count 1–2.

### UC2 findings (post-fix exploration complete)

- **Post-fix gate (S1):** passed 3/3 — vocabulary paste no longer required; 2-turn save typical.
- **Input-form coverage:** S2 one-shot ✓, S3 OpenAPI/UserWrite ✓, S4 sample inference mostly ✓ (`.2` bad update path), S5 scope expansion ✓, S6 cURL normalization ✓.
- **Cross-scenario reliability:** Full CRUD + embedded delete + `cta` + scope (when requested) — **high** post-fix. **`valuePath: "items"`** lands when envelope hinted (S2) or in samples/YAML/cURL — less reliable on thin prose alone (S1).
- **Remaining off-target modes:** S4 `.2` `{scope.params.userId}`; S4/S1 `role` as `text` on one-shot; browse `notes` column often omitted.
- **Eval promotion priorities:** S2 1-turn variant, S1 2-turn with field list, S3 2-turn YAML, S4 **2-turn** (not one-shot), S5 2-turn dual-save (grade latest spec), S6 1–2 turn cURL.
- **Validator/product follow-ups:** reject `{scope.params.*}` in route paths (S4.2); consider browse `valuePath` prompt nudge.

---

## UC3 — AI review queue

### Run entries

#### UC3-S1

#### UC3-S1.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 9bef8ec0-b50b-4a4b-9cc2-b1a826500e19 / fffdf215-526a-4bfc-9f9b-c9cef4a494b2 · **Chat:** `/chat/9bef8ec0-b50b-4a4b-9cc2-b1a826500e19` · **View:** `/specs/fffdf215-526a-4bfc-9f9b-c9cef4a494b2`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 asked API response shapes — list envelope vs array, sample record fields, detail content field name **high-value** (user did not answer). Turn 2 user gave scripted clarify (detail buttons, status filter, build) → agent validated and saved without schema paste.
- **Inventions:** `content` as draft body field key (agent asked for detail field name; user skipped). Filter options pending/approved/rejected inferred from context. No invented endpoints.
- **Artifact vs target:** matches — browse + read only; **2 embedded `act` actions on `read`** (Approve primary, Reject danger) with POST approve/reject bindings; success outcomes navigate to `op-browse-drafts`; **`row` transition** inbox→detail; **`presentation.filter`** on browse for status. Columns id/confidence/model/ticketId/status per turn 1. API mode, no static records, no example-domain leakage (`submissions`/`ent-submissions` absent). Minor deltas: browse `read` omits `valuePath` (no envelope given); detail uses `content` not `draftText`.
- **Feed-forward:** Endpoints in turn 1 + turn 2 clarify sufficient for clean HITL save post-fix — mirrors UC2-S1 2-turn gate. Eval `ai-review-queue-v0.2` should carry endpoints in prompt/script (harness `mockApi` gap). Agent saved without response-shape answers — acceptable when endpoints + HITL UX specified; note if `valuePath` misses on API with `{items}` envelope.

#### UC3-S1.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 3016b140-02e9-4622-8fb4-c6fe529188e2 / ed3823f8-48cc-4b04-b4f3-796ae9553fe5 · **Chat:** `/chat/3016b140-02e9-4622-8fb4-c6fe529188e2` · **View:** `/specs/ed3823f8-48cc-4b04-b4f3-796ae9553fe5`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 returned full HITL ops plan (browse/read + embedded approve/reject) then asked detail field names (`draftText`?, ticket context) **high-value** — user did not answer. Turn 2 scripted clarify → validate → save without schema paste.
- **Inventions:** `sourceTicket` column/field key (from user “source ticket” wording); `draftText` for body (agent suggested, user skipped confirm). Filter options inferred. No invented endpoints.
- **Artifact vs target:** matches — 2 embedded acts on `read` with POST approve/reject + success→inbox outcomes; `row` transition; `presentation.filter` for status; browse columns id/model/confidence/sourceTicket/status; API mode; no leakage. Minor deltas vs .1: `draftText` vs `content`, `sourceTicket` vs `ticketId`; distinct contentHash (presentation variance only).
- **Feed-forward:** Repeat of .1 — 2-turn / 1-validate HITL path stable. Turn 1 ops plan before shape ask is a slight flow variant; both runs save without envelope/field answers.

#### UC3-S1.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-off-target
- **Session / spec:** 60c27026-376c-4d14-9367-66b0c6a464bd / 74d9a476-756d-44ce-8007-7c1a5c831ecb · **Chat:** `/chat/60c27026-376c-4d14-9367-66b0c6a464bd` · **View:** `/specs/74d9a476-756d-44ce-8007-7c1a5c831ecb`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — **one-shot** on turn 1; agent validated and saved immediately with no clarify turn. **Scenario turn 2 never sent** (detail-buttons + status filter + build).
- **Inventions:** `content` for draft body; no status filter options. No invented endpoints.
- **Artifact vs target:** **partial** — 2 embedded acts on `read` with POST approve/reject + success→inbox ✓; `row` transition ✓; browse columns id/confidence/model/ticketId ✓; API mode, no leakage ✓. **`presentation.filter` for status missing** ✗ (load-bearing turn 2 requirement); browse table omits status column; no detail-vs-row confirm in conversation.
- **Feed-forward:** One-shot after turn 1 alone drops status filter — eval/script must keep turn 2 clarify. When user sends full 2-turn script, HITL structure is reliable (.1/.2); do not treat .3 as model regression (incomplete scenario execution).

#### UC3-S1 findings (3/3 — confirm before UC3-S2)

- **Reliable paths to save:** 3/3 reached `save_rui` — **2/3 on scripted 2-turn path** (.1/.2), **1/3 one-shot** (.3 turn 2 omitted). Validates: 1 each, 0 errors all runs.
- **HITL structure:** **Acts embedded on `read` 3/3** — no top-level act ops, no row buttons. Success outcomes navigate to inbox 3/3. `row` transition 3/3.
- **Status filter:** present 2/3 (.1/.2 when turn 2 sent); **missing .3** when agent one-shotted after turn 1 only.
- **Interview quality:** Turn 1 shape/field questions **high-value** (.1/.2); agent saves without answers when user sends turn 2 build line. .3 skipped interview entirely (opener complete enough for structure, not for filter).
- **Known failure modes:** none on validate — primary gap is **turn 2 clarify load-bearing** for filter. Browse `valuePath` omitted 3/3 (no envelope in script). Field naming varies (`ticketId`/`sourceTicket`/`content`/`draftText`).
- **Script implications:** Promote as **2-turn eval script** — turn 1 story + endpoints; turn 2 detail-buttons + status filter + build (current eval has this but **omits endpoints in turn 1**). Do not rely on one-shot for full watch-fors.
- **Stability:** `stable: yes` — 2/3 `saved-clean` on full 2-turn script, same artifact family; .3 off-target from procedural skip (turn 2 not sent), not structural drift on complete script.

#### UC3-S2

#### UC3-S2.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 33c92bb4-6a62-4ac5-a668-dc6f65afceda / 0bfb321b-23e9-48e5-9435-83af889e6d2c · **Chat:** `/chat/33c92bb4-6a62-4ac5-a668-dc6f65afceda` · **View:** `/specs/0bfb321b-23e9-48e5-9435-83af889e6d2c`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — complete opener included envelope shape, endpoints, detail-button placement, status filter, and “validate and save”; agent one-shotted **ideal S2 behavior**. Turn 2 “go.” **not sent** (unnecessary).
- **Inventions:** none — columns/fields from user `{items:[{id, ticketId, confidence, model, status, draftText}]}` hint; filter options from user pending/approved/rejected.
- **Artifact vs target:** matches — 2 embedded acts on `read` with POST approve/reject + success→inbox; `row` transition; **`presentation.filter`** for status; **`valuePath: "items"`** on browse ✓ (S1 gap fixed when envelope hinted); detail `draftText` section; browse columns id/ticketId/confidence/model/status. API mode, no leakage.
- **Feed-forward:** Strong **1-turn eval variant** when opener carries full contract + `{items:[...]}` envelope — mirrors UC2-S2 one-shot. Contrast S1: envelope hint is load-bearing for `valuePath`.

#### UC3-S2.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 0e287710-e9ec-47c3-b5b3-5a266acf720a / be2f0bfa-4a62-4c55-88b6-759d4c908edc · **Chat:** `/chat/0e287710-e9ec-47c3-b5b3-5a266acf720a` · **View:** `/specs/be2f0bfa-4a62-4c55-88b6-759d4c908edc`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — same one-shot as .1; no clarifying questions; turn 2 “go.” not sent.
- **Inventions:** none — fields/filter from user opener.
- **Artifact vs target:** matches — 2 embedded acts on `read` + success→inbox; `row` transition; `presentation.filter`; **`valuePath: "items"`**; browse columns id/ticketId/confidence/model/status; detail includes `draftText`. Minor delta vs .1: `draftText` in single “Draft details” section (not separate content section); status column `badge` on browse. Distinct contentHash, same artifact family.
- **Feed-forward:** Confirms .1 one-shot pattern — 2/2 runs identical flow (1 turn / 1 validate). One more run for stability.

#### UC3-S2.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 0cfbce3b-c20a-4e36-814b-74e04db6328f / 745319e3-8036-48bd-ad5e-6107d2cdeaa1 · **Chat:** `/chat/0cfbce3b-c20a-4e36-814b-74e04db6328f` · **View:** `/specs/745319e3-8036-48bd-ad5e-6107d2cdeaa1`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — third consecutive one-shot; turn 2 “go.” not sent.
- **Inventions:** none.
- **Artifact vs target:** matches — 2 embedded acts on `read` + success→inbox; `row` transition; `presentation.filter`; **`valuePath: "items"`**; browse columns id/ticketId/confidence/model/status; separate “Draft text” section with `draftText`. Minor delta: detail “Details” section omits `id` field. Distinct contentHash, same artifact family as .1/.2.
- **Feed-forward:** UC3-S2 complete — see findings block below.

#### UC3-S2 findings (3/3 — confirm before UC3-S3)

- **Reliable paths to save:** 3/3 **one-shot on turn 1** — 1 validate, 0 errors each; turn 2 “go.” never needed (opener includes “validate and save”).
- **HITL structure:** Acts embedded on `read` 3/3; success→inbox outcomes 3/3; `row` transition 3/3; no row buttons or top-level acts.
- **Envelope inference:** **`valuePath: "items"` 3/3** when opener includes `{items:[...]}` — fixes S1 gap where envelope was absent.
- **Interview quality:** 3/3 skipped interview when opener complete — **ideal S2 behavior**, no redundant questions.
- **Known failure modes:** none observed.
- **Recurring deviations:** three distinct `contentHash`es (detail section layout varies: single vs split section; `id` on detail sometimes omitted); presentation-only variance.
- **Script implications:** **Promote as 1-turn eval variant** — opener must include endpoints, field shape/envelope, detail-button placement, status filter, and build instruction. Strongest UC3 script candidate so far.
- **Stability:** `stable: yes` — 3/3 `saved-clean`, same 1-turn / 1-validate flow, same artifact family.

#### UC3-S3

#### UC3-S3.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-negotiated
- **Session / spec:** 2c056199-42b9-47ed-a2d7-14b08bb75f65 / de53bc26-0e77-459a-b917-330ab94ffa6c · **Chat:** `/chat/2c056199-42b9-47ed-a2d7-14b08bb75f65` · **View:** `/specs/de53bc26-0e77-459a-b917-330ab94ffa6c`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 **pushback before first validate** — agent stated row-level approve/reject unsupported, offered browse → row → detail → embedded acts: *“RapidUI v0.2 doesn’t yet support ‘Approve’/‘Reject’ buttons embedded directly in each table row…”* **high-value**; asked if detail-screen flow works. Turn 2 user accepted → validate → save. No validator-driven retry for row actions.
- **Inventions:** `snippet` browse column; `content` detail field — minimal columns for “fast” workflow; no invented endpoints.
- **Artifact vs target:** matches valid alternative — 2 embedded acts on `read` with POST approve/reject + success→inbox; `row` transition; no row buttons, no top-level acts. Minimal browse (id/snippet) tuned to speed ask. No status filter (not in S3 script). No leakage.
- **Feed-forward:** **Prompt-level negotiation works** — caught invalid row-action ask before compose/validate; 1 validate to save. Quote-worthy pushback for product copy. Runs 2–3: confirm repeatability.

#### UC3-S3.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-negotiated
- **Session / spec:** 82c843d1-6b88-498d-a87b-c4c337498b8c / 665ec16c-96ca-4e52-b4da-33da6c3b206d · **Chat:** `/chat/82c843d1-6b88-498d-a87b-c4c337498b8c` · **View:** `/specs/665ec16c-96ca-4e52-b4da-33da6c3b206d`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 **pushback before first validate** — *“RapidUI v0.2 doesn’t support inline approve/reject buttons directly in each table row”*; offered browse→detail→embedded acts; briefly noted link-column workaround (not built). Turn 2 user accepted → validate → save. No row-action validate retries.
- **Inventions:** `content` column/field for minimal fast-review table; no invented endpoints.
- **Artifact vs target:** matches valid alternative — 2 embedded acts on `read` + success→inbox; `row` transition; no row buttons. Minimal browse (id/content). Same artifact family as .1 (distinct contentHash: `content` vs `snippet`). No leakage.
- **Feed-forward:** Repeat of .1 negotiation pattern — 2/2 prompt-level catch before validate. One more run for stability.

#### UC3-S3.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-negotiated
- **Session / spec:** c3df735b-c1d5-4e41-959f-79fefe7d79dc / 2d630d48-2ff4-4998-805a-dd8574ee20a4 · **Chat:** `/chat/c3df735b-c1d5-4e41-959f-79fefe7d79dc` · **View:** `/specs/2d630d48-2ff4-4998-805a-dd8574ee20a4`
- **Turns / validates / errors:** 2 / 1 / none
- **Interview:** Turn 1 **pushback before first validate** — *“RUI v0.2 doesn’t support inline row-level action buttons—actions must live on a detail screen”*; outlined browse→detail→embedded acts plan and asked to proceed. Turn 2 user accepted → validate → save. No row-action validate retries.
- **Inventions:** `title`/`content` fields for minimal fast-review UI; no invented endpoints.
- **Artifact vs target:** matches valid alternative — 2 embedded acts on `read` + success→inbox; `row` transition; no row buttons. Minimal browse (id/title). Same artifact family as .1/.2. No leakage.
- **Feed-forward:** UC3-S3 complete — see findings block below.

#### UC3-S3 findings (3/3 — confirm before UC3-S4)

- **Reliable paths to save:** 3/3 **saved-negotiated** — 2 turns, 1 validate, 0 errors each after user accepts detail-screen alternative.
- **Pushback quality:** **3/3 caught row-action ask in prose before first validate** — prompt v1.1 negotiate rule working; **0/3** tried invalid row buttons and burned validate attempts.
- **HITL structure after negotiation:** Acts embedded on `read` 3/3; success→inbox 3/3; `row` transition 3/3; no top-level acts.
- **Negotiation wording:** varies (.1 “doesn’t yet support”, .2 “inline…directly in each table row” + link workaround mention, .3 “actions must live on a detail screen” + ops plan) — all effective.
- **Known failure modes:** none — no silent row-action builds, no validator-only catch.
- **Recurring deviations:** minimal browse columns tuned to “fast” ask (snippet/content/title); three distinct `contentHash`es; field naming varies.
- **Script implications:** Eval should include turn 1 row-button ask + turn 2 acceptance — tests prompt negotiation, not validator. No schema vocabulary paste needed.
- **Stability:** `stable: yes` — 3/3 `saved-negotiated`, same 2-turn / 1-validate flow, same valid HITL artifact family.

#### UC3-S4

#### UC3-S4.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-off-target
- **Session / spec:** 62adda70-1490-4e10-8727-f1add84601bf / 688ec1de-7249-4fda-babf-b9cea4f72983 (latest; interim 6a845627-61e3-4b12-8a7d-e90bbe1c832d on turn 2) · **Chat:** `/chat/62adda70-1490-4e10-8727-f1add84601bf` · **View:** `/specs/688ec1de-7249-4fda-babf-b9cea4f72983`
- **Turns / validates / errors:** 3 / 2 / none
- **Interview:** Turn 1 proposed HITL plan but wrong actions (Update + embedded **Send**, not approve/reject); asked API vs static + endpoint list **high-value**. Turn 2 user gave browse/read endpoints + fields → agent **validated and saved immediately** (1 act on read in interim spec) **before action endpoints** — S4 watch-for fail. Turn 3 user gave approve/reject POSTs → second validate/save. **Turn 4 “save it” not sent.**
- **Inventions:** **`op-update-draft`** with PATCH `/api/drafts/{draftId}` + edit link — user never requested edit/update; carried from turn 1 Send/edit plan. Turn 1 interview suggested POST `/send` endpoint not in user script.
- **Artifact vs target (latest spec):** **partial** — 2 embedded acts on `read` with POST approve/reject + success→inbox ✓; `row` transition ✓; browse/read fields match turn 2 ✓. **`op-update-draft` + PATCH binding spurious** ✗; no status filter (not in S4 script). Dual-save: interim spec on turn 2 lacked approve/reject acts.
- **Feed-forward:** S4 discovery weak — agent saves on turn 2 without action endpoints (dead-end risk if user stops). Eval script must include turn 3 action endpoints; prompt may need “do not save HITL until approve/reject endpoints known.” Runs 2–3: watch for repeat premature save.

#### UC3-S4.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** b27098fa-48a7-4c9f-b9c3-8b1215cca04f / 43c9b31e-f8aa-48dc-82ef-8eaa0001eb47 · **Chat:** `/chat/b27098fa-48a7-4c9f-b9c3-8b1215cca04f` · **View:** `/specs/43c9b31e-f8aa-48dc-82ef-8eaa0001eb47`
- **Turns / validates / errors:** 3 / 1 / none
- **Interview:** Turn 1 asked data binding (API vs static), draft fields, review actions (approve/reject/edit/delete), post-action navigation **high-value**. Turn 2 user gave fields + browse/read endpoints → agent **did not save**; asked for approve/send action endpoint **high-value** (framed as POST `/send` but blocked until action known). Turn 3 user gave approve/reject POSTs → validate → save. **First validate on turn 3** ✓. Turn 4 not sent.
- **Inventions:** none — browse/read + approve/reject only; no spurious update op (contrast .1).
- **Artifact vs target:** matches — 2 embedded acts on `read` + success→inbox; `row` transition; browse columns id/ticketId/confidence; detail ticketId/confidence/draftText; API mode, no leakage. Single save, no dual-save.
- **Feed-forward:** **Better S4 path** — agent held until action endpoints on turn 3. Turn 2 “Send” framing persists but user’s approve/reject answer redirected cleanly. One more run for stability vs .1 premature save.

#### UC3-S4.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 9c3defdf-4fb0-46ab-a5a9-324c9db6f18f / 1131bc33-4a04-46f6-99e6-89990242937a · **Chat:** `/chat/9c3defdf-4fb0-46ab-a5a9-324c9db6f18f` · **View:** `/specs/1131bc33-4a04-46f6-89990242937a`
- **Turns / validates / errors:** 3 / 2 / INVALID_TRANSITION_MAP (turn 3 attempt 1; passed attempt 2)
- **Interview:** Turn 1 asked draft fields, API endpoints (list/detail/approve/update/reject), static vs API **high-value**. Turn 2 user gave fields + browse/read → agent **did not save**; asked approve endpoint/method (offered POST approve vs PATCH status) **high-value**. Turn 3 approve/reject + back-to-list → validate (fail→pass) → save. **First validate on turn 3** ✓. Turn 4 not sent.
- **Inventions:** none — browse/read + embedded approve/reject only.
- **Artifact vs target:** matches — 2 embedded acts on `read` + success→inbox; `row` transition; fields ticketId/confidence/text; single save. Same artifact family as .2. No leakage.
- **Feed-forward:** UC3-S4 complete — see findings block below.

#### UC3-S4 findings (3/3 — confirm before UC3-S5)

- **Reliable paths to save:** 3/3 reached save — **2/3 held until turn 3** (.2/.3), **1/3 premature save on turn 2** (.1 dual-save). Turn 4 confirm **never sent** 3/3; agent saves once action endpoints arrive.
- **Discovery interview:** Turn 1 field/endpoint questions **high-value** 3/3. **2/3 blocked save after turn 2** until action endpoint known (.2/.3); .1 saved with wrong Send/update plan instead.
- **HITL structure (latest spec):** Acts on `read` 3/3 (after .1 turn 3 fix); success→inbox 3/3; `row` transition 3/3. **.1 spurious `op-update-draft`** + PATCH binding ✗.
- **Known failure modes:** Premature save before action endpoints (.1); turn 1/2 “Send”/PATCH framing persists but usually corrected when user gives approve/reject (.2/.3). `.3` needed 2 validates (`INVALID_TRANSITION_MAP` self-corrected).
- **Script implications:** **4-turn script load-bearing** — turn 3 action endpoints required; eval must not stop at turn 2. Prompt nudge: do not save HITL queue until approve/reject paths known; avoid defaulting to update/send ops.
- **Stability:** `stable: no` — 2/3 `saved-clean`, 1/3 `saved-off-target`; interview hold 2/3; three distinct flows (dual-save vs single-save).

#### UC3-S5

(Base — revised turn 1 includes `{items:[...]}` + field keys; see scenarios doc. Endpoints-only turn 1 causes schema interview stall.)

#### UC3-S5.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 47fbf880-1c54-45cc-a610-ed462df71f61 / 75b30bf6-cb02-4322-a1c3-caa20755b621 · **Chat:** `/chat/47fbf880-1c54-45cc-a610-ed462df71f61` · **View:** `/specs/75b30bf6-cb02-4322-a1c3-caa20755b621`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — revised turn 1 (envelope + field keys + endpoints) sufficient; agent one-shotted. **Turn 2 (danger variant + build) not sent** — agent inferred `variant: danger` on Remove Listing from turn 1 wording.
- **Inventions:** none — columns/fields/endpoints from user turn 1.
- **Artifact vs target:** matches — flags domain (not drafts); 2 embedded acts on `read`; Remove Listing POST **`variant: danger`** ✓; Dismiss Flag POST **`variant: secondary`** (minor vs primary); success→browse ✓; `row` transition ✓; **`valuePath: "items"`** ✓; browse/detail fields match script. No leakage.
- **Feed-forward:** Revised turn 1 fixes schema stall — no JSON-sample interview. Turn 2 optional when opener complete (like UC3-S2). Runs 2–3: send turn 2 anyway to test explicit danger ask vs inference.

#### UC3-S5.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** e51df231-0bf7-4171-9235-f1261c501834 / a5339622-807f-4008-a313-067607d01c35 · **Chat:** `/chat/e51df231-0bf7-4171-9235-f1261c501834` · **View:** `/specs/a5339622-807f-4008-a313-067607d01c35`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — same one-shot as .1; turn 2 not sent.
- **Inventions:** none.
- **Artifact vs target:** matches — flags domain; 2 embedded acts (Remove Listing danger POST, Dismiss Flag secondary POST); success→browse; `row` transition; **`valuePath: "items"`**; field keys from script. Same artifact family as .1 (Dismiss `secondary` again).
- **Feed-forward:** Confirms .1 — revised turn 1 alone is stable 2/2. One more run for stability; turn 2 may remain optional.

#### UC3-S5.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** 592c7bb2-f5cd-456c-b8c0-7a500122591d / 177e8068-463c-4e08-a1f3-177413ba7639 · **Chat:** `/chat/592c7bb2-f5cd-456c-b8c0-7a500122591d` · **View:** `/specs/177e8068-463c-4e08-a1f3-177413ba7639`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** none — third consecutive one-shot; turn 2 not sent.
- **Inventions:** none.
- **Artifact vs target:** matches — flags domain; Remove Listing danger POST, Dismiss Flag **primary** POST; success→browse; `row` transition; **`valuePath: "items"`**. Minor delta vs .1/.2: detail omits id/listingId (listing + reason/score only); Dismiss `primary` not `secondary`.
- **Feed-forward:** UC3-S5 complete — see findings block below.

#### UC3-S5 findings (3/3 — confirm before UC3-S6)

- **Reliable paths to save:** 3/3 **one-shot on revised turn 1** — 1 validate, 0 errors each; **turn 2 never sent** 3/3 (optional when opener includes envelope + field keys + endpoints).
- **Domain generalization:** **3/3** flags/remove-listing/dismiss — no support drafts/approve/reject residue; HITL structure (browse→detail→embedded acts) holds across domain swap.
- **HITL structure:** Acts on `read` 3/3; Remove Listing **`variant: danger`** 3/3 (inferred without turn 2); success→browse 3/3; `row` transition 3/3; **`valuePath: "items"`** 3/3.
- **Script revision impact:** Endpoints-only turn 1 caused schema interview stall; **enriched turn 1** ( `{items:[...]}` + field keys) fixes it — same pattern as UC3-S2.
- **Turn 2 role:** Does not change validity or use-case satisfaction when turn 1 complete — explicit danger/build lines redundant; promote **1-turn eval variant** for S5.
- **Known failure modes:** none on final artifacts. Dismiss variant varies (`secondary` .1/.2, `primary` .3); detail column breadth varies.
- **Script implications:** Turn 1 must include field keys + `{items:[...]}` envelope (endpoints alone stall). Eval opener = revised turn 1; turn 2 often skipped when turn 1 complete.
- **Stability:** `stable: yes` — 3/3 `saved-clean`, same 1-turn / 1-validate flow, same artifact family.

#### UC3-S6

#### UC3-S6.1 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-off-target
- **Session / spec:** c1af390d-30a0-4a48-805b-725021d08328 / cc3e1e66-7bd1-4e62-ab93-863709719379 · **Chat:** `/chat/c1af390d-30a0-4a48-805b-725021d08328` · **View:** `/specs/cc3e1e66-7bd1-4e62-ab93-863709719379`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** **skipped** — agent one-shotted on turn 1 with no questions about what drafts are, detail fields beyond sample, approve/reject placement, or post-action navigation. **Turn 2 (story + detail fields + save) not sent.**
- **Inventions:** none on endpoints — columns/fields from sample response only; did not add body/ticketSubject/customerMessage (turn 2 fields).
- **Artifact vs target:** **partial** — HITL structure ✓ (2 embedded acts on `read`, POST approve/reject, success→browse, `row` transition, **`valuePath: "items"`**, no CRUD writes). **S6 interview watch-for ✗** — built generic draft reviewer from endpoint names + sample without confirming human meaning. Detail fields = sample keys only (preview/ticketId/model/confidence/status), not turn 2 extras.
- **Feed-forward:** S6 tests contract-without-story discovery — agent inferred HITL correctly but skipped meaning interview. Runs 2–3: send both turns; note if interview appears when sample is less HITL-shaped.

#### UC3-S6.2 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-off-target
- **Session / spec:** f7557758-07a5-4ca4-9533-3daed01c1a73 / 42c05b5d-57f7-452d-b204-5133e2feb70f · **Chat:** `/chat/f7557758-07a5-4ca4-9533-3daed01c1a73` · **View:** `/specs/42c05b5d-57f7-452d-b204-5133e2feb70f`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** **skipped** — repeat of .1; one-shot save on turn 1, no meaning/field/placement questions. **Turn 2 not sent.**
- **Inventions:** none — fields from sample only.
- **Artifact vs target:** **partial** — HITL structure ✓ (embedded approve/reject acts, success→browse, `row`, `valuePath: "items"`, no CRUD). **S6 interview ✗**; no body/ticketSubject/customerMessage. Same artifact family as .1.
- **Feed-forward:** Confirms .1 — endpoint block + sample is enough for agent to one-shot HITL without turn 2. Run .3 must send turn 2 after agent reply to test discovery path.

#### UC3-S6.3 — 2026-08-09
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-off-target
- **Session / spec:** eedd96cc-7e70-4db6-aff1-83b847cce7e6 / 6750b983-4cad-4639-8cad-1aa64e6c50e7 · **Chat:** `/chat/eedd96cc-7e70-4db6-aff1-83b847cce7e6` · **View:** `/specs/6750b983-4cad-4639-8cad-1aa64e6c50e7`
- **Turns / validates / errors:** 1 / 1 / none
- **Interview:** **skipped** — third consecutive one-shot; agent saved in same reply as turn 1, **no pause for turn 2**. User cannot send scripted turn 2 pre-save — agent never asks.
- **Inventions:** none — detail fields from sample only (preview/ticketId/model/confidence/status); no body/ticketSubject/customerMessage.
- **Artifact vs target:** **partial** — HITL structure ✓ (2 embedded acts, success→browse, `row`, `valuePath: "items"`, no CRUD). **S6 meaning-interview watch-for ✗** (3/3). Same artifact family as .1/.2.
- **Feed-forward:** UC3-S6 complete — see findings block below.

#### UC3-S6 findings (3/3 — UC3 exploration complete)

- **Reliable paths to save:** 3/3 reached `save_rui` on **turn 1 only** — 1 validate, 0 errors each. **Scripted turn 2 never reachable** — agent validate→save in same reply; no interview pause.
- **Meaning discovery (S6 intent):** **0/3** — agent never asked what drafts are, detail field needs, approve/reject placement, or post-action navigation before first save. Contract (approve/reject paths + `{items:[...]}` sample) is **self-explanatory for HITL** post-fix.
- **HITL structure:** **3/3** correct despite skipped interview — embedded approve/reject on `read`, success→browse, `row` transition, `valuePath: "items"`, no top-level ops or CRUD mis-wiring.
- **vs UC3-S4 (story, no contract):** S4 **holds until action endpoints** 2/3 (.2/.3); S6 **never holds** when contract is HITL-shaped. Discovery gap is **contract-without-story**, not story-without-contract.
- **Known failure modes:** Not agent failure to build — **scenario design mismatch**: turn 2 cannot be exercised when turn 1 includes HITL-obvious endpoints + sample. Detail fields stay at sample keys; turn 2 extras (body/ticketSubject/customerMessage) never land.
- **Script implications:** S6 2-turn script **not viable as written** for post-fix agent — either accept 1-turn HITL inference as the finding, or thin turn 1 (endpoints only, no sample / no approve in path) if meaning interview must be tested. Eval `ai-review-queue-v0.2` should carry endpoints in prompt; S2/S5 prove envelope+fields pattern.
- **Stability:** `stable: yes` — 3/3 `saved-off-target` (same interview miss), same 1-turn / 1-validate flow, same HITL artifact family.

### UC3 findings (3/3 scenarios complete — confirm with human)

- **Reliable paths to save:** **17/18 runs saved** (S4.1 off-target still saved). Strongest: **S2, S3, S5** (3/3 clean or negotiated). **S1** 2/3 clean (filter needs turn 2). **S4** 2/3 clean on full script. **S6** 3/3 save but off-target on interview.
- **HITL structure:** **Acts embedded on `read` ~18/18** when saved — no row-button builds observed; S3 pushback 3/3 before validate. Success→inbox outcomes reliable. **`valuePath: "items"`** when envelope hinted (S2/S5/S6 ✓; S1 often omitted).
- **Pushback quality (S3):** **3/3 prompt-level** — row-action ask caught before first validate; 1 validate each after user accepts detail flow.
- **Discovery halves (S4 vs S6):** **S4 weaker inconsistently** (.1 premature save + spurious update op); **S6 meaning interview never triggers** when contract is HITL-obvious — turn 2 unreachable. Story-only path (S4) needs action endpoints in turn 3; contract-only path (S6) one-shots.
- **Generalization (S5):** **3/3 clean** — flags/remove/dismiss generalizes; no support-domain residue; danger variant inferred.
- **Script implications for `ai-review-queue-v0.2`:** (1) Carry **endpoints + field keys + `{items:[...]}`** in prompt/script (harness `mockApi` gap). (2) **S2 1-turn variant** strongest eval candidate. (3) **S1** 2-turn with turn 2 filter clarify. (4) **S4** 4-turn script load-bearing. (5) **S6 script needs rethink** or document as 1-turn inference-only. (6) Fold S3 negotiation turn in eval for row-button trap.

---

## S+1 — Post-save iteration

### Run entries

(Log here regardless of which scenario it followed; name the parent run, e.g. "after UC2-S3.1". Use [S+1 workflow](#s1-workflow) — log parent entry **before** sending the S+1 turn.)

#### S+1.1 — 2026-08-09 (after UC2-S1.postfix.3)
- **Platform:** post-fix (prompt v1.1)
- **Result:** saved-clean
- **Session / spec:** 9dee3391-7204-4938-9442-d64ef9c4ebe0 / 31def521-7bc3-4092-a441-999722de37ca (S+1; parent b08ba631-c760-42c0-abdf-f5fb340ff946) · **Chat:** `/chat/9dee3391-7204-4938-9442-d64ef9c4ebe0` · **View:** `/specs/31def521-7bc3-4092-a441-999722de37ca`
- **Turns / validates / errors:** 5 total (3 S+1 user turns) / 2 total (1 S+1 validate) / none
- **Interview:** Turns 3–4 — agent clarified no incidents entity (turn 3) and active column already present (turn 4) before saving on turn 5. No tool calls on clarification turns.
- **Inventions:** none — final artifact is rename-only (`Users Admin` → `Ops Console`).
- **Artifact vs target:** matches S+1 watch-fors — full spec carried forward (4 ops, 5 transitions, embedded delete, scope selector, browse columns unchanged); re-validated before second save; new spec URL explained. Only requested change on final turn applied.
- **Feed-forward:** Verbatim UC1 S+1 script on UC2 parent cost 2 extra clarification turns — adapt domain on future S+1 runs. Rename-only iteration works cleanly once intent is unambiguous.

#### S+1.2 — 2026-08-09 (after UC3-S6.3)
- **Platform:** post-fix (prompt v1.1 + binding placeholder validator)
- **Result:** saved-clean
- **Session / spec:** eedd96cc-7e70-4db6-aff1-83b847cce7e6 / cfc771fc-5c4f-4daa-b19c-d959a0e6e27e (S+1; parent 6750b983-4cad-4639-8cad-1aa64e6c50e7) · **Chat:** `/chat/eedd96cc-7e70-4db6-aff1-83b847cce7e6` · **View:** `/specs/cfc771fc-5c4f-4daa-b19c-d959a0e6e27e`
- **Turns / validates / errors:** 2 total (1 S+1 user turn) / 2 total (1 S+1 validate) / none
- **Interview:** none — one-shot on S+1 turn; validate → save, no clarifications.
- **Inventions:** none — filter uses given `status` field; no extra columns or ops.
- **Artifact vs target:** matches S+1 watch-fors — title `Support Review Queue`; browse `presentation.filter` pending-only on `status`; full HITL carried forward (2 ops, embedded approve/reject with success→browse outcomes, `row` transition, `valuePath: "items"`, same columns/sections). Re-validated before second save; new viewUrl returned. Minor wording: agent said "updated" rather than explicitly "new spec ID" — link is correct.
- **Feed-forward:** Domain-adapted S+1 script (rename + pending filter) worked in 1 turn on UC3 HITL parent — no UC2-style clarification detour. Filter addition did not drop embedded act outcomes.

### S+1 findings (2 runs — confirm with human)

- **Carry-forward:** **2/2** preserved full spec structure — UC2 CRUD (ops, transitions, embedded delete, scope) and UC3 HITL (embedded acts + outcomes) intact after iteration. No dropped transitions or outcomes observed.
- **Re-validate:** **2/2** — second save preceded by `validate_rui` on the S+1 turn.
- **New URL:** **2/2** returned a viewUrl; neither run explicitly explained "new spec ID / not update-in-place" (UC2 used "updated" wording; UC3 same). Links are correct new specs.
- **Scope discipline:** UC2 needed 2 clarification turns when script referenced wrong domain entities; UC3 domain-adapted script applied exactly rename + filter in 1 turn.
- **UC4 / `load_spec` implication:** Agent can iterate on saved HITL specs in-session without structural regression when changes are small; explicit load_spec may still help for cross-session iteration and to avoid "updated" framing confusion.

---

## Cross-run findings (fill last)

- **Static vs API discrimination:** reliable across all 19 scenarios?
- **Knowing when to stop:** once it had enough, did it go validate → save, or keep interviewing?
- **Inventions:** every instance of unrequested paths/fields/envelopes/scope, across all runs.
- **Turn economy:** actual turns-to-save per scenario vs the `maxUserTurns: 4` cap — which promotable scenarios don't fit?
- **Stability:** which scenarios produced the same result and shape across reruns (dashboard `stable: yes`)?

---

## Changes to make

The deliverable. Every item must cite run evidence (`UC2-S3.1`, `UC3-S4.2`, …). **v1.2 re-run findings and updates:** [chat-exploration-findings-v1.2.md](chat-exploration-findings-v1.2.md).

### Prompt v1.2 draft-first — shipped (2026-08-10)

**Tracking:** [chat-agent-v1.2-plan.md](chat-agent-v1.2-plan.md). WS1–WS4 complete (2026-08-11); re-run evidence in [findings v1.2](chat-exploration-findings-v1.2.md); **WS5 eval cases pending** before Phase 7.4 baselines.

- ✅ **Prompt v1.2** — `agent/prompts/v1.2.txt`, `RAPIDUI_AGENT_PROMPT_VERSION=v1.2`
- ✅ **Observe session state** — [plan WS2](chat-agent-v1.2-plan.md#workstream-2--observe-agent-dashboard)
- ✅ **Exploration docs** — scenarios + separate [v1.2 findings doc](chat-exploration-findings-v1.2.md)

Items below marked **superseded by v1.2 plan** remain as v1.1 baseline evidence until WS5 lands.

### Eval case changes (`eval/cases/*.json`)

- Fold endpoints **and** field list into `crud-admin-v0.2` conversationScript turn 2 — phrased as in UC2-S1 scenario turn 2 — evidence: UC2-S1.1 needed fields for forms; eval script omits them today. *(Superseded by v1.2 plan WS5 — pending re-run.)*

### Agent prompt changes (`agent/prompts/v1.txt`)

- ✅ **Shipped v1.1** (`agent/prompts/v1.1.txt`) — shape pointer to `fetch_schema.shapes`, anti-premature-validate, negotiate unsupported vocabulary, never ask user for schema syntax — set `RAPIDUI_AGENT_PROMPT_VERSION=v1.1` and restart agent before post-fix runs.

### Runner / harness changes (`scripts/eval-run.ts`, driver)

- Fold endpoints **and** field list into `crud-admin-v0.2` conversationScript turn 2 — evidence: UC2-S1.1 needed fields for forms; eval script omits them today. *(Superseded by v1.2 plan WS5.)*
- ~~**`maxUserTurns: 3` viable post-fix**~~ — **superseded:** draft-first needs **`maxUserTurns: 5`** (v1.2 plan decision 5). v1.1 evidence: UC2-S1 post-fix 2-turn save; UC3-S4 sits at the old cap of 4.

### Validator changes (`lib/validate/semantic/`)

- ✅ **Shipped** `INVALID_BINDING_PLACEHOLDER` — every `{...}` in API binding paths must be `{paramName}` from `params[]` or `{scope.<selectorId>}` from `entity.scope.selectors`; rejects `{scope.params.userId}` and other invented tokens — evidence: UC2-S4.2 saved-off-target with malformed update `write.path`.

### New eval variants worth scripting

<!-- scenarios that proved stable and distinct enough to promote, with the turn content to script -->

### Product / docs changes

- ✅ **Shipped** enriched `GET /api/schema` (`shapes` + neutral-domain `examples`) and `SCOPE_SELECTOR_MISSING` validator rule — evidence: UC2-S1.1–S1.3 pre-fix.
- ✅ **Shipped** `INVALID_BINDING_PLACEHOLDER` validator rule — evidence: UC2-S4.2 `{scope.params.userId}` off-target pass.
