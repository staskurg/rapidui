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
| D1 | 3 | saved-clean | yes | 2/3 one-shot; artifact stable |
| D2 | 3 | saved-clean | yes | 3/3 canonical draft gate |
| D3 | 3 | saved-clean | yes | 3/3 iterate-then-save ✓ |
| UC1-S1 | 3 | saved-clean | yes | 3/3 saved-clean; stable 3-turn draft→confirm |
| UC1-S2 | 3 | saved-clean | yes | 3/3 saved-clean; stable 2-turn draft→confirm |
| UC1-S3 | 3 | saved-clean | no | .1 clean · .2 off-target · .3 clean (after infra fix) |
| UC1-S4 | 3 | saved-off-target | yes | 0/3 clean; rule 5 unstable |
| UC1-S5 | 3 | saved-clean | yes | 3/3 saved-clean; plan-only + scope fork stable |
| UC1-S6 | 3 | saved-clean | yes | 3/3 saved-clean; static boundary stable |
| UC2-S1 | 3 | saved-clean | yes | 3/3 saved-clean; canonical CRUD admin stable |
| UC2-S2 | 3 | saved-clean | yes | 3/3 saved-clean; 1- vs 2-turn flow variance |
| UC2-S3 | 3 | saved-clean | yes | 3/3 saved-clean; 3-turn canonical ( .1 was 4-turn) |
| UC2-S4 | 3 | saved-clean | yes | 3/3 saved-clean; valuePath inference stable |
| UC2-S5 | 3 | saved-clean | yes | 3/3 saved-clean; dual-save fixed |
| UC2-S6 | 3 | saved-clean | yes | 3/3 clean; .3 save retry after tool error |
| UC3-S1 | 3 | saved-clean | yes | 3/3 saved-clean; premature-save fixed |
| UC3-S2 | 3 | saved-clean | yes | 3/3 clean; escape hatch 2/3 one-shot |
| UC3-S3 | 3 | saved-negotiated | yes | 3/3 pushback ✓; no row acts built |
| UC3-S4 | 3 | saved-clean | yes | 3/3 clean; HITL hold ✓; valuePath detour all runs |
| UC3-S5 | 3 | saved-clean | yes | 3/3 clean; pattern generalizes |
| UC3-S6 | 3 | saved-clean | yes | save gate 3/3 ✓; draft gate 2/3 violated |
| S+1 | 1 | saved-clean | n/a | parent D3.3; carry-forward ✓ |

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

#### D1.1 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 1856d307-bd90-4152-b236-c6b7835aa00c / 1f44aea1-c4ad-48b4-9613-07020f603748 · **Chat:** `/chat/1856d307-bd90-4152-b236-c6b7835aa00c`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "Validate and save when it passes" (escape hatch)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — validate + "Ready to save?" confirm ask despite escape-hatch opener (partial draft detour; mirrors UC2-S2.2)
- **save_rui audit:** 1 total; first save on user turn 2 after "yep, go" ✓
- **Interview:** none — complete UC2-S2 opener; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; entity scope selector (companies); delete-on-read with confirm; `valuePath: items` ✓
- **Feed-forward:** v1.2 draft-first can defer escape hatch even on D1; track 1- vs 2-turn variance across D1.2/.3

#### D1.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 5a5b1b6a-5451-45c0-9dc6-692a89960d93 / e0a2b733-41c0-4c74-8fe3-e0224e4226bd · **Chat:** `/chat/5a5b1b6a-5451-45c0-9dc6-692a89960d93`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "Validate and save when it passes" (true one-shot)
- **Turns / validates / errors:** 1 / 2 / INVALID_PROP_TYPE (recovered)
- **Draft turn:** n/a — validate+save same turn; no confirm detour ✓
- **save_rui audit:** 1 total; first save on user turn 1 ✓
- **Interview:** none — complete UC2-S2 opener; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; company scope selector; delete-on-read with confirm; `valuePath: items`; minor: `notes` omitted from browse columns
- **Feed-forward:** escape hatch honored; repeats UC2-S2.1/.3 one-shot path

#### D1.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 8a56700a-70a9-428c-a7e5-8c1cf941b32c / dd704c7a-0515-40a2-8ba4-1a3f7736c91f · **Chat:** `/chat/8a56700a-70a9-428c-a7e5-8c1cf941b32c`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "Validate and save when it passes" (true one-shot)
- **Turns / validates / errors:** 1 / 2 / INVALID_PROP_TYPE (recovered)
- **Draft turn:** n/a — validate+save same turn; no confirm detour ✓
- **save_rui audit:** 1 total; first save on user turn 1 ✓
- **Interview:** none — complete UC2-S2 opener; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; company scope selector; delete-on-read with confirm; `valuePath: items`; minor: `notes` omitted from browse columns
- **Feed-forward:** repeats .2 one-shot path

### D1 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes** (artifact shape)
- **Escape hatch:** honored on .2/.3 (1-turn validate+save); deferred on .1 (validate → "yep, go" → save) — **flow unstable** on identical opener (mirrors UC2-S2)
- **Interview:** no redundant re-asks all runs ✓
- **Artifact:** browse/read/create/update/delete-on-read; companies scope; `{scope.companyId}`; `valuePath: items` — consistent with UC2-S2
- **Validate noise:** .2/.3 `INVALID_PROP_TYPE` retry — not a stability concern
- **Promote to eval:** D1 = UC2-S2 opener verbatim; grader same as UC2-S1; expect 1- or 2-turn escape-hatch variance

### D2 — Complete contract, no save word

#### D2 run entries

#### D2.1 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 9559fb96-9f57-49b8-8c40-0d1f564279d5 / 23bb1c68-c4a6-4aef-9626-e8dd8b5e080f · **Chat:** `/chat/9559fb96-9f57-49b8-8c40-0d1f564279d5`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 1 — HITL summary + confirm ask ✓; no save on turn 1 ✓
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — complete contract on turn 1; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; company scope selector; delete-on-read with confirm; `valuePath: items`; minor: `notes` omitted from browse columns
- **Feed-forward:** canonical D2 draft-first gate; baseline for D3 iteration runs

#### D2.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 61ad7c01-6876-4539-91fb-ff45dfef117f / da60dba7-7ab5-464c-a76f-109a7b647ecc · **Chat:** `/chat/61ad7c01-6876-4539-91fb-ff45dfef117f`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 2 / 2 / INVALID_PROP_TYPE (recovered)
- **Draft turn:** after user turn 1 — summary + Spec panel note + confirm ask ✓; no save on turn 1 ✓
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — complete contract on turn 1; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; company scope selector; delete-on-read with confirm; `valuePath: items`; minor: `notes` omitted from browse columns
- **Feed-forward:** repeats .1 canonical draft→confirm path

#### D2.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** d83b8674-5fe9-4708-9208-525cb9230417 / 69a0721e-8315-4b70-bb86-debde5248305 · **Chat:** `/chat/d83b8674-5fe9-4708-9208-525cb9230417`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 1 — summary + confirm ask ✓; no save on turn 1 ✓
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — complete contract on turn 1; no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches UC2-S2 — full CRUD; company scope selector; delete-on-read with confirm; `valuePath: items`; minor: `notes` omitted from browse columns
- **Feed-forward:** repeats .1/.2; cleanest validate path (1 pass)

### D2 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Draft gate:** all runs — validate + summary + confirm ask on turn 1; no `save_rui` until turn 2 ✓
- **Interview:** no redundant re-asks all runs ✓
- **Artifact:** browse/read/create/update/delete-on-read; companies scope; `{scope.companyId}`; `valuePath: items` — consistent with UC2-S2/D1
- **Validate noise:** .2 `INVALID_PROP_TYPE` retry only
- **Promote to eval:** D2 script = UC2-S2 minus save sentence + turn-2 confirm; grader asserts draft-before-save funnel

### D3 — Draft iteration

#### D3 run entries

#### D3.1 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 4b3e915b-d161-4ed6-9c89-7c3d45e249e8 / a1ff1e0c-5ef1-4d27-8e78-c7e5fa64864f · **Chat:** `/chat/4b3e915b-d161-4ed6-9c89-7c3d45e249e8`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 3 / 3 / INVALID_PROP_TYPE (recovered on turn 2 re-draft)
- **Draft turn:** turn 1 initial draft + confirm ask; turn 2 re-validate after change + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; no save on turns 1–2 ✓
- **Interview:** none — complete contract turn 1; turn 2 change-only (no save phrasing) ✓
- **Inventions:** none — "status badge" mapped to `active` badge (no status field in contract)
- **Artifact vs target:** notes absent from browse (and forms); `active` column `format: badge`; scope/transitions/delete outcomes carried forward ✓
- **Feed-forward:** iteration loop works; turn 2 removed notes beyond browse column — acceptable overreach

#### D3.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 4ce64a3c-4216-4c61-b186-d8460a4266be / b4c9b43e-c406-45f0-9bd1-a52703250352 · **Chat:** `/chat/4ce64a3c-4216-4c61-b186-d8460a4266be`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 3 / 2 / none
- **Draft turn:** turn 1 initial draft + confirm ask; turn 2 re-validate after change + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; no save on turns 1–2 ✓
- **Interview:** none — complete contract turn 1; turn 2 change-only ✓
- **Inventions:** none — "status badge" → `active` badge; prose labels Active as "Status"
- **Artifact vs target:** notes absent from browse/detail/forms; `active` column `format: badge`; scope/transitions/delete outcomes carried forward ✓
- **Feed-forward:** repeats .1 loop; minor extra: `role` also badge in browse (unrequested)

#### D3.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 22d0e68c-4d92-4d9c-878c-f3764efc4164 / 8ea83f60-e5a7-409a-83a7-2d966df8b58e · **Chat:** `/chat/22d0e68c-4d92-4d9c-878c-f3764efc4164`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it." (matches scenario script)
- **Turns / validates / errors:** 3 / 2 / none
- **Draft turn:** turn 1 initial draft + confirm ask; turn 2 re-validate after change + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; no save on turns 1–2 ✓
- **Interview:** none — complete contract turn 1; turn 2 change-only ✓
- **Inventions:** none — "status badge" → `active` badge (column label "Status" in prose)
- **Artifact vs target:** notes absent from browse/detail/forms; `active` column `format: badge`; scope/transitions/delete outcomes carried forward ✓
- **Feed-forward:** repeats .1/.2; cleanest validate path (2 total, no errors)

### D3 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Iteration loop:** all runs — draft turn 1; turn 2 re-validate after change (no save); single `save_rui` on turn 3 ✓
- **Carry-forward:** scope selector, transitions, delete outcomes intact across iteration in all runs ✓
- **Change application:** notes removed; `active` badge applied (mapped from "status badge" — no status field in contract)
- **Overreach:** all runs removed notes from forms/detail when only browse column requested — consistent, acceptable
- **Promote to eval:** D3 script = D2 opener + turn-2 column tweak + turn-3 save; grader asserts notes absent + badge column + single save

---

## UC1 — Static browse

### Run entries

#### UC1-S1.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 3ef6899b-03f3-4203-bf15-1d135fdb878d / fd8cab9d-7190-4335-b784-8812b95ce5a0 · **Chat:** `/chat/3ef6899b-03f3-4203-bf15-1d135fdb878d`
- **Observe state:** saved
- **Save-intent turn:** 3 — "yep, that works. save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after JSON paste) — summary of screens/columns/data mode + panel note ("Everything validated cleanly") + single confirm ask ("Should I save this spec?") ✓
- **save_rui audit:** 1 total; first save on user turn 3; zero before save-intent turn ✓
- **Interview:** turn 1 asked API path, response envelope, and column fields (API-leaning plan text, but no draft yet); turn 2 JSON paste switched it to static — no redundant re-ask
- **Inventions:** none — no endpoints; records verbatim from paste
- **Artifact vs target:** matches — `data.mode: static`, 3 records embedded, `/incidents` route, columns id/title/severity/status/owner with badge formats on severity/status
- **Feed-forward:** canonical 3-turn draft→confirm shape; eval case needs explicit save turn 3 (not "build it")

#### UC1-S1.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 8159d832-3d49-4da2-9f24-4f244ee1955a / cad0f363-058f-4035-8a2a-f1f516c1e18d · **Chat:** `/chat/8159d832-3d49-4da2-9f24-4f244ee1955a`
- **Observe state:** saved
- **Save-intent turn:** 3 — "yep, that works. save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after JSON paste) — summary of entity/route/columns/data + single confirm ask ("any tweaks, or should I save this spec?") ✓
- **save_rui audit:** 1 total; first save on user turn 3; zero before save-intent turn ✓
- **Interview:** turn 1 asked API vs static embed and column fields — neutral, no draft; turn 2 paste answered both
- **Inventions:** none
- **Artifact vs target:** matches — static mode, 3 records verbatim, `/incidents`; status column `string` vs severity `badge` (minor format choice, not functional)
- **Feed-forward:** same stable shape as UC1-S1.1; 2/2 clean on gate + artifact

#### UC1-S1.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 1d1ccd5c-6ddc-456c-8e87-4b0643537b6e / 87cc82d8-cb9e-4f33-a553-54107139bef2 · **Chat:** `/chat/1d1ccd5c-6ddc-456c-8e87-4b0643537b6e`
- **Observe state:** saved
- **Save-intent turn:** 3 — "yep, that works. save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 — summary (columns, nav entrypoint, no extra screens) + single confirm ask ("Is this good to save?") ✓; panel implied via validate
- **save_rui audit:** 1 total; first save on user turn 3; zero before save-intent turn ✓
- **Interview:** turn 1 API vs static stub + column fields; turn 2 paste — no redundant re-ask
- **Inventions:** none
- **Artifact vs target:** matches — static, 3 records verbatim, `/incidents`, badge on severity/status (identical hash to UC1-S1.1)
- **Feed-forward:** **stable 3/3** — promote 3-turn script with explicit save on turn 3 to eval

### UC1-S1 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Save gate:** held all runs — draft on turn 2, save only on turn 3
- **Draft shape:** summary + single confirm ask every run (minor wording variance only)
- **Interview:** turn 1 consistently asks data source (API vs static) + columns; no inventing, no premature validate
- **Artifact:** static browse, verbatim records, `/incidents` — consistent across runs
- **Promote to eval:** 3-turn `conversationScript` with turn 3 `"yep, that works. save it."`

#### UC1-S2.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** dd2f66c5-2896-4f31-9f44-415af0663c93 / 0734270a-dc80-4103-bf9d-569df59a9e50 · **Chat:** `/chat/dd2f66c5-2896-4f31-9f44-415af0663c93`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks right, go ahead and save."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 (CSV complete in opener) — summary of entity/route/columns/data + single confirm ask ("shall I save it?") ✓
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓
- **Interview:** none — full CSV in turn 1, no redundant questions
- **Inventions:** none
- **Artifact vs target:** matches — CSV parsed to team/lead/headcount/region; headcount as number; 3 rows; `/teams`; static mode; no phantom fields
- **Feed-forward:** 2-turn draft→confirm when data is complete upfront; turn 2 must use explicit save phrasing

#### UC1-S2.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 6ebf48ad-fe6d-4997-8324-e04e56cb7dc3 / 038538e0-f78d-4fee-a952-5a909da22a5d · **Chat:** `/chat/6ebf48ad-fe6d-4997-8324-e04e56cb7dc3`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks right, go ahead and save."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — concise summary (Teams page, 4 columns, static) + single confirm ask ("shall I save this spec?") ✓
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓
- **Interview:** none — CSV complete in opener
- **Inventions:** none
- **Artifact vs target:** matches — same shape as UC1-S2.1 (`/teams`, 3 rows, headcount numeric, team/lead/region columns)
- **Feed-forward:** 2/2 same 2-turn flow; one more run for stability

#### UC1-S2.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 5248f091-00ea-4275-a80e-413edd6b280d / edb502ef-e45f-4e4f-813d-4a0607ad2deb · **Chat:** `/chat/5248f091-00ea-4275-a80e-413edd6b280d`
- **Observe state:** saved
- **Save-intent turn:** 2 — "looks right, go ahead and save."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — summary (app title, `/teams`, 4 columns, 3 static records) + validation note + single confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓
- **Interview:** none — CSV complete in opener
- **Inventions:** none
- **Artifact vs target:** matches — `/teams`, 3 rows, headcount numeric, all four CSV columns
- **Feed-forward:** **stable 3/3** — promote 2-turn CSV script with explicit save on turn 2

### UC1-S2 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Save gate:** draft on turn 1, save only on turn 2 every run
- **Draft shape:** summary + single confirm ask (wording varies slightly)
- **Interview:** skipped appropriately — full CSV in opener
- **Artifact:** static browse, CSV parsed correctly, headcount as number — consistent `/teams` shape
- **Promote to eval:** 2-turn script — opener with CSV block, turn 2 `"looks right, go ahead and save."`

#### UC1-S3.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** e647db08-cbc0-451c-aa7e-a6733e7ca5e3 / e30db846-51a5-4cec-9738-032b8f2f1139 · **Chat:** `/chat/e647db08-cbc0-451c-aa7e-a6733e7ca5e3`
- **Observe state:** saved
- **Save-intent turn:** 2 — "…then save it."
- **Turns / validates / errors:** 2 / 2 / none
- **Draft turn:** turn 1 — two-screen summary (Incidents + Teams, static tables) + single confirm ask ✓; turn 2 change+save → re-validate + save without second draft (save phrasing in same turn)
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓ (v1.1 dual-save fixed)
- **Interview:** none on turn 1 — invented 3 rows each as requested
- **Inventions:** believable mock data (INC-001…, team names); no API endpoints
- **Artifact vs target:** matches structurally — both `/incidents` and `/teams`; `presentation.header.metrics[]` on incidents (Open + Resolved Today); open count=1 matches one `Open` row; resolved-today=1 is static/invented (Resolved row dated 2026-08-09, not today — minor semantic slack)
- **Feed-forward:** late requirement on turn 2 with explicit save → single final save; eval script turn 2 should bundle metrics ask + save phrasing

#### UC1-S3.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-off-target
- **Session / spec:** 168c9cf8-01a5-4cb1-bcf8-076728a31efc / 786b49cc-7044-469d-a40d-325c9585de36 · **Chat:** `/chat/168c9cf8-01a5-4cb1-bcf8-076728a31efc`
- **Observe state:** saved
- **Save-intent turn:** 2 — "…then save it."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** **missing** — turn 1 prose plan only ("shall I draft?"); turn 2 validate+save with no draft/confirm pass (differs from UC1-S3.1)
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓
- **Interview:** turn 1 plan-only ask before compose — acceptable pre-draft, but skipped validated draft presentation
- **Inventions:** believable mock incidents/teams; no endpoints
- **Artifact vs target:** deviates — both routes present, metrics in `header.metrics[]` ✓; **open=5 vs 2 open rows** (INC-1, INC-3); **resolvedToday=2 vs 1 resolved row** (INC-2)
- **Feed-forward:** prompt nudge — derive header metric values from static records; prefer turn-1 validate+draft like UC1-S3.1 before turn-2 change+save

#### UC1-S3.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** error
- **Session / spec:** defbba8a-152d-46c4-b7a7-28d9822af9ae / — · **Chat:** `/chat/defbba8a-152d-46c4-b7a7-28d9822af9ae`
- **Observe state:** draft (turn 1 validate passed; no save)
- **Save-intent turn:** 2 — never reached (POST /chat 422 on turn 2)
- **Turns / validates / errors:** 1 / 2 / infra — turn 2 `422 Unprocessable Entity`
- **Draft turn:** turn 1 draft present ✓; turn 2 blocked before agent reply
- **save_rui audit:** 0 saves
- **Interview:** turn 1 invented data + draft; blocked on turn 2
- **Inventions:** n/a — run did not complete
- **Artifact vs target:** n/a — no save; panel showed pre-metrics draft
- **Feed-forward:** **infra bug** — first `validate_rui` failed (corrupt streamed JSON); failed tool part persisted with `rawInput` not `input`; turn-2 POST /chat rejected by pydantic_ai (`extra_forbidden`). Fix: `normalizeWireMessages` before agent POST. **Does not count** — rerun UC1-S3.3 on New chat after fix.

#### UC1-S3.3 — 2026-08-10 (retry, countable)
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** b05efbda-6b9d-4262-96ef-ea75854b215c / b05e9561-fba7-4b7b-ba68-fb0472ffdabb · **Chat:** `/chat/b05efbda-6b9d-4262-96ef-ea75854b215c`
- **Observe state:** saved
- **Save-intent turn:** 2 — "…then save it."
- **Turns / validates / errors:** 2 / 2 / none
- **Draft turn:** turn 1 — two-screen summary + confirm ask ✓; turn 2 metrics+save → re-validate + save (no second draft; save phrasing present)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — invented 3 rows each on turn 1
- **Inventions:** believable mock incidents/teams; no endpoints
- **Artifact vs target:** matches — both routes; `header.metrics[]` with Open=1 (one Open row), Resolved today=1 (one Resolved row)
- **Feed-forward:** post-fix turn 2 works; metric derivation improved vs UC1-S3.2

### UC1-S3 findings (3 countable + 1 error)

- **Result:** 2/3 `saved-clean`, 1/3 `saved-off-target`; **stable: no** (metric consistency varies)
- **Save gate:** single save on turn 2 all countable runs ✓ (v1.1 dual-save fixed)
- **Draft shape:** turn 1 draft+confirm in .1/.3; .2 skipped draft (plan-only turn 1)
- **Watch-for:** header metrics path correct; values sometimes invented (.2) vs derived (.1/.3 slack / .3 clean)
- **Infra:** failed validate retry + `rawInput` caused 422 on turn 2 — fixed via `normalizeWireMessages`
- **Promote to eval:** 2-turn script with metrics+save on turn 2; grader could check metric/record consistency

#### UC1-S4.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-off-target
- **Session / spec:** 5b83a36a-326a-42e9-923d-45be43ce59b3 / 4c769ced-37f5-47ba-8001-20402d348631 · **Chat:** `/chat/5b83a36a-326a-42e9-923d-45be43ce59b3`
- **Observe state:** saved
- **Save-intent turn:** 3 — "good, save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after user delegated column choices) — summary + confirm ask ✓; validate on turn 2, save on turn 3 only ✓
- **save_rui audit:** 1 total; first save on user turn 3; zero before save-intent turn ✓ (v1.1 premature-save fixed)
- **Interview:** turn 1 asked domain, column list, timestamp format, tags — **did not ask `sev` ordering**; user turn 2 "make the best decisions, no tags" (delegated, not scenario semantics answers)
- **Inventions:** none — static mode; `ttl`→title, `sev`→severity; assignee flattened to name; tags dropped
- **Artifact vs target:** deviates — `createdAt` column format `date` but records still hold **epoch integers** (1754324991…); raw numeric severity kept without ordering semantics; assignee flatten ✓; no tags ✓
- **Feed-forward:** v1.2 rule 5 not fully landed — prompt should require `sev` ordering question before draft; consider normalizing epoch→ISO in static records when column is date

#### UC1-S4.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-off-target
- **Session / spec:** 8e7aad31-db5c-481b-8b42-30ee9198c056 / f9c4ec45-a6ae-4f2f-adeb-461b3ab4da2b · **Chat:** `/chat/8e7aad31-db5c-481b-8b42-30ee9198c056`
- **Observe state:** saved
- **Save-intent turn:** 2 — "good, save it."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 (immediate after paste) — summary + confirm ask ✓; **no interview turn**
- **save_rui audit:** 1 total; first save on user turn 2; zero before save-intent turn ✓
- **Interview:** **none** — skipped semantics entirely (no `sev`, assignee, timestamp questions)
- **Inventions:** none — static mode
- **Artifact vs target:** deviates badly — cryptic keys kept (`ttl`, `sev`, `created_ts`); assignee **not flattened** (nested object in records); **tags included**; epoch timestamps raw; prose claimed human labels but spec didn't transform
- **Feed-forward:** regression vs UC1-S4.1 — rule 5 + column judgment both missed; 2-turn path only works if semantics handled in draft (they weren't)

#### UC1-S4.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-off-target
- **Session / spec:** 47580d3b-ae6f-4633-bb1d-8d25afadd824 / cd8fe864-9b50-4d97-a0a2-f6052bbcc579 · **Chat:** `/chat/47580d3b-ae6f-4633-bb1d-8d25afadd824`
- **Observe state:** saved
- **Save-intent turn:** 2 — "please save it" (bundled with delegated answer)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** **missing** — turn 2 validate+save; escape hatch (explicit save in user turn 2); no confirm ask
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** one question only — epoch dates human-readable or raw; **no `sev` ordering**, no assignee question (agent inferred `assigneeName` flatten)
- **Inventions:** none — static; tags/resolved dropped from output
- **Artifact vs target:** deviates — keys still `ttl`/`sev`/`created_ts` in records; epochs not converted despite date column; assigneeName flatten ✓; user-supplied semantics minimal ("best decision") didn't improve dates/keys
- **Feed-forward:** volunteering full semantics on turn 2 still didn't produce clean artifact when agent skips interview — prompt rule 5 needs stronger enforcement

### UC1-S4 findings (3/3)

- **Result:** 0/3 `saved-clean`; **3/3 `saved-off-target`; stable: yes** (consistently weak messy-data handling)
- **Save gate:** no premature save before user save-intent turn ✓ (v1.1 victim fixed)
- **Rule 5 (messy-data):** failed all runs — `sev` ordering never asked; timestamp handling inconsistent; assignee flatten 1/3
- **Flow variance:** .1 3-turn draft; .2/.3 2-turn (skip or minimal interview); .3 escape hatch skipped draft confirm
- **Scenario script gap:** turn-2 example answers don't match agent questions — document needs load-bearing semantics script
- **Promote to eval / prompt:** require `sev`/assignee/date questions before validate; grader checks key renaming + flattened assignee + no raw epochs

#### UC1-S5.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 56777eb0-3671-455f-b1b7-f0cd4037da99 / 397658bb-75f4-4fa4-afb0-0c1d21669d30 · **Chat:** `/chat/56777eb0-3671-455f-b1b7-f0cd4037da99`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it."
- **Turns / validates / errors:** 4 / 2 / INVALID_PROP_TYPE (recovered on retry)
- **Draft turn:** turn 3 (after "keep" re scope) — two-screen summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4; zero before save-intent turn ✓
- **Plan-only restraint:** turns 1–2 prose plan only — **no `validate_rui` on turn 1** ✓; scope expanded on turn 2 without validate
- **Interview:** detail-view question on turns 1–2; user turn 3 "keep" (list-only)
- **Inventions:** 3 believable invented teams; incidents verbatim from paste
- **Artifact vs target:** matches — `/incidents` + `/teams`, two entrypoints, no transitions/linking; static data
- **Feed-forward:** canonical 4-turn UC1-S5 shape for eval; plan-only mode landed

#### UC1-S5.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 9e41593d-32b2-4400-98e5-84ae41a2d1c1 / ff008c10-cc31-44b2-ad4b-2cc9736adddd · **Chat:** `/chat/9e41593d-32b2-4400-98e5-84ae41a2d1c1`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it." (scenario scripts turn 4; draft followed turn 2 scope — compressed 3 user-turn flow)
- **Turns / validates / errors:** 3 / 2 / INVALID_ENTITY_REF (recovered)
- **Draft turn:** turn 2 (after teams scope) — two-screen summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; explicit save phrasing on save turn ✓ (not saved-unconfirmed — evidence script flags turn-index vs scenario table)
- **Plan-only restraint:** turn 1 prose plan only — no validate ✓
- **Interview:** turn 1 offered to draft (user declined via "don't build yet"); no extra detail-view loop
- **Inventions:** 3 invented teams (id+name only); incidents verbatim
- **Artifact vs target:** matches — `/incidents` + `/teams`, no linking; minor: teams lack lead column vs UC1-S5.1
- **Feed-forward:** scope-fork can collapse turn 3 "wait for draft" when agent drafts immediately after turn 2

#### UC1-S5.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 0da20843-0260-47be-bd7c-56cea56719cc / 9ddd1f4d-ba1d-4a4a-ac0e-648817d3de1f · **Chat:** `/chat/0da20843-0260-47be-bd7c-56cea56719cc`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it."
- **Turns / validates / errors:** 4 / 1 / none
- **Draft turn:** turn 3 ("yes please" = build permission, not save) — two-screen summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4 ✓
- **Plan-only restraint:** turns 1–2 prose plan only — no validate ✓
- **Interview:** detail-view / API-future questions on turns 1–2; turn 3 assent to draft only
- **Inventions:** 3 teams with id/name/lead; incidents verbatim
- **Artifact vs target:** matches — `/incidents` + `/teams`, no linking, no detail screens
- **Feed-forward:** best canonical 4-turn script: turn 3 = "yes please" (build), turn 4 = explicit save

### UC1-S5 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Plan-only mode:** held all runs — no validate on turn 1 ✓
- **Save gate:** single save after explicit save turn ✓
- **Turn shape:** .1/.3 = 4-turn; .2 = 3-turn (draft immediately after scope fork) — both valid
- **Artifact:** two static browse entrypoints, no cross-links — consistent
- **Promote to eval:** 4-turn script with plan-only opener, scope fork, build assent, explicit save

#### UC1-S6.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** e71b47ab-446e-4f9d-b62b-3f57f3a5d894 / 96d4f344-763a-4956-9bec-12098ed446c8 · **Chat:** `/chat/e71b47ab-446e-4f9d-b62b-3f57f3a5d894`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yep, exactly. save it."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — static mock summary + panel note + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — opener was complete (static mock, no wiring)
- **Inventions:** none — 3 order records unwrapped from `items`; no API binding
- **Artifact vs target:** matches — `data.mode: static`; records from `items` envelope (not whole envelope as one record); no `GET /api/orders`; columns id/customer/total/status
- **Feed-forward:** canonical 2-turn static-vs-API boundary case; agent got discrimination right before validation

#### UC1-S6.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 4f8c0548-3ddb-4ee3-808f-7a723d4498a2 / 68e4ce6f-bdfd-4189-886f-fe0f35309b50 · **Chat:** `/chat/4f8c0548-3ddb-4ee3-808f-7a723d4498a2`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yep, exactly. save it."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — static mock summary + confirm ask ✓ (minor: offered optional actions/detail)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — opener complete
- **Inventions:** none — 3 records from `items`; no API binding
- **Artifact vs target:** matches — `data.mode: static`; unwrapped records; no `GET /api/orders`; same shape as .1
- **Feed-forward:** repeats .1 — boundary discrimination stable across runs

#### UC1-S6.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 277fe65c-6630-44cf-bfea-570aca65ee14 / 6bff8e62-4110-47c6-9a36-678c7885e3ee · **Chat:** `/chat/277fe65c-6630-44cf-bfea-570aca65ee14`
- **Observe state:** saved
- **Save-intent turn:** 3 — "yep, exactly. save it." (scenario scripts turn 2; compressed by detail-view question on turn 1)
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after "just the list please") — static summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; explicit save phrasing on save turn ✓
- **Interview:** turn 1 — detail view vs list-only; user turn 2 scoped to browse only
- **Inventions:** none — 3 records from `items`; no API binding
- **Artifact vs target:** matches — `data.mode: static`; unwrapped records; no `GET /api/orders`; status badge column
- **Feed-forward:** optional detail-view question adds a turn without breaking boundary discrimination

### UC1-S6 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Static-vs-API boundary:** all runs — `data.mode: static`, records unwrapped from `items`, no API binding ✓
- **Save gate:** single save after explicit save turn ✓
- **Turn shape:** .1/.2 = 2-turn; .3 = 3-turn (detail-view clarify) — both valid; artifact shape consistent
- **Promote to eval:** 2-turn script; grader checks static mode + unwrapped records + no API ops

---

## UC2 — CRUD admin

### Run entries

#### UC2-S1.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 29cb074f-d358-4ca6-a0d2-9281d60b82fd / 9f407ab8-9f12-4ab7-93fb-928aab942e43 · **Chat:** `/chat/29cb074f-d358-4ca6-a0d2-9281d60b82fd`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it."
- **Turns / validates / errors:** 4 / 2 / INVALID_PROP_TYPE (recovered)
- **Draft turn:** turn 3 (after scope + valuePath answers) — full CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4 ✓
- **Interview:** turn 1 — API vs static, schema, CRUD scope, paths; turn 2 — list envelope (`valuePath`) + company id/name for selector
- **Inventions:** none — contract from user turns 2–3; `valuePath: items` from user
- **Artifact vs target:** matches — browse/read/create/update/delete-on-read; entity scope selector → `GET /api/companies` (items, id/name); paths use `{scope.companyId}`; CTA browse→create; forms email/select/textarea/checkbox
- **Feed-forward:** canonical UC2 baseline; promote turn-2 field list + valuePath question to eval script

#### UC2-S1.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** b255ce13-ad45-4e84-a8d3-52ecc8d3cd17 / a3aa7c44-1ffa-4f20-ba11-ab6b26323b91 · **Chat:** `/chat/b255ce13-ad45-4e84-a8d3-52ecc8d3cd17`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it."
- **Turns / validates / errors:** 4 / 1 / none
- **Draft turn:** turn 3 — full CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4 ✓
- **Interview:** turn 1 — CRUD, fields, valuePath, paths; turn 2 — envelope confirm (user turn 3 bundles scope UX + `items`)
- **Inventions:** none — contract from user; `valuePath: items` on browse + companies selector
- **Artifact vs target:** matches — same shape as .1; browse/read/create/update/delete-on-read; entity scope → `/api/companies`; `{scope.companyId}` paths; CTA + form field types ✓
- **Feed-forward:** repeats .1 — stable canonical path; cleaner validate (no retry)

#### UC2-S1.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** f449584a-ed51-4f6e-95f7-3932b8e0da55 / bef526ce-b6c1-4266-8874-308a8b2d8084 · **Chat:** `/chat/f449584a-ed51-4f6e-95f7-3932b8e0da55`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it."
- **Turns / validates / errors:** 4 / 1 / none
- **Draft turn:** turn 3 — full CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4 ✓
- **Interview:** turn 1 — CRUD, fields, API vs static, valuePath, filters; turn 2 — plan recap + valuePath re-ask; user turn 3 bundles `items` + scope UX
- **Inventions:** none — contract from user; `valuePath: items` on browse + companies selector
- **Artifact vs target:** matches — same shape as .1/.2; full CRUD; delete-on-read; entity scope selector; form field types ✓
- **Feed-forward:** turn 2 plan-before-draft is harmless variance; eval script should include turn-2 field list

### UC2-S1 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Canonical path:** thin opener → contract on turn 2 → valuePath/scope on turn 3 → draft → save turn 4 ✓
- **Interview:** valuePath asked all runs before validate; scope UX answered on turn 3 ✓
- **Artifact:** browse/read/create/update/delete-on-read; `{scope.companyId}` paths; companies selector with `items` envelope — consistent
- **Validate noise:** .1 had `INVALID_PROP_TYPE` retry; .2/.3 clean — not a stability concern
- **Promote to eval:** use scenario turn-2 field list; expect valuePath question; grader checks full CRUD + scope selector

#### UC2-S2.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 43b45b84-5fda-4275-91c6-02328fc0c998 / 10dcfca1-b1b0-460b-840a-e18471013553 · **Chat:** `/chat/43b45b84-5fda-4275-91c6-02328fc0c998`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener includes "Validate and save when it passes" (escape hatch)
- **Turns / validates / errors:** 1 / 1 / none
- **Draft turn:** n/a — one-shot validate+save; no confirm detour ✓
- **save_rui audit:** 1 total; first save on user turn 1; explicit save in opener ✓
- **Interview:** none — complete prompt; no redundant re-asks ✓
- **Inventions:** none — all contract from opener (`items` envelope, id/name companies, scope paths)
- **Artifact vs target:** matches — full CRUD admin same shape as UC2-S1; delete-on-read with confirm; scope selector; minor: `notes` field type `text` not `textarea`
- **Feed-forward:** escape hatch works on v1.2; eval needs one-shot variant for complete prompts

#### UC2-S2.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 6f15946f-caef-456a-a515-5d908fa4d770 / a6c4653d-2624-4ea7-9540-5f707a8be354 · **Chat:** `/chat/6f15946f-caef-456a-a515-5d908fa4d770`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yes, go" (scenario turn-2 confirm; opener had "validate and save" but agent deferred)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — validate + confirm ask despite escape-hatch opener (partial draft detour)
- **save_rui audit:** 1 total; first save on user turn 2; save after user assent ✓
- **Interview:** none — no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches — full CRUD admin; scope selector; delete-on-read with confirm; form field types incl. notes textarea ✓
- **Feed-forward:** v1.2 draft-first can override escape hatch — expect 1- or 2-turn variance on identical opener

#### UC2-S2.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** bf2059eb-027b-4bcd-95f7-1f111a82446e / 8db04a53-7166-4a9f-8d46-9974b90f97ed · **Chat:** `/chat/bf2059eb-027b-4bcd-95f7-1f111a82446e`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "Validate and save when it passes" (true one-shot)
- **Turns / validates / errors:** 1 / 2 / INVALID_TRANSITION_MAP (recovered)
- **Draft turn:** n/a — validate+save same turn ✓
- **save_rui audit:** 1 total; first save on user turn 1 ✓
- **Interview:** none — no redundant re-asks ✓
- **Inventions:** none — contract from opener
- **Artifact vs target:** matches — full CRUD admin; scope selector; delete-on-read with confirm; form field types ✓
- **Feed-forward:** repeats .1 one-shot path; validate retry noise only

### UC2-S2 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes** (artifact shape consistent)
- **Escape hatch:** honored on .1/.3 (1-turn validate+save); deferred on .2 (draft confirm → "yes, go") — **flow unstable** on identical opener
- **Interview:** no redundant re-asks all runs ✓
- **Artifact:** browse/read/create/update/delete-on-read; companies scope; `{scope.companyId}`; `valuePath: items` — consistent
- **Validate noise:** .3 `INVALID_TRANSITION_MAP` retry — not a stability concern
- **Promote to eval:** one-shot variant + optional turn-2 confirm script; grader same as UC2-S1

#### UC2-S3.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 275a0049-7c21-432f-9f4a-3dc9b592a1b7 / 920df6a2-4a47-4af6-9a20-8aa4c166ad9d · **Chat:** `/chat/275a0049-7c21-432f-9f4a-3dc9b592a1b7`
- **Observe state:** saved
- **Save-intent turn:** 4 — "looks good, save it." (scenario scripts turn 3; extra write-scope clarify on turn 3)
- **Turns / validates / errors:** 4 / 1 / none
- **Draft turn:** turn 3 — OpenAPI-derived CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 4; turn 2 had no save word ✓
- **Interview:** turn 1 — scope UX (dropdown vs companies screen) + write `companyId` ambiguity from OpenAPI; turn 3 — re-asked write scoping (user turn 2 already said list/item use scope)
- **Inventions:** none — extracted paths/schemas from YAML paste
- **Artifact vs target:** matches — forms from `UserWrite` (no `id` on create/update); email/select/checkbox/textarea; `valuePath: items`; delete-on-read; `{scope.companyId}` on browse/read/write/delete ✓
- **Feed-forward:** OpenAPI write-scope gap is real — scenario turn 2 could say "all calls" not "list and item"; or prompt infers scoped writes when list is scoped

#### UC2-S3.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 3a835895-d53a-48ff-a896-fae056f14872 / aaf3011d-a470-484f-a947-9c57c1e19993 · **Chat:** `/chat/3a835895-d53a-48ff-a896-fae056f14872`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after CRUD/scope answer) — OpenAPI CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; turn 2 had no save word ✓
- **Interview:** turn 1 — company scope UX only (dropdown vs fixed); no write-scope re-ask
- **Inventions:** none — extracted from YAML; inferred scoped writes on POST/PATCH/DELETE
- **Artifact vs target:** matches — `UserWrite` forms; field types; `valuePath: items`; delete-on-read; `{scope.companyId}` on all wired calls ✓
- **Feed-forward:** best canonical 3-turn OpenAPI script; promote vs .1's extra write-scope loop

#### UC2-S3.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 7630286c-a0bd-4c5b-88a6-2173c4ffd40f / aae6d48c-46f4-41f6-9c34-99e0ce9ecd54 · **Chat:** `/chat/7630286c-a0bd-4c5b-88a6-2173c4ffd40f`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 (after CRUD/scope answer) — OpenAPI CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; turn 2 had no save word ✓
- **Interview:** turn 1 — write `companyId` ambiguity from OpenAPI only; turn 2 answer sufficient to draft (no re-ask)
- **Inventions:** none — extracted from YAML
- **Artifact vs target:** matches — `UserWrite` forms; field types; `valuePath: items`; delete-on-read; scoped writes ✓
- **Feed-forward:** same 3-turn shape as .2; turn-1 question type varies (scope UX vs write scope)

### UC2-S3 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **OpenAPI extraction:** all runs — full CRUD from YAML; `UserWrite` forms; scoped `{scope.companyId}` bindings ✓
- **Save gate:** turn 2 no save word; single save on turn 3 (or 4 when extra clarify) ✓
- **Turn shape:** .2/.3 = 3-turn canonical; .1 = 4-turn (write-scope re-ask after turn 2)
- **Interview variance:** turn 1 asks scope UX (.2) or write scoping (.1/.3) — both valid from OpenAPI gaps
- **Promote to eval:** 3-turn script; grader checks UserWrite forms + scoped paths + valuePath items

#### UC2-S4.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 062421cc-0fcb-4b00-8fed-bb9233d71ab5 / 43c62a01-aa95-48f3-a1f1-a77100921926 · **Chat:** `/chat/062421cc-0fcb-4b00-8fed-bb9233d71ab5`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save" (bundled with delete-on-detail confirm)
- **Turns / validates / errors:** 2 / 2 / SCOPE_PLACEHOLDER_MISSING (recovered)
- **Draft turn:** skipped — turn 2 escape hatch (validate+save; no confirm detour)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** turn 1 — role enum labels ask (sample already shows `member`; user bypassed on turn 2)
- **Inventions:** none — inferred from sample 200 bodies; scoped writes on POST/PATCH/DELETE
- **Artifact vs target:** matches — `valuePath: items` on browse + companies; `labelKey`/`valueKey` name/id; sensible `bodyMap`; delete-on-read; minor: `role` field `text` not `select`
- **Feed-forward:** primary inference watch-fors landed; role-select grader optional when samples imply enum

#### UC2-S4.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 77803ba5-2b0f-414c-aeb9-f0a45ede57fb / f206af45-b765-446c-ae0f-e2937af82392 · **Chat:** `/chat/77803ba5-2b0f-414c-aeb9-f0a45ede57fb`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save" (bundled with delete-on-detail)
- **Turns / validates / errors:** 2 / 3 / INVALID_PROP_TYPE, SCOPE_PLACEHOLDER_MISSING (recovered)
- **Draft turn:** skipped — turn 2 escape hatch (validate+save)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** turn 1 — role enum ask only; user bypassed with build-and-save on turn 2
- **Inventions:** none — inferred from sample bodies; scoped writes
- **Artifact vs target:** matches — `valuePath: items`; companies id/name binding; `bodyMap`; delete-on-read; minor: `role` `text` not `select` (same as .1)
- **Feed-forward:** repeats .1; validate retry noise only

#### UC2-S4.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 61d2d24b-cbe7-4773-85ec-adaa4ff5a3ef / c81cf009-e3b8-437b-9756-4f385e456671 · **Chat:** `/chat/61d2d24b-cbe7-4773-85ec-adaa4ff5a3ef`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save" (bundled with delete-on-detail)
- **Turns / validates / errors:** 2 / 3 / INVALID_PROP_TYPE, ROUTE_PARAM_MISMATCH, SCOPE_PLACEHOLDER_MISSING (recovered)
- **Draft turn:** skipped — turn 2 escape hatch (validate+save)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** turn 1 — POST companyId scope + envelope confirm (opener already shows `{items, total}`); user bypassed on turn 2
- **Inventions:** none — inferred from samples; scoped writes on POST/PATCH/DELETE
- **Artifact vs target:** matches — `valuePath: items`; companies id/name; `bodyMap`; delete-on-read; minor: `role` `text` not `select`
- **Feed-forward:** envelope/valuePath inferrable from turn 1 paste — reduce redundant asks

### UC2-S4 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Sample-response inference:** `valuePath: items`, companies `labelKey`/`valueKey`, sensible `bodyMap` — consistent all runs ✓
- **Turn shape:** stable 2-turn — turn 1 clarify, turn 2 "build and save" escape hatch
- **Interview variance:** role labels (.1), role enum (.2), scope/envelope (.3) — all bypassed by turn 2 script
- **Artifact nit:** `role` as `text` not `select` all runs (samples show `member` only)
- **Validate noise:** `SCOPE_PLACEHOLDER_MISSING` common; retries recover — not stability concern
- **Promote to eval:** sample-response case; grader checks valuePath + scope binding + bodyMap

#### UC2-S5.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** f75b02da-bbfe-4a44-b025-6dfaf8ff2cda / 39a4124a-6894-4664-be9a-2e7d1b5bd77b · **Chat:** `/chat/f75b02da-bbfe-4a44-b025-6dfaf8ff2cda`
- **Observe state:** saved
- **Save-intent turn:** 3 — "save it"
- **Turns / validates / errors:** 3 / 3 / INVALID_PROP_TYPE (recovered)
- **Draft turn:** turn 2 (after CRUD expansion) — full CRUD summary + confirm ask ✓; turn 1 read-only draft offered save (user expanded instead)
- **save_rui audit:** 1 total; first save on user turn 3; no dual-save ✓ (v1.1 victim fixed)
- **Interview:** none beyond scope expansion — user turn 2 added full CRUD + single-tenant
- **Inventions:** none — contract from user turns
- **Artifact vs target:** matches — browse/read/create/update; delete-on-read; `cta` browse→create; create/update outcomes (success/error/cancel) present; no company scope; titles not read-only framed
- **Feed-forward:** re-plan after scope fork worked; watch turn-1 save offer on interim read-only draft

#### UC2-S5.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** dd8cdc46-584d-4efd-b12c-fd91a132d57f / bac5d594-bbb0-4ad4-a247-e5091a0983f6 · **Chat:** `/chat/dd8cdc46-584d-4efd-b12c-fd91a132d57f`
- **Observe state:** saved
- **Save-intent turn:** 3 — "save it"
- **Turns / validates / errors:** 3 / 2 / none
- **Draft turn:** turn 2 (after CRUD expansion) — full CRUD summary + confirm ask ✓; turn 1 read-only draft offered save (user expanded instead)
- **save_rui audit:** 1 total; first save on user turn 3 ✓
- **Interview:** none — scope expansion on user turn 2 only
- **Inventions:** none
- **Artifact vs target:** matches — same shape as .1; `cta` browse→create; create/update outcomes; delete-on-read; single-tenant ✓
- **Feed-forward:** repeats .1; cleaner validate (no retry)

#### UC2-S5.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** d2d54825-63ab-4609-8a6e-62f16c3acbe5 / 59352e1b-d132-4db7-9bdb-06e710dc0211 · **Chat:** `/chat/d2d54825-63ab-4609-8a6e-62f16c3acbe5`
- **Observe state:** saved
- **Save-intent turn:** 3 — "save it"
- **Turns / validates / errors:** 3 / 2 / none
- **Draft turn:** turn 2 (after CRUD expansion) — full CRUD summary + confirm ask ✓; turn 1 read-only draft offered save (user expanded instead)
- **save_rui audit:** 1 total; first save on user turn 3 ✓
- **Interview:** none — scope expansion on user turn 2 only
- **Inventions:** none
- **Artifact vs target:** matches — same shape as .1/.2; `cta`; outcomes; delete-on-read; single-tenant ✓
- **Feed-forward:** stable 3-turn scope-expansion script; turn-1 save offer on interim draft is consistent noise

### UC2-S5 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Dual-save (v1.1 victim):** fixed — single save on turn 3 all runs ✓
- **Scope expansion:** read-only draft turn 1 → CRUD re-plan turn 2 → save turn 3 — consistent
- **Artifact:** browse/read/create/update; delete-on-read; `cta` browse→create; create/update outcomes present — no bolt-on failures
- **Flow noise:** turn 1 offers save on interim read-only draft all runs — user expands instead; not a failure mode
- **Promote to eval:** 3-turn scope-fork script; grader checks outcomes + cta + delete-on-read

#### UC2-S6.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 5a77ca8b-215d-4820-b33f-466bb7b4bed3 / d8bdc4f8-3d73-48a2-85c9-227d2d483355 · **Chat:** `/chat/5a77ca8b-215d-4820-b33f-466bb7b4bed3`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yep that's it. build and save."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — cURL-derived CRUD summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — complete cURL paste + role values in bodies
- **Inventions:** none — normalized `usr_101`→`{userId}`, `co_01`→`{scope.companyId}`; no sample IDs in saved spec ✓
- **Artifact vs target:** matches — `valuePath: items`; companies selector; form fields from `-d` bodies; delete-on-read; full CRUD scoped paths ✓
- **Feed-forward:** primary cURL trap avoided; grader should assert zero literal sample IDs in paths

#### UC2-S6.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 0686d7b8-02a8-432f-9323-f3d316ded0ba / f7f5f64d-da3f-40a6-a1cb-fee0bb2b6259 · **Chat:** `/chat/0686d7b8-02a8-432f-9323-f3d316ded0ba`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yep that's it. build and save."
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** turn 1 — prose plan + confirm ask (no validate until turn 2)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none — complete cURL paste incl. role enum line
- **Inventions:** none — no `usr_101`/`co_01` in spec; parameterized paths ✓
- **Artifact vs target:** matches — same shape as .1; `valuePath: items`; form fields from bodies; delete-on-read ✓
- **Feed-forward:** plan-then-build variant vs .1 draft-on-turn-1 — both valid 2-turn paths

#### UC2-S6.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 19722ddc-bee5-4685-b0aa-314d2b2beea5 / 26017c48-a9d9-4c4d-89a6-d09b891fe90d · **Chat:** `/chat/19722ddc-bee5-4685-b0aa-314d2b2beea5`
- **Observe state:** saved
- **Save-intent turn:** 2 — "yep that's it. build and save." (user turn 3 retry after failed save)
- **Turns / validates / errors:** 3 / 1 / save_rui tool error on first attempt ("Tool execution was interrupted by an error")
- **Draft turn:** turn 1 — validate + CRUD summary + confirm ask ✓
- **save_rui audit:** 2 tool calls; first failed on user turn 2; second succeeded on user turn 3 retry ✓
- **Interview:** none — complete cURL paste
- **Inventions:** none — no sample IDs in spec; `{userId}` + `{scope.companyId}` ✓
- **Artifact vs target:** matches — same shape as .1/.2; `valuePath: items`; forms from bodies; delete-on-read ✓
- **Feed-forward:** infra flake on save — user retry recovered; watch save reliability under validate-first flow

### UC2-S6 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **cURL trap:** no `usr_101`/`co_01` in saved specs all runs ✓
- **Inference:** `valuePath: items`, scoped paths, form fields from `-d` bodies — consistent
- **Turn shape:** .1/.3 draft+validate turn 1; .2 plan turn 1 — all 2-turn intent ( .3 became 3 user turns on save retry)
- **Infra:** .3 first `save_rui` failed with tool interruption; duplicate user message + retry succeeded
- **Promote to eval:** cURL handoff case; grader asserts zero literal sample IDs in paths

---

## UC3 — AI review queue

### Run entries

#### UC3-S1.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 84f006cf-7f8f-4fd4-9b69-07070723026d / 03f745a5-1791-4525-a040-776241cdb3e7 · **Chat:** `/chat/84f006cf-7f8f-4fd4-9b69-07070723026d`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it."
- **Turns / validates / errors:** 3 / 2 / INVALID_TRANSITION_MAP (recovered)
- **Draft turn:** turn 2 — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; turn 2 had no save word ✓ (v1.1 premature-save victim fixed)
- **Interview:** turn 1 — list envelope (`valuePath`); user turn 2 bundled `items!` + detail acts + status filter
- **Inventions:** none — endpoints from opener; filter options inferred
- **Artifact vs target:** matches — two `act` on read (approve/reject) with success→inbox; row transition; `presentation.filter` for status; `valuePath: items` ✓
- **Feed-forward:** canonical UC3 baseline; promote bundled turn-2 clarify script to eval

#### UC3-S1.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 432ca660-27b9-4c69-b500-889f468ae139 / eec3a16a-1c0d-4015-9d77-69efa91ab35e · **Chat:** `/chat/432ca660-27b9-4c69-b500-889f468ae139`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; turn 2 had no save word ✓
- **Interview:** turn 1 — plan + valuePath + reply-text field name; user turn 2 bundled `items!` + acts-on-detail + status filter
- **Inventions:** none — filter options inferred
- **Artifact vs target:** matches — approve/reject `act` on read with success→inbox; row transition; `presentation.filter`; `valuePath: items` ✓
- **Feed-forward:** repeats .1; turn 1 plan-before-draft variant

#### UC3-S1.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 93277c8d-1b48-4c5f-b6d3-87f56848da5e / f8ddb965-c762-4166-940c-aba8e9ea596e · **Chat:** `/chat/93277c8d-1b48-4c5f-b6d3-87f56848da5e`
- **Observe state:** saved
- **Save-intent turn:** 3 — "looks good, save it."
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** turn 2 — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 3; turn 2 had no save word ✓
- **Interview:** turn 1 — plan + valuePath only; user turn 2 bundled `items!` + acts-on-detail + status filter
- **Inventions:** none — filter options inferred
- **Artifact vs target:** matches — approve/reject `act` on read with success→inbox; row transition; `presentation.filter`; `valuePath: items` ✓
- **Feed-forward:** stable 3-turn canonical script across all runs

### UC3-S1 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Premature-save (v1.1 victim):** fixed — single save on turn 3 all runs; turn 2 never had save word ✓
- **HITL artifact:** browse + read; two `act` on detail; success→inbox; row transition; status filter — consistent
- **Interview:** valuePath asked all runs; turn 2 bundles clarify + scenario script
- **Validate noise:** .1 `INVALID_TRANSITION_MAP` retry only — not stability concern
- **Promote to eval:** 3-turn script with bundled turn-2 clarify; grader checks acts + filter + valuePath

#### UC3-S2.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 435812fb-7811-4c7f-be32-b3097a18e91c / 4b54792e-1423-4ea0-98e5-c78517887ec5 · **Chat:** `/chat/435812fb-7811-4c7f-be32-b3097a18e91c`
- **Observe state:** saved
- **Save-intent turn:** 3 — "go." (opener had "validate and save"; agent deferred to draft+confirm)
- **Turns / validates / errors:** 3 / 4 / INVALID_PROP_TYPE, ROUTE_PARAM_MISMATCH, INVALID_BINDING_PLACEHOLDER (recovered)
- **Draft turn:** turn 2 (after filter UX answer) — HITL summary + confirm ask; not one-shot ✓
- **save_rui audit:** 1 total; first save on user turn 3 ✓
- **Interview:** turn 1 — redundant filter UX question (opener already specified status filter)
- **Inventions:** none — shape from opener paste; `valuePath: items` from `{items:[...]}`
- **Artifact vs target:** matches — approve/reject `act` on read; success→inbox; row transition; `presentation.filter`; minor: status wired as API `?status={status}` on browse route vs S1 client-side filter only
- **Feed-forward:** escape hatch not honored — v1.2 draft-first + redundant clarify; eval needs one-shot variant

#### UC3-S2.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 8b729ba8-87ef-4ddb-a2ec-55792aaaa826 / fa9efe56-02a1-4f35-8320-f716f083c20d · **Chat:** `/chat/8b729ba8-87ef-4ddb-a2ec-55792aaaa826`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "validate and save" (true one-shot escape hatch)
- **Turns / validates / errors:** 1 / 1 / none
- **Draft turn:** n/a — validate+save same turn ✓
- **save_rui audit:** 1 total; first save on user turn 1 ✓
- **Interview:** none — complete prompt; no redundant re-asks ✓
- **Inventions:** none — `valuePath: items` from pasted shape
- **Artifact vs target:** matches — approve/reject `act` on read; success→inbox; row transition; `presentation.filter`; aligns with S1 shape (client-side filter on `/api/drafts`)
- **Feed-forward:** ideal escape-hatch path for eval one-shot variant

#### UC3-S2.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 2a8b56ff-dbdc-4322-bd29-490bd5d66e2b / 69596070-16e7-4094-9a33-25a0e86fc080 · **Chat:** `/chat/2a8b56ff-dbdc-4322-bd29-490bd5d66e2b`
- **Observe state:** saved
- **Save-intent turn:** 1 — opener "validate and save" (true one-shot)
- **Turns / validates / errors:** 1 / 1 / none
- **Draft turn:** n/a — validate+save same turn ✓
- **save_rui audit:** 1 total; first save on user turn 1 ✓
- **Interview:** none ✓
- **Inventions:** none — `valuePath: items` from pasted shape
- **Artifact vs target:** matches — same HITL shape as .2/S1; client-side status filter ✓
- **Feed-forward:** repeats .2 one-shot path

### UC3-S2 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes** (artifact shape)
- **Escape hatch:** honored on .2/.3 (1-turn validate+save); deferred on .1 (redundant filter question → 3-turn draft+confirm)
- **Artifact:** browse+read; two `act` on detail; success→inbox; row transition; `presentation.filter`; `valuePath: items` — consistent
- **Flow variance:** identical opener can yield 1- or 3-turn paths (same as UC2-S2)
- **Promote to eval:** one-shot variant for complete HITL prompt; grader same as UC3-S1

#### UC3-S3.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-negotiated
- **Session / spec:** c02aa121-f837-4054-b0cb-7698cb5455fc / d8501711-dae7-43ca-aadc-7b5d534461cd · **Chat:** `/chat/c02aa121-f837-4054-b0cb-7698cb5455fc`
- **Observe state:** saved
- **Save-intent turn:** 4 — validate+save after "pick the most appropriate" (scenario scripts turn 2 "do it that way and save" — deferred)
- **Turns / validates / errors:** 4 / 1 / none
- **Draft turn:** skipped — turn 4 escape hatch (validate+save; no confirm ask)
- **save_rui audit:** 1 total; first save on user turn 4 ✓
- **Interview:** turn 1 — **pushback on row-level approve/reject** ✓; offered row→detail→act; then redundant valuePath + column asks despite turn 2 assent+save
- **Inventions:** columns author/text/createdAt (user said "pick most appropriate"); endpoints from opener
- **Artifact vs target:** matches valid pattern — no row inline acts; approve/reject `act` on read with success→inbox; row transition only ✓
- **Feed-forward:** negotiation landed before validate; prompt should skip re-interview once user accepts detail-act flow + says save

#### UC3-S3.2 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-negotiated
- **Session / spec:** 893bde4c-005e-42ba-8c2a-3edcf9cc055f / 1f76d164-8730-47c0-b2cf-01e6ee35e418 · **Chat:** `/chat/893bde4c-005e-42ba-8c2a-3edcf9cc055f`
- **Observe state:** saved
- **Save-intent turn:** 3 — "do it that way and save" → validate+save (scenario turn 2; valuePath detour on turn 1)
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** skipped — turn 3 escape hatch after negotiation assent
- **save_rui audit:** 1 total; first save on user turn 3 ✓
- **Interview:** turn 1 — valuePath first; turn 2 — **pushback on row inline acts** ✓; user turn 3 accepts detail-act flow + save
- **Inventions:** minimal browse columns (id only); endpoints from opener
- **Artifact vs target:** matches valid pattern — no row acts; approve/reject on read; success→inbox; row transition ✓
- **Feed-forward:** better than .1 — no post-assent re-interview; pushback should precede valuePath ask

#### UC3-S3.3 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-negotiated
- **Session / spec:** b2a22fda-169a-46be-93ce-c17c59a5199d / ad81e1b3-677f-4980-b0fb-ed07d2d44375 · **Chat:** `/chat/b2a22fda-169a-46be-93ce-c17c59a5199d`
- **Observe state:** saved
- **Save-intent turn:** 3 — "do it that way and save" → validate+save (valuePath detour on turn 1)
- **Turns / validates / errors:** 3 / 1 / none
- **Draft turn:** skipped — turn 3 escape hatch after negotiation assent
- **save_rui audit:** 1 total; first save on user turn 3 ✓
- **Interview:** turn 1 — valuePath; turn 2 — **pushback on row inline acts** ✓; user turn 3 accepts + save
- **Inventions:** minimal browse columns (id only)
- **Artifact vs target:** matches — no row acts; approve/reject on read; success→inbox; row transition ✓
- **Feed-forward:** repeats .2 shape; stable negotiation outcome

### UC3-S3 findings (3/3)

- **Result:** 3/3 `saved-negotiated`; **stable: yes**
- **Row-action trap:** all runs — agent pushed back before validate; no invalid row inline acts in saved specs ✓
- **Valid artifact:** browse+read; two `act` on detail; success→inbox; row transition — consistent
- **Flow variance:** .1 pushback-first then extra column interview (4 turns); .2/.3 valuePath-first then pushback (3 turns)
- **Turn shape:** scenario scripts 2 turns; actual 3–4 — valuePath/clarify detour common
- **Promote to eval:** negotiation variant; grader asserts no row-level act bindings + detail approve/reject

#### UC3-S4.1 — 2026-08-10
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 280cce05-9dd7-4494-8985-4ea4566bd8a7 / 33e0992c-184e-484b-bc32-a29839d57b40 · **Chat:** `/chat/280cce05-9dd7-4494-8985-4ea4566bd8a7`
- **Observe state:** saved
- **Save-intent turn:** 5 — "that plan works, save it." (scenario scripts turn 4; extra valuePath turn)
- **Turns / validates / errors:** 5 / 3 / INVALID_PROP_TYPE, INVALID_TRANSITION_MAP (recovered)
- **Draft turn:** turn 4 (after approve/reject + `items`) — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 5 ✓
- **HITL hold:** no validate until approve/reject endpoints on user turn 3 ✓ (v1.1 premature-save victim fixed)
- **Interview:** turn 1 — endpoints, valuePath, fields; held through turn 2–3 until action paths known; redundant valuePath re-asks
- **Inventions:** turn 1 plan prose said "Send" before user supplied approve/reject — not in final spec
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read; success→inbox; row transition; `valuePath: items`; fields ticketId/confidence/text ✓
- **Feed-forward:** discovery interview works; prompt should consolidate valuePath asks

#### UC3-S4.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** cdcb9db4-09cc-42e9-bab8-08e3aab88759 / f3ac615d-b812-4726-b1ef-3b0bc15dd6de · **Chat:** `/chat/cdcb9db4-09cc-42e9-bab8-08e3aab88759`
- **Observe state:** saved
- **Save-intent turn:** 6 — "that plan works, save it." (scenario scripts turn 4; +2 for valuePath + field-name confirm)
- **Turns / validates / errors:** 6 / 2 / INVALID_PROP_TYPE (recovered — `columns[3].format` on text col)
- **Draft turn:** after user turn 5 approve/reject + valuePath — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 6 ✓
- **HITL hold:** no validate until approve/reject endpoints on user turn 5 ✓
- **Interview:** turn 1 — endpoints, send/update/discard; turn 2 fields+GET; held through turn 4 until actions; then valuePath + field-name re-ask
- **Inventions:** none in saved spec; interview correctly asked about send/update/discard without building them
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read; success→inbox; row transition; `valuePath: items`; fields id/ticketId/confidence/text ✓
- **Feed-forward:** user turn 9 "great!" (off-script) — agent inferred field names from turn 3 and proceeded; same valuePath detour theme as .1

#### UC3-S4.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 4d79e168-646e-4445-a647-50e2669a5e46 / a83c97d9-3977-4f1a-ab68-14984a5da572 · **Chat:** `/chat/4d79e168-646e-4445-a647-50e2669a5e46`
- **Observe state:** saved
- **Save-intent turn:** 5 — "that plan works, save it." (scenario scripts turn 4; +1 for valuePath)
- **Turns / validates / errors:** 5 / 1 / none
- **Draft turn:** after user turn 4 (`items!`) — HITL summary + confirm ask ✓
- **save_rui audit:** 1 total; first save on user turn 5 ✓
- **HITL hold:** no validate until approve/reject endpoints on user turn 3 ✓
- **Interview:** turn 1 — full discovery (endpoints, valuePath, fields, edit/send); turn 2 fields+GET; held until turn 3 actions; valuePath re-ask before draft
- **Inventions:** none in saved spec; interview asked about edit/update without building them
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read; success→inbox; row transition; `valuePath: items`; fields id/ticketId/confidence/content ✓
- **Feed-forward:** cleanest validate path (1 pass); field key `content` vs `text` in .1/.2 — both inferred from "draft text"

### UC3-S4 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **HITL hold:** all runs — no validate/save until approve/reject endpoints known (v1.1 premature-save victim fixed)
- **Valid artifact:** browse+read; two detail `act`s; success→inbox; row transition; `valuePath: items` — consistent
- **Flow variance:** scenario scripts 4 turns; actual 5–6 — extra valuePath turn (`items!`) in all 3 runs; .2 also field-name confirm + off-script "great!"
- **Validate noise:** .1/.2 recovered schema errors; .3 one-pass clean
- **Promote to eval:** drip-fed discovery script with valuePath answer on turn 4; grader asserts no row acts + detail approve/reject + inbox outcomes

#### UC3-S5.1 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** c0cc1b44-5fb9-4999-8db2-df175494a32f / 7ba1424c-9712-42c7-887e-80c7d0e511ff · **Chat:** `/chat/c0cc1b44-5fb9-4999-8db2-df175494a32f`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 1 — HITL summary + confirm ask ✓ (anticipated detail acts + danger from opener prose)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none needed — complete contract on turn 1; turn 2 restated detail placement + danger + save
- **Inventions:** none — endpoints/fields from opener; `valuePath: items` from envelope hint
- **Artifact vs target:** matches — browse+read; remove-listing `danger` + dismiss `secondary` on read; success→inbox; row transition; moderation domain (no draft/approve residue) ✓
- **Feed-forward:** pattern generalizes beyond support-bot vocabulary; turn 2 partly redundant — saved without re-validate (draft already matched)

#### UC3-S5.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** e4f7347a-c731-429b-b87c-a3809cdbe46c / 767b313c-1f16-41f2-a59e-a0c0cab7899c · **Chat:** `/chat/e4f7347a-c731-429b-b87c-a3809cdbe46c`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 2 — validate + save on save-intent turn (turn 1 was plan-only ask)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** turn 1 plan prose only — held validate until turn 2 danger/placement + save intent ✓
- **Inventions:** none — endpoints/fields from opener; `valuePath: items` from envelope hint
- **Artifact vs target:** matches — browse+read; remove-listing `danger` + dismiss `secondary` on read; success→inbox; row transition; listing detail sections ✓
- **Feed-forward:** canonical 2-turn draft→confirm vs .1 early-draft-on-turn-1; validate+save same assistant turn on confirm

#### UC3-S5.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 69937ea7-2a12-4068-87f5-904b197e7566 / e34427c9-ba96-4735-b0bf-12629e9dd78a · **Chat:** `/chat/69937ea7-2a12-4068-87f5-904b197e7566`
- **Observe state:** saved
- **Save-intent turn:** 2 — "build and save." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 1 — HITL summary + confirm ask ✓ (detail acts in draft; danger in validated JSON before turn 2 prose)
- **save_rui audit:** 1 total; first save on user turn 2 ✓
- **Interview:** none needed — complete contract on turn 1; turn 2 restated detail placement + danger + save
- **Inventions:** none — endpoints/fields from opener; `valuePath: items` from envelope hint
- **Artifact vs target:** matches — browse+read; remove-listing `danger` + dismiss `secondary` on read; success→inbox; row transition; moderation domain ✓
- **Feed-forward:** repeats .1 shape (early draft turn 1, save turn 2 without re-validate)

### UC3-S5 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Pattern generalization:** all runs — moderation domain (flags/remove/dismiss) with no support draft/approve residue ✓
- **Valid artifact:** browse+read; two detail `act`s; remove=danger dismiss=secondary; success→inbox; row transition; `valuePath: items` — consistent
- **Flow variance:** .2 plan-then-draft on turn 2; .1/.3 early draft+validate on turn 1, save on turn 2 without re-validate
- **Promote to eval:** moderation variant of UC3 canonical; grader asserts detail acts + danger variant + inbox outcomes (not memorized draft vocabulary)

#### UC3-S6.1 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** dc436ec5-2f65-44f5-b6ba-d7e6c9f65c82 / e2ee5117-dfd9-4fcf-be08-f09324e51a7e · **Chat:** `/chat/dc436ec5-2f65-44f5-b6ba-d7e6c9f65c82`
- **Observe state:** saved
- **Save-intent turn:** 2 — "save it when it's good." (matches scenario script)
- **Turns / validates / errors:** 2 / 1 / none
- **Draft turn:** after user turn 2 — validate + save on save-intent turn (turn 1 plan-only + one nav question)
- **save_rui audit:** 1 total; first save on user turn 2 ✓ (v1.1 premature-save victim fixed)
- **Interview:** turn 1 — assumed HITL plan from endpoint names; asked post-action navigation only (not domain meaning); user turn 2 supplied meaning + detail fields
- **Inventions:** none — endpoints from turn 1; detail fields body/ticketSubject/customerMessage from turn 2
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read (not CRUD writes); success→inbox; row transition; `valuePath: items`; detail sections with turn-2 fields ✓
- **Feed-forward:** save gate holds; prompt should ask domain meaning on endpoints-only openers before presenting full plan

#### UC3-S6.2 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 5fc20f94-2040-4231-98c1-dd2d9dc28a0f / 38c8dc87-1ae9-4afc-bf82-8e4fd75580ac · **Chat:** `/chat/5fc20f94-2040-4231-98c1-dd2d9dc28a0f`
- **Observe state:** saved
- **Save-intent turn:** 2 — "save it when it's good." (matches scenario script)
- **Turns / validates / errors:** 2 / 2 / none
- **Draft turn:** turn 1 validate+confirm ask (premature — before meaning/detail fields); turn 2 re-validate+save after user supplies context
- **save_rui audit:** 1 total; first save on user turn 2 ✓ (v1.1 premature-save victim fixed for save; draft gate violated on turn 1)
- **Interview:** none on turn 1 — jumped to full HITL draft from endpoint names; user turn 2 supplied meaning + detail fields
- **Inventions:** none — endpoints from turn 1; detail fields body/ticketSubject/customerMessage from turn 2
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read; success→inbox; row transition; `valuePath: items`; turn-2 detail fields in saved spec ✓
- **Feed-forward:** worse than .1 — validate on endpoints-only turn 1; prompt must block draft/validate until meaning interview complete

#### UC3-S6.3 — 2026-08-11
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** f7f757fe-298d-4067-b87a-c1d3019dedb7 / f709249f-41c1-4657-9ddc-6ebf14c23359 · **Chat:** `/chat/f7f757fe-298d-4067-b87a-c1d3019dedb7`
- **Observe state:** saved
- **Save-intent turn:** 2 — "save it when it's good." (matches scenario script)
- **Turns / validates / errors:** 2 / 3 / INVALID_PROP_TYPE (recovered on turn 1; re-validate clean on turn 2)
- **Draft turn:** turn 1 validate+confirm ask (premature — 2× validate before meaning/detail fields); turn 2 re-validate+save
- **save_rui audit:** 1 total; first save on user turn 2 ✓ (v1.1 premature-save victim fixed for save; draft gate violated on turn 1)
- **Interview:** none on turn 1 — full HITL draft from endpoint names; user turn 2 supplied meaning + detail fields
- **Inventions:** none — endpoints from turn 1; detail fields body/ticketSubject/customerMessage from turn 2
- **Artifact vs target:** matches — browse+read; approve/reject `act` on read; success→inbox; row transition; `valuePath: items`; turn-2 detail fields ✓
- **Feed-forward:** repeats .2 shape; turn 1 double-validate + schema recovery noise

### UC3-S6 findings (3/3)

- **Result:** 3/3 `saved-clean`; **stable: yes**
- **Save gate:** 3/3 — no `save_rui` before turn 2 save intent (v1.1 premature-save victim fixed for save) ✓
- **Draft gate:** 1/3 held — .1 plan-only; .2/.3 validate on endpoints-only turn 1 before meaning interview
- **Valid artifact:** browse+read; approve/reject `act` on read (not CRUD); success→inbox; row transition; `valuePath: items` — consistent
- **Interview quality:** weak across runs — domain meaning supplied by user on turn 2, not elicited on turn 1
- **Promote to eval:** endpoints-only opener script; grader asserts no save/validate turn 1 + detail acts after turn 2 context

---

## S+1 — Post-save iteration

### Run entries

#### S+1.1 — 2026-08-11 (parent: D3.3)
- **Platform:** post-fix (prompt v1.2 draft-first)
- **Result:** saved-clean
- **Session / spec:** 22d0e68c-4d92-4d9c-878c-f3764efc4164 / 9bdca8da-62c4-41c5-ba99-6a38515ab7db (S+1; parent `8ea83f60-e5a7-409a-83a7-2d966df8b58e`) · **Chat:** `/chat/22d0e68c-4d92-4d9c-878c-f3764efc4164`
- **Observe state:** saved
- **Save-intent turn:** 4 — "save it again." (S+1 turn; explicit re-save phrasing)
- **Turns / validates / errors:** 4 session user turns / 3 session validates / none on S+1 turn
- **Draft turn:** n/a — S+1 turn validate+save same assistant turn (escape-hatch re-save) ✓
- **save_rui audit:** 2 total session; save #1 user turn 3 (D3.3); save #2 user turn 4 (S+1) ✓
- **Interview:** none — change + save in one turn ✓
- **Inventions:** none — rename + detail notes only as requested
- **Artifact vs target:** app → "Team Console"; `notes` on read detail only (not browse/forms); scope/transitions/delete outcomes/active badge carried forward ✓
- **Feed-forward:** agent said "new version" + new URL (good); could be clearer that prior spec is unchanged (no update-in-place)

---

## Cross-run findings

**Runs:** 66 base (22 scenarios × 3) + 1 S+1 (UC2). **Zero `saved-unconfirmed`.** Dashboard: 20/22 scenarios `stable: yes`; UC1-S3 and UC1-S4 unstable on artifact shape (not save gate).

| Watch-for | Verdict | Evidence |
|---|---|---|
| **Save gate** | ✅ Pass | No `save_rui` before save-intent turn in any countable run |
| **Escape hatch** | ⚠️ Mostly | D1.2/.3, UC2-S2.1/.3, UC3-S2.2/.3, UC3-S5 — true one-shot; D1.1, UC2-S2.2, UC3-S2.1 defer to draft+confirm on identical opener |
| **Draft shape** | ✅ Pass | D2/D3, UC1-S1/S2, UC3-S1 — summary + confirm ask on draft turns (one-shots n/a) |
| **Plan-only (UC1-S5)** | ✅ Pass | 3/3 — no `validate_rui` on turn 1 |
| **Iteration carry-forward** | ✅ Pass | D3 3/3; S+1.1 — scope, transitions, delete outcomes preserved |
| **Rule 4 (`valuePath`)** | ✅ Pass | UC2-S1, UC3-S1 — asked or present before validate |
| **Rule 5 (messy-data)** | ❌ Fail | UC1-S4 0/3 clean — `sev` ordering never asked; epochs raw; assignee flatten inconsistent |
| **Rule 6 (HITL hold)** | ✅ Pass | UC3-S4 3/3 — no validate/save until approve/reject endpoints known |
| **Dual-saves** | ✅ Pass | UC1-S3, UC2-S5 — single save at confirm (v1.1 victims fixed) |
| **Turn economy** | ✅ Acceptable | Draft flows typically +1 vs v1.1; UC3-S4 +1–2 for valuePath detour |
| **Infra** | ✅ Fixed | UC1-S3.3 422 — `normalizeWireMessages` maps `rawInput` → `input` on failed tool parts |

**Stable on dashboard (`stable: yes`):** all scenarios except UC1-S3 (metric derivation varies) and UC1-S4 (consistently off-target artifact).

**S+1 coverage:** 1/3 use cases (UC2 via S+1.1 / parent D3.3). UC1 + UC3 optional before WS5.

---

## Changes to make

The deliverable. Every item cites v1.2 run evidence.

### Confirmed — no change needed (WS1–WS4)

- ✅ **Draft-first save gate** — headline v1.2 behavior validated; zero premature saves (`D2.1`, `UC3-S6.1`, `UC1-S4.1` save timing fixed vs v1.1)
- ✅ **Plan-only mode** — UC1-S5 3/3; no validate on "don't build yet" opener
- ✅ **HITL hold** — UC3-S4 3/3; no complete draft before action endpoints
- ✅ **`valuePath` interview** — UC2-S1, UC3-S1 stable; promote bundled turn-2 scripts to eval
- ✅ **Dual-save elimination** — UC1-S3, UC2-S5 single final save
- ✅ **Observe session state** — Draft funnel shipped; evidence script reports `state`
- ✅ **Transcript infra** — `normalizeWireMessages` for failed validate retry (UC1-S3.3)

### Optional prompt v1.2.1 (artifact quality — not blocking WS5)

- **Rule 5 messy-data** — UC1-S4 0/3 clean: require `sev` ordering, assignee flatten, epoch→date before validate (`UC1-S4.1`–`.3`)
- **UC3-S6 interview-before-draft** — 2/3 runs validated on endpoints-only turn 1; ask domain meaning before draft (`UC3-S6.2`, `.3`)
- **Escape hatch consistency** — identical "validate and save" opener yields 1- or 2-turn path (`D1.1` vs `.2`, `UC2-S2.2` vs `.1/.3`)
- **UC1-S3 header metrics** — derive Open/Resolved counts from static records, not invented (`UC1-S3.2`)
- **Minor:** `role` as `select` when enum known (`UC2-S4`); consolidate redundant valuePath re-asks (`UC3-S4`)

### WS5 — eval cases (required before 7.4 baselines)

1. **`mockApi`** — delete blocks from `crud-admin-v0.2.json` / `ai-review-queue-v0.2.json`; carry contracts in prompt/script turns (matches exploration delivery)
2. **`crud-admin-v0.2`** — turn 2 = full UC2-S1 contract (fields + `{items}` + scope); confirm turn `"Looks good — save it."`; `maxUserTurns: 5`
3. **`ai-review-queue-v0.2`** — UC3-S1/S2 wording in prompt; turn 2 bundled clarify; explicit save confirm; `maxUserTurns: 5`
4. **`static-browse-v0.2`** — bump `maxUserTurns: 5` (opener already explicit-save one-shot)
5. **`eval:run` green** locally on all three updated cases

### 7.5 blocker variants (required before 7.7)

- **Clarification** — UC3-S4 drip-fed discovery shape (`UC3-S4.1`–`.3`)
- **Negotiation** — UC3-S3 row-action pushback; `forbiddenEmbeddedAction` on browse (`UC3-S3.1`–`.3`)

### Optional 7.5 variants

- **Power-user one-shot** — D1 / UC2-S2 escape hatch (`D1.2`, `UC2-S2.1`)
- **Draft-iterate** — D3 correction loop; single final save (`D3.1`–`.3`)

### Already shipped (WS1–WS3)

- ✅ Prompt v1.2 — `agent/prompts/v1.2.txt`
- ✅ Observe session state + Draft funnel — [plan WS2](chat-agent-v1.2-plan.md#workstream-2--observe-agent-dashboard)
- ✅ Exploration docs — scenarios + this findings doc
- ✅ WS4 re-run — 66 base runs logged; cross-run findings above

### Superseded v1.1 guidance

See [v1.1 Changes to make](chat-exploration-findings.md#changes-to-make) for baseline evidence. Premature-save, dual-save, and `maxUserTurns: 3` items superseded by v1.2 evidence above.
