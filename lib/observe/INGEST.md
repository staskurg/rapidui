# Agent telemetry ingest contract

FastAPI on Render posts agent run/turn summaries to the platform ingest API. The LLM and tools never call this endpoint — only the FastAPI handler layer (Phase 4).

**Endpoint:** `POST /api/observe/ingest/agent`  
**Base URL:** `https://rapidui.dev` (or local dev server)  
**Auth:** none in v0.2  
**Content-Type:** `application/json`

> **Chat transcripts:** full conversation text is **not** stored via this ingest endpoint. Live `/chat` sessions use a separate application API: `GET/PUT /api/chat/sessions/{sessionId}/transcript` → `agent_runs.transcript_jsonb`. See `.cursor/chat-session-persistence-plan.md`.

## Success response

```json
{ "ok": true, "runId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8" }
```

HTTP **200** on success. HTTP **400** when Zod validation fails (`INVALID_INGEST_PAYLOAD`). HTTP **500** when Neon insert fails (`INGEST_FAILED`).

## Payload shape

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `session_id` | string | yes | Same value as `X-RapidUI-Session-Id` on validate/save API calls |
| `run` | object | no | Session summary — typically sent when run completes |
| `turns` | array | no | Per-turn metrics — may be sent after each assistant reply |

At least one of `run` or `turns` should be present on each POST (empty `{}` with only `session_id` creates/returns a minimal run row).

### `run` fields

| Field | Type | Notes |
|-------|------|-------|
| `outcome` | `"saved"` \| `"failed"` \| `"abandoned"` | Set when session ends |
| `spec_id` | UUID | Final saved spec — must exist in `specs` table (FK) |
| `validate_attempts` | int | Count of validate API calls in session |
| `model` | string | e.g. `o4-mini` |
| `provider` | string | e.g. `openai` |
| `prompt_version` | string | e.g. `v1` |
| `eval_case_id` | string | When run is part of eval matrix |
| `total_tokens` | int | Input + output tokens if available |
| `latency_ms` | int | Total run wall time |
| `intent` | string | Optional use-case label |
| `error_summary` | string | Last failure reason |
| `started_at` | ISO 8601 | Optional — defaults to first insert time |
| `finished_at` | ISO 8601 | Optional — set automatically when `outcome` sent without timestamp |

### `turns[]` fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `turn_index` | int | yes | 0-based turn index |
| `latency_ms` | int | no | LLM + tool time for this turn |
| `input_tokens` | int | no | |
| `output_tokens` | int | no | |
| `had_validate_call` | boolean | no | Default `false` |
| `had_save` | boolean | no | Default `false` |

## Upsert behavior

- **`agent_runs`:** `session_id` is UNIQUE. Repeated POSTs merge non-null `run` fields into the same row. `started_at` is preserved on conflict.
- **Outcome downgrade guard:** `outcome = 'saved'` is never overwritten by `'abandoned'` on upsert.
- **`agent_turns`:** `(run_id, turn_index)` is UNIQUE. Re-posting a turn overwrites metrics.
- If only `turns[]` is sent, a minimal `agent_runs` row is created for `session_id` first.

## Client abandon (New chat exception)

The LLM and tools never call this endpoint. **Exception:** the main UI may POST a terminal **`abandoned`** outcome for the **previous** session id when the user confirms New chat (before minting a new session id):

```json
{
  "session_id": "<prior-session-id>",
  "run": { "outcome": "abandoned" }
}
```

Skip when the thread is empty or the panel already saved. Fire-and-forget — chat UX must not block on ingest.

## Terminal outcomes

| Outcome | When |
|---------|------|
| `saved` | Turn completes with successful `save_rui` |
| `failed` | Unrecoverable tool/handler error with no save (not normal validate retries) |
| `abandoned` | New chat rotation, eval runner timeout, or explicit client POST |

When `outcome` is set without `finished_at`, the platform sets `finished_at` to the ingest time.

## Examples

### End-of-session summary

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "run": {
    "outcome": "saved",
    "spec_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "validate_attempts": 2,
    "model": "o4-mini",
    "provider": "openai",
    "prompt_version": "v1",
    "total_tokens": 4200,
    "latency_ms": 18500,
    "finished_at": "2026-07-18T20:15:00.000Z"
  }
}
```

### Per-turn update

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "turns": [
    {
      "turn_index": 0,
      "latency_ms": 3200,
      "input_tokens": 800,
      "output_tokens": 450,
      "had_validate_call": true,
      "had_save": false
    }
  ]
}
```

### Combined

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "run": { "outcome": "saved", "validate_attempts": 1 },
  "turns": [
    { "turn_index": 0, "latency_ms": 5000, "had_validate_call": true, "had_save": true }
  ]
}
```

## Zod schema (TypeScript)

Canonical schema: `lib/observe/schemas.ts` → `agentIngestPayloadSchema`.

## Related

- Validate/save telemetry headers: `GET /api/docs` → `telemetry` section
- API events (all agents): written in-process on `POST /api/validate` and `POST /api/specs`
