# Chat exploration findings — v1.2 (draft-first)

**Platform:** `post-fix (prompt v1.2 draft-first)` on every run. Observe `prompt_version` should read `v1.2`.  
**Companion docs:** [scenarios](chat-exploration-scenarios.md) · [v1.1 findings (baseline)](chat-exploration-findings.md) · [implementation plan](chat-agent-v1.2-plan.md)  
**Prerequisite infra:** [chat session persistence](chat-session-persistence-plan.md) — ✅ shipped.

**End goal:** the [Changes to make](#changes-to-make) section at the bottom, backed by v1.2 run evidence. Do **not** merge stability counts with the [v1.1 dashboard](chat-exploration-findings.md#dashboard).

---

## Instructions for the assisting agent

You are helping a human run the v1.2 re-run from `chat-exploration-scenarios.md`. Keep **this document** current — not the v1.1 findings doc.

1. **After each run**, append one run entry under the matching scenario heading and update the [dashboard](#dashboard) row.
2. **Extract, don't invent.** Fill fields only from evidence. Write `?` when unknown — never guess.
3. **Evidence:** [Transcript extraction checklist](#transcript-extraction-checklist). Observe for metrics, transcript for conversation quality, saved spec for artifact correctness.
4. **Keep entries short.** Link `/chat/{sessionId}`; no full transcripts.
5. **Run IDs:** `<scenario>.<n>` — e.g. `D2.2`, `UC3-S6.3`. Riders: `<scenario>r<n>`.
6. **After finishing a use case's runs**, draft its findings block and confirm with the human before moving on.
7. **3 countable runs per scenario.** Stability: `stable: yes` when 2+ of 3 share result + artifact shape.
8. **`error` runs** do not count — rerun until 3 countable results.

**Priority order:** D1–D3 first, then premature-save victims (UC3-S6, UC3-S1, UC1-S1, UC1-S4, UC3-S4, UC1-S3, UC2-S5), then the rest.

**Restart the agent** after prompt changes — uvicorn `--reload` does not watch `prompts/*.txt`.

**Result vocabulary:**

- `saved-clean` — saved on save-intent turn, artifact matches watch-fors
- `saved-off-target` — saved on save-intent turn, artifact deviates
- `saved-negotiated` — saved after redirecting unsupported request (UC3-S3 style)
- `saved-unconfirmed` — saved **before** user save-intent turn (off-target even when artifact is correct)
- `no-save` — no `save_rui` (say where it stalled)
- `error` — infra/tool failure (don't count toward stability)

Save-intent turn per scenario: [save-intent table](chat-exploration-scenarios.md#save-intent-classification-v12).

---

## Dashboard

Update after every run. `Stable` = 2+ of 3 runs with the same result and artifact shape.

| Scenario | Runs | Last result | Stable | Notes |
|---|---|---|---|---|
| D1 | 0 | — | — | escape hatch — run first |
| D2 | 0 | — | — | draft gate |
| D3 | 0 | — | — | iterate-then-save |
| UC1-S1 | 0 | — | — | turn 3 save now required |
| UC1-S2 | 0 | — | — | |
| UC1-S3 | 0 | — | — | |
| UC1-S4 | 0 | — | — | premature-save victim |
| UC1-S5 | 0 | — | — | plan-only turn 1; explicit save turn 4 |
| UC1-S6 | 0 | — | — | |
| UC2-S1 | 0 | — | — | explicit save turn 3–4 |
| UC2-S2 | 0 | — | — | escape hatch |
| UC2-S3 | 0 | — | — | explicit save turn 3 |
| UC2-S4 | 0 | — | — | |
| UC2-S5 | 0 | — | — | dual-save victim |
| UC2-S6 | 0 | — | — | |
| UC3-S1 | 0 | — | — | premature-save victim; explicit save turn 3 |
| UC3-S2 | 0 | — | — | escape hatch |
| UC3-S3 | 0 | — | — | |
| UC3-S4 | 0 | — | — | premature-save victim |
| UC3-S5 | 0 | — | — | explicit save turn 2 |
| UC3-S6 | 0 | — | — | premature-save victim |
| S+1 | 0 | — | n/a | post-save iteration |

---

## Run entry template

```md
#### <scenario>.<n> — <date>
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean | saved-off-target | saved-negotiated | saved-unconfirmed | no-save | error
- **Session / spec:** <sessionId> / <specId or viewUrl> · **Chat:** `/chat/{sessionId}`
- **Observe state:** saved | draft | active | failed | abandoned
- **Save-intent turn:** <n> — per [save-intent table](chat-exploration-scenarios.md#save-intent-classification-v12)
- **Turns / validates / errors:** <user turns> / <validate attempts> / <error codes or none>
- **Draft turn:** turn index + confirm-ask present? (skip for one-shot escape-hatch runs)
- **save_rui audit:** count + first save turn index; zero before save-intent turn?
- **Interview:** what it asked, in order — high-value vs redundant?
- **Inventions:** endpoints, fields, envelopes, scope not given — or "none"
- **Artifact vs target:** deviations from watch-fors — or "matches"
- **Feed-forward:** one line — prompt, case, or script implication
```

---

## Transcript extraction checklist

After each run, pull evidence and fill the run entry. Link `/chat/{sessionId}` — do not paste full transcripts.

### How to fetch evidence

**Preferred:**

```bash
npm run fetch:exploration-evidence -- {sessionId} {runId}
# e.g. npm run fetch:exploration-evidence -- abc-123-def D2.1
```

Prints transcript summary, Observe validate count + error codes, **prompt_version**, **env**, **session state**, save-intent expectation, draft turn index, **save_rui audit** (premature-save detection), and a **v1.2 run-entry skeleton** with mechanical fields pre-filled.

**Manual paths:** see [v1.1 checklist — How to fetch evidence](chat-exploration-findings.md#how-to-fetch-evidence) (same commands).

**Rule:** Observe counts validates and errors; transcript explains *why*; saved spec proves *what* landed.

### Per-run extraction (v1.2)

#### 1. Outcome & IDs

- [ ] `turnCount`, `run.outcome`, `run.specId` from transcript
- [ ] **Observe session state:** `saved` | `draft` | `active` | `failed` | `abandoned`. Intentional bail after green draft (New chat) → expect **`draft`**, not **`abandoned`**
- [ ] **Result:** use `saved-unconfirmed` when save happened before [save-intent turn](chat-exploration-scenarios.md#save-intent-classification-v12)

#### 2. Metrics & save audit

- [ ] Validate count + error codes from Observe (authoritative)
- [ ] **save_rui audit:** count all saves; first save turn vs save-intent turn — any early save → `saved-unconfirmed`; successful runs → exactly **one** save (S+1 excepted)
- [ ] **Draft turn:** assistant turn after first passing validate — summary + panel note + single confirm ask? (skip for escape-hatch one-shots)

#### 3. Interview, inventions, artifact

Same as [v1.1 checklist §3–5](chat-exploration-findings.md#3-interview--interview). Walk scenario **Watch for** bullets in `chat-exploration-scenarios.md`.

#### 4. Synthesis → Feed-forward

One line tying the run to action; cite the specific finding.

### Scenario-specific signals (v1.2)

| Scenario | Also check |
|---|---|
| UC1-S5 | Turn 1 plan-only — no `validate_rui`, no draft JSON, no save |
| D2, D3 | No save on turn 1; draft turn has summary + confirm ask |
| D3 | Turn 2 change → re-draft, no save; one save on turn 3; carry-forward intact |
| UC1-S4 | Semantics questions (`sev`, `assignee`, timestamps) before draft |
| UC2-S1, UC3-S1 | `valuePath` asked or present when envelope not given |
| UC3-S4 | No complete draft/save until approve/reject endpoints known |
| UC3-S6 | No save on turn 1; save intent turn 2 only |
| S+1 | Change without save phrasing → re-draft + confirm, not save |

### S+1 workflow

1. Log the **parent** run first (before sending S+1 turn).
2. Send S+1 turn; log separately (`S+1.n`, note parent).
3. Parent spec = first `save_rui`; S+1 spec = last `save_rui`.
4. Dashboard stability for S+1 is **`n/a`**.

Full mechanics: [v1.1 S+1 workflow](chat-exploration-findings.md#s1-workflow).

---

## D-series — Draft workflow isolation

### D1 — Power-user explicit save

#### D1 run entries

(Log D1.1–D1.3 here.)

### D2 — Complete contract, no save word

#### D2 run entries

(Log D2.1–D2.3 here.)

### D3 — Draft iteration

#### D3 run entries

(Log D3.1–D3.3 here.)

---

## UC1 — Static browse

### Run entries

(Log UC1-S1 through UC1-S6 here.)

---

## UC2 — CRUD admin

### Run entries

(Log UC2-S1 through UC2-S6 here.)

---

## UC3 — AI review queue

### Run entries

(Log UC3-S1 through UC3-S6 here.)

---

## S+1 — Post-save iteration

### Run entries

(Log S+1 runs here; note parent scenario.)

---

## Cross-run findings (fill last)

- **Save gate:** zero `save_rui` before save-intent turn? Any `saved-unconfirmed`?
- **Escape hatch:** D1, UC2-S2, UC3-S2, UC3-S5 still one-shot?
- **Draft shape:** summary + panel note + single confirm ask?
- **Iteration carry-forward:** D3 and S+1 preserve outcomes/transitions?
- **Rules 4–6:** valuePath (UC2-S1/UC3-S1); messy-data semantics (UC1-S4); HITL hold (UC3-S4)?
- **Dual-saves:** UC1-S3, UC2-S5 → single save at confirm?
- **Funnel:** D2/D3 no-save bails → Observe **`draft`** (not **`abandoned`**)?
- **Turn economy:** +1 turn vs [v1.1 baselines](chat-exploration-findings.md#dashboard) for draft flows, not +2/+3?
- **Stability:** which scenarios are `stable: yes` on the dashboard?

---

## Changes to make

The deliverable. Every item must cite v1.2 run evidence (`D2.1`, `UC3-S6.2`, …).

### Pending (fill after WS4 re-run)

- **Prompt v1.2:** draft gate, escape hatch, plan-only, valuePath / messy-data / HITL-hold — confirm or revise from run evidence.
- **Eval cases (WS5):** contracts in-band, explicit-save confirm turns, `maxUserTurns: 5`.
- **7.5 blockers:** UC3-S4 clarification variant + UC3-S3 negotiation variant.

### Already shipped (WS1–WS3)

- ✅ Prompt v1.2 — `agent/prompts/v1.2.txt`
- ✅ Observe session state + Draft funnel — [plan WS2](chat-agent-v1.2-plan.md#workstream-2--observe-agent-dashboard)
- ✅ Exploration docs — scenarios + this findings doc

### Superseded v1.1 guidance

See [v1.1 Changes to make](chat-exploration-findings.md#changes-to-make) for baseline evidence. v1.1 items marked superseded there remain valid as historical context until WS5 lands.
