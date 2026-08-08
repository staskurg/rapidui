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

**Post-fix runs (platform cutover 2026-08-08):** After enriching `GET /api/schema` (`shapes` + neutral-domain `examples`) and shipping prompt **v1.1**, UC2-S1 is rerun as a **fresh acceptance gate**. Pre-fix entries (prompt v1, sparse schema) stay as baseline evidence — do not merge into post-fix stability counts. Log post-fix runs with **`Platform: post-fix (prompt v1.1)`** in the run entry (Observe `prompt_version` should read `v1.1`). **Restart the agent** after changing the prompt — uvicorn `--reload` does not watch `prompts/*.txt`.

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
| UC2-S1 | 3 | saved-off-target | no | **pre-fix** 3/3; post-fix rerun pending (v1.1) |
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

<!-- UC2-S1.postfix.1 — date -->

#### UC2-S2

#### UC2-S3

#### UC2-S4

#### UC2-S5

#### UC2-S6

### UC2 findings (fill after runs)

*(UC2-S1 complete — see [UC2-S1 findings](#uc2-s1-findings-33-runs--confirm-before-uc2-s2) above. Remaining scenarios TBD.)*

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

- Fold endpoints **and** field list into `crud-admin-v0.2` conversationScript turn 2 — phrased as in UC2-S1 scenario turn 2 — evidence: UC2-S1.1 needed fields for forms; eval script omits them today.

### Agent prompt changes (`agent/prompts/v1.txt`)

- ✅ **Shipped v1.1** (`agent/prompts/v1.1.txt`) — shape pointer to `fetch_schema.shapes`, anti-premature-validate, negotiate unsupported vocabulary, never ask user for schema syntax — set `RAPIDUI_AGENT_PROMPT_VERSION=v1.1` and restart agent before post-fix runs.

### Runner / harness changes (`scripts/eval-run.ts`, driver)

- Fold endpoints **and** field list into `crud-admin-v0.2` conversationScript turn 2 — pending post-fix UC2-S1 gate; re-evaluate `maxUserTurns` after post-fix runs.

### New eval variants worth scripting

<!-- scenarios that proved stable and distinct enough to promote, with the turn content to script -->

### Product / docs changes

- ✅ **Shipped** enriched `GET /api/schema` (`shapes` + neutral-domain `examples`) and `SCOPE_SELECTOR_MISSING` validator rule — evidence: UC2-S1.1–S1.3 pre-fix.
- Post-fix: rerun UC2-S1 × 3 on 3-turn script; log under [UC2-S1 post-fix run entries](#uc2-s1-post-fix-run-entries).
