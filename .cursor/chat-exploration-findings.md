# Chat exploration findings — run log & report

**Companion to:** `.cursor/chat-exploration-scenarios.md` (the scenario scripts live there; this doc holds what happened).  
**Prerequisite infra:** [`.cursor/chat-session-persistence-plan.md`](chat-session-persistence-plan.md) — ✅ shipped (2026-08-08). Bulk scenario runs can proceed.
**End goal:** the [Changes to make](#changes-to-make) section at the bottom, backed by run evidence. Everything above it exists to feed it.

---

## Instructions for the assisting agent

You are helping a human who is running the scenarios from `chat-exploration-scenarios.md` in a browser beside you. Your job is to keep this document current. Rules:

1. **After each run**, append one run entry (template below) under the matching scenario heading, and update the dashboard row.
2. **Extract, don't invent.** Fill fields only from what the human pastes or what you can read from evidence. If you don't know a value, write `?` — never a plausible guess.
3. **Where evidence lives:**
   - **Full conversation (restore):** `/chat/{sessionId}` — same UI as the live run
   - **Transcript API:** `GET /api/chat/sessions/{sessionId}/transcript` (for agents/scripts)
   - **Validate attempts, tool calls, errors:** `/observe/agent/sessions/{sessionId}`
   - **The saved artifact:** the `viewUrl` the agent returns (`/specs/{id}`)
4. **Keep entries short.** Quote the agent verbatim only when the exact wording is the finding (a great clarifying question, a bad invention). No full transcripts in this doc — link `/chat/{sessionId}` or the transcript API instead.
5. **Run IDs:** `<scenario>.<n>`, e.g. `UC1-S1.2` is the second run of UC1-S1.
6. **After finishing a use case's runs**, draft its findings block (below the run entries) and ask the human to confirm before moving on.
7. **Stability rule of thumb:** a scenario needs 2 runs with the same result before its dashboard row gets a `stable: yes`.

**Result vocabulary** (one per run):

- `saved-clean` — saved, artifact matches the scenario's watch-fors
- `saved-off-target` — saved, but artifact deviates from watch-fors (say how)
- `saved-negotiated` — saved after the agent redirected an unsupported request (UC3-S3 style)
- `no-save` — conversation ended without `save_rui` (say where it stalled)
- `error` — infra/tool failure, not a model result (don't count toward stability)

---

## Dashboard

Update after every run. `Stable` = 2+ runs with the same result.

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
| S+1 | 0 | — | — | note which scenario it followed |

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

(Log here regardless of which scenario it followed; name the parent run, e.g. "after UC2-S3.1".)

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
