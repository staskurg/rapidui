# Chat transcript API

Persist and restore full Vercel AI SDK wire-format `messages[]` for live `/chat` sessions. Stored on `agent_runs.transcript_jsonb` (migration `009`).

**Related:** [chat-session-persistence-plan.md](../../.cursor/chat-session-persistence-plan.md) · `lib/chat/transcriptSchema.ts` · `lib/chat/transcriptWrites.ts`

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

- `outcome` is `saved` | `failed` | `abandoned` | `null`
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

**400** — invalid JSON, empty `messages`, or Zod validation failure (`INVALID_TRANSCRIPT`).

**413** — serialized body exceeds **512 KB** (`PAYLOAD_TOO_LARGE`).

**503** — database unavailable.

---

## Message shape

Same wire format as `agent/scripts/eval_driver.py` and Phase 7.4 `eval_trials.transcript_jsonb`:

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

Validation (`transcriptPutBodySchema`):

- Each message: `id` (non-empty), `role`, `parts` (min 1)
- Each part: `type` (non-empty string); extra fields allowed (`.loose()` — supports `step-start`, `dynamic-tool`, `reasoning`, etc.)
- PUT body: `messages` array with **min 1** message

---

## Client persistence

Live chat uses `usePersistChatTranscript` → `putChatTranscript()` after each `onFinish`:

| Event | Persist? |
|-------|----------|
| Normal completion | yes |
| Abort / disconnect | yes (keeps user message) |
| Pure error (`isError`) | no |
| New chat (prior session) | yes — flush before abandon |

Fire-and-forget PUT; failures log to console only.

---

## Auth & trust (v0.2)

- **No auth** on GET/PUT — UUID obscurity only; acceptable for internal exploration
- Client can forge transcripts — same trust model as `POST /chat` message history
- v0.3+: gate with auth and/or server-owned history

---

## UI integration

| Route | Behavior |
|-------|----------|
| `/chat` | Empty thread; no session id; no GET |
| `/chat/{sessionId}` | GET → hydrate via `useChatRuntime({ messages })` |
| Observe agent detail | Summary grid: transcript turns, updated, **Open in chat** link |

Session id is minted on **first user message** (ChatGPT-style), then URL becomes canonical.

---

## Smoke & tests

```bash
npm run smoke:chat-transcript   # DB round-trip
npm run test:eval -- lib/chat    # schema + persist logic
```

Manual: run UC1-S1 from `.cursor/chat-exploration-scenarios.md`, refresh `/chat/{sessionId}`, confirm thread + spec panel restore and Observe cross-link.
