# Chat transcript API

Persist and restore the full Vercel AI SDK wire-format `messages[]` for live `/chat` sessions so a session survives refresh, bookmark, and Observe deep-links.

Storage: `agent_runs.transcript_jsonb` (migration `009`), keyed by the same `session_id` as agent ingest and validate/save telemetry.

**Scope:** message history only. Run outcomes, turn metrics, and token counts are written by `POST /api/observe/ingest/agent`, not this API. Either path may create the `agent_runs` row first; the other merges onto it.

**Implementation:** `lib/chat/transcriptSchema.ts` · `lib/chat/transcriptWrites.ts` · `app/api/chat/sessions/[sessionId]/transcript/route.ts`

---

## Endpoints

Base path: `/api/chat/sessions/{sessionId}/transcript`

`sessionId` must be a non-empty string (typically a UUID). Empty or whitespace-only ids return **400** `INVALID_SESSION_ID`.

### GET — load transcript

**200** — row exists:

```json
{
  "sessionId": "510e0fb2-52ee-4927-bcbb-d86f58eede43",
  "messages": [ /* Vercel AI v6 UIMessage[] */ ],
  "updatedAt": "2026-08-08T20:10:00.000Z",
  "turnCount": 3,
  "run": {
    "outcome": "saved",
    "specId": "f408e6a1-…"
  }
}
```

- `outcome` is `saved` | `failed` | `abandoned` | `null` (from `agent_runs.outcome`, set by ingest)
- `messages` may be `[]` when a row exists but no transcript has been PUT yet (e.g. agent ingest created the row first)
- `turnCount` is the stored user-message count (derived from `messages` when unset)

**404** — no `agent_runs` row (`SESSION_NOT_FOUND`). The chat UI redirects to `/chat?error=session-not-found`.

**503** — database unavailable.

### PUT — upsert full snapshot

Body:

```json
{
  "messages": [ /* full thread after turn completes */ ]
}
```

**200**:

```json
{
  "sessionId": "510e0fb2-52ee-4927-bcbb-d86f58eede43",
  "turnCount": 3,
  "updatedAt": "2026-08-08T20:10:00.000Z"
}
```

Behavior:

- Creates a minimal `agent_runs` row if missing (metrics backfill on next agent ingest)
- Replaces `transcript_jsonb` atomically (full snapshot, not append-only)
- Sets `transcript_updated_at` and `transcript_turn_count` (user role count)

**400** — invalid JSON, wrong content type, empty `messages`, or Zod validation failure (`INVALID_TRANSCRIPT`).

**413** — serialized body exceeds **512 KB** (`PAYLOAD_TOO_LARGE`).

**503** — database unavailable.

---

## Message shape

Vercel AI SDK v6 wire format (`UIMessage[]` with `parts[]`):

```json
{
  "id": "msg-uuid",
  "role": "user | assistant | system",
  "parts": [
    { "type": "text", "text": "…" },
    {
      "type": "tool-validate_rui",
      "toolCallId": "…",
      "input": {},
      "state": "output-available",
      "output": { "valid": true }
    }
  ]
}
```

Validation (`transcriptPutBodySchema` in `transcriptSchema.ts`):

- Each message: `id` (non-empty), `role`, `parts` (min 1)
- Each part: `type` (non-empty string); extra fields allowed (`.loose()` — supports `step-start`, `dynamic-tool`, `reasoning`, etc.)
- PUT body: `messages` array with **min 1** message

---

## Client persistence

Live chat uses `usePersistChatTranscript` → `putChatTranscript()` after each AI SDK `onFinish`:

| Event | Persist? |
|-------|----------|
| Normal completion | yes |
| Abort / disconnect | yes (keeps user message) |
| Pure error (`isError`) | no |
| New chat (prior session) | yes — `flushTranscript()` before abandon |

Fire-and-forget PUT; failures log to console only.

---

## Auth & trust (v0.2)

- **No auth** on GET/PUT — session id is the only gate
- Client can forge transcripts — same trust model as `POST /chat` message history
- v0.3+: gate with auth and/or server-owned history

---

## UI integration

| Route | Behavior |
|-------|----------|
| `/chat` | Empty thread; no session id; no GET |
| `/chat/{sessionId}` | GET → hydrate via `useChatRuntime({ messages })` |
| Observe agent detail | Summary grid: transcript turns, updated, **Open in chat** link |

Session id is minted on **first user message**, then the URL becomes canonical.

---

## Smoke & tests

```bash
npm run smoke:chat-transcript   # DB round-trip
npm run test:eval -- lib/chat    # schema + persist logic
```

Manual restore check:

1. Open `/chat`, send several turns until the spec panel shows a validated draft.
2. Confirm the URL is `/chat/{sessionId}`.
3. Hard refresh — thread and draft panel should restore.
4. Open the session in Observe agent detail — transcript turn count and **Open in chat** should match.
