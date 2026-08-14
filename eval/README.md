# Eval harness

Repeatable proof that agents can traverse **validate → save** against deterministic success criteria.

v0.1 case `support-dashboard-v0.1` is **retired**; v0.2 cases are operations-shaped only.

## Cases

| Case ID | Use case |
|---------|----------|
| `static-browse-v0.2` | UC1 — static browse table |
| `crud-admin-v0.2` | UC2 — CRUD admin |
| `ai-review-queue-v0.2` | UC3 — AI review queue |
| `spec-update-v0.2` | UC4 — optional; blocked until `load_spec` ships |

Case definitions: `eval/cases/*.json`

Golden RUI references: `lib/operations/golden/UC*-*.rui.json`

## Two paths

| Path | Who runs the agent | CLI entry |
|------|-------------------|-----------|
| **A** — browser / guided | RapidUI Agent via eval driver | `npm run eval:run` |
| **B** — external | Cursor, Claude, Codex with curl only | `npm run eval:prompt` → `npm run eval:log` |

Both paths use the same deterministic grader (`lib/eval/scoreRun.ts`).

## Path A — automated (`eval:run`)

Requires local stack (platform + agent) with `DATABASE_URL` in `.env.local`.

```bash
npm run eval:run
npm run eval:run -- --case=static-browse-v0.2
npm run eval:run -- --dry-run      # validate cases only
npm run eval:run -- --json         # full trial JSON (debugging)
npm run eval:run -- --no-persist   # skip eval_trials write (debug only)
```

Uses `agent/scripts/eval_driver.py` — **not** `chat_cli.py` (which drops tool parts). See [agent/README.md](../agent/README.md#guided-eval-driver-phase-73).

Each trial is persisted to **`eval_trials`** (append-only): config snapshot, pass/fail, assertion breakdown, process metrics, and full **`transcript_jsonb`** (user messages + assistant tool calls). Review trials at **`/observe/evals`** — list, filters, and per-trial detail with transcript. Join via `session_id` to Observe Agent/API sessions.

Path B manual runs still use **`eval_runs`** (+ optional `session_id` for Observe cross-link).

## Path B — external agent (manual)

Proves the public API is agent-agnostic. Process profile is single-shot.

```bash
# 1. Generate prompt (pick case + env)
npm run eval:prompt -- --case=crud-admin-v0.2 --env=prod

# 2. Run in an empty directory — Cursor, Claude CLI, or Codex with curl only
#    Use the SESSION_ID and X-RapidUI-* headers from the prompt.

# 3. After save, log from this repo (scores + inserts eval_runs)
npm run eval:log -- \
  --specId=<uuid> \
  --case=crud-admin-v0.2 \
  --agent=cursor \
  --validate-count=<n> \
  --session-id=<SESSION_ID>

# 4. Open viewUrl; find session in Observe
open "https://rapidui.dev/observe/api?session=<SESSION_ID>"
```

Repeat for `static-browse-v0.2` and `ai-review-queue-v0.2` when verifying ship criteria **S7** / **S8**.

Manual runner docs:

- [eval/manual/cursor/README.md](manual/cursor/README.md)
- [eval/manual/claude/README.md](manual/claude/README.md)
- [eval/manual/codex/README.md](manual/codex/README.md)

## Scoring only (no DB insert)

```bash
npm run eval:score -- --specId=<uuid> --case=crud-admin-v0.2 --validate-count=3
```

## Local workflow with stdin

Use `--env=local` with `npm run dev`. Agent prints `---EVAL_RESULT---` for optional notes. Pipe to `eval:log --stdin`:

```bash
npm run eval:log -- --stdin --case=crud-admin-v0.2 --agent=cursor
```

## Prod workflow summary

1. `npm run eval:prompt -- --case=<case> --env=prod`
2. Run agent in empty dir with generated headers
3. Optional: review `view_url` in browser
4. `npm run eval:log` from this repo

## Related

- Grader implementation: `lib/eval/scoreRun.ts`
- Ship criteria S7/S8: [docs/OPERATIONS.md](../docs/OPERATIONS.md#v02-ship-criteria-s1s9)
- Agent discovery for external agents: [rapidui.dev/llms.txt](https://rapidui.dev/llms.txt)
