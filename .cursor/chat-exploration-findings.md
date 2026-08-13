# Chat exploration — findings summary

**Companion:** [chat-exploration-scenarios.md](chat-exploration-scenarios.md) (scripts) · [v0.2 implementation plan](rapidui-v0.2-implementation.md) (what shipped)

Exploration runs: **v1.1** (prompt v1.1, 19 scenarios × 3) then **v1.2** (prompt v1.2 draft-first, 22 scenarios × 3 + D1–D3 + 1 S+1). Full run logs live in git history prior to 2026-08-12 consolidation.

---

## v1.1 — what broke (drove prompt v1.1 + validator work)

| Issue | Evidence | Fix shipped |
|-------|----------|-------------|
| **Vocabulary / schema stalls** | UC2-S1 needed 4–5 turns past “build it” without shape hints | Prompt v1.1 + enriched `GET /api/schema` |
| **Premature validate** | UC2-S1 validated before scope/delete UX confirmed | Prompt v1.1 anti-premature-validate |
| **Dual-save** | UC1-S3, UC2-S5, UC3-S4 — interim save then rebuild | Draft-first gate (prompt v1.2) |
| **Premature save** | UC3-S6 saved on turn 1; UC3-S1 skipped status-filter turn; UC1-S4 saved without semantics interview | Draft-first gate (prompt v1.2) |
| **Bad binding placeholders** | UC2-S4 `{scope.params.userId}` saved | `INVALID_BINDING_PLACEHOLDER` validator |
| **Row inline acts** | UC3-S3 user asked row approve/reject | Prompt negotiation; eval negotiation variant |
| **Messy static data** | UC1-S4 — no `sev` ordering / assignee / epoch handling | Partially fixed v1.1; **still weak after v1.2 re-run** |
| **HITL before endpoints** | UC3-S4 saved before approve/reject paths known | HITL hold rule; held 3/3 in v1.2 re-run |

---

## v1.2 re-run headline (66 base runs + 1 S+1)

**Zero `saved-unconfirmed`.** Draft-first save gate validated. Turn economy: typically +1 vs v1.1 for draft→confirm flows.

| Watch-for | Verdict | Notes |
|-----------|---------|-------|
| Save gate | ✅ | No `save_rui` before user save-intent turn |
| Draft presentation | ✅ | Summary + single confirm ask on draft turns |
| Plan-only (UC1-S5) | ✅ | No validate on “don't build yet” |
| Iteration carry-forward | ✅ | D3, S+1 — scope/transitions/outcomes preserved |
| `valuePath` interview | ✅ | UC2-S1, UC3-S1 |
| HITL hold | ✅ | UC3-S4 — no validate/save until action endpoints |
| Dual-saves | ✅ | UC1-S3, UC2-S5 — single final save |
| Escape hatch | ⚠️ | Identical “validate and save” opener → 1- or 2-turn variance (D1, UC2-S2, UC3-S2) |
| Messy-data | ❌ | UC1-S4 — 0/3 clean artifacts (`sev`, epochs, assignee) |
| UC3-S6 draft gate | ⚠️ | Save gate OK; 2/3 validated on endpoints-only turn 1 |
| UC1-S3 metrics | ⚠️ | Header metric values sometimes invented vs derived from records |
| Infra | ✅ Fixed | Failed validate retry 422 — `normalizeWireMessages` |

**Unstable artifact shape (not save gate):** UC1-S3, UC1-S4.

---

## Shipped from exploration

- **Prompt v1.2** — draft-first gate, plan-only mode, valuePath / HITL rules (`agent/prompts/v1.2.txt`)
- **Observe** — `AgentSessionState`, Draft funnel, env + cost columns
- **Eval cases** — 3 canonical + 2 **7.5** blockers; `eval:run` green on prompt v1.2 + Terra locally
- **Harness** — `resolveRunState` (`no_save` → FAIL), concise CLI, `browseFilter` / `forbiddenEmbeddedAction` assertions

Details: [implementation plan — agent draft-first and eval harness](rapidui-v0.2-implementation.md#agent-draft-first-and-eval-harness).

---

## Open / optional

| Item | Source |
|------|--------|
| Prompt tweaks — messy-data semantics (UC1-S4) | v1.2 re-run rule 5 |
| Interview before draft on endpoints-only openers (UC3-S6) | UC3-S6 draft gate 2/3 |
| Escape-hatch consistency on identical openers | D1, UC2-S2, UC3-S2 |
| Derive header metrics from static records (UC1-S3) | UC1-S3.2 |
| `role` as `select` when enum known | UC2-S4 |
| D1 / D3 eval variant JSONs; S+1 UC1 + UC3 | Optional 7.5 |
| Terra default flip after **7.7** matrix | ✅ Done — **`gpt-5.6-terra`** is code default (2026-08-12) |

---

## Evidence tooling

```bash
npm run fetch:exploration-evidence -- {sessionId} {runId}
```

Observe for validate/error counts; transcript + saved spec for quality. Pre-**7.4**: debug via `sessionId` + `npm run eval:run -- --json`. Phase **7.4**: failures persist in `eval_trials`.
