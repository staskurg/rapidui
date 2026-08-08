import { sql } from "@/lib/db/client";

import {
  countUserTurns,
  type UIMessageWire,
} from "./transcriptSchema";

export type TranscriptRunMeta = {
  outcome: "saved" | "failed" | "abandoned" | null;
  specId: string | null;
};

export type ChatTranscriptRecord = {
  sessionId: string;
  messages: UIMessageWire[];
  updatedAt: string | null;
  turnCount: number;
  run: TranscriptRunMeta;
};

function parseOutcome(value: unknown): TranscriptRunMeta["outcome"] {
  if (value === "saved" || value === "failed" || value === "abandoned") {
    return value;
  }
  return null;
}

function parseMessages(value: unknown): UIMessageWire[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as UIMessageWire[];
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return null;
}

/** Load transcript for a session. Returns null when no agent_runs row exists. */
export async function getChatTranscript(
  sessionId: string,
): Promise<ChatTranscriptRecord | null> {
  const result = await sql`
    SELECT
      session_id,
      transcript_jsonb,
      transcript_updated_at,
      transcript_turn_count,
      outcome,
      spec_id
    FROM agent_runs
    WHERE session_id = ${sessionId}
    LIMIT 1
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const transcript = row.transcript_jsonb;
  const messages = parseMessages(transcript);

  return {
    sessionId,
    messages,
    updatedAt: toIsoString(row.transcript_updated_at),
    turnCount:
      typeof row.transcript_turn_count === "number"
        ? row.transcript_turn_count
        : countUserTurns(messages),
    run: {
      outcome: parseOutcome(row.outcome),
      specId: typeof row.spec_id === "string" ? row.spec_id : null,
    },
  };
}

/** Upsert full transcript snapshot; creates a minimal agent_runs row if needed. */
export async function upsertChatTranscript(
  sessionId: string,
  messages: UIMessageWire[],
): Promise<{ sessionId: string; turnCount: number; updatedAt: string }> {
  const turnCount = countUserTurns(messages);
  const transcriptJson = JSON.stringify(messages);

  const result = await sql`
    INSERT INTO agent_runs (
      session_id,
      transcript_jsonb,
      transcript_updated_at,
      transcript_turn_count
    )
    VALUES (
      ${sessionId},
      ${transcriptJson}::jsonb,
      NOW(),
      ${turnCount}
    )
    ON CONFLICT (session_id) DO UPDATE SET
      transcript_jsonb = EXCLUDED.transcript_jsonb,
      transcript_updated_at = EXCLUDED.transcript_updated_at,
      transcript_turn_count = EXCLUDED.transcript_turn_count
    RETURNING transcript_updated_at
  `;

  const updatedAt = toIsoString(result.rows[0]?.transcript_updated_at);
  if (!updatedAt) {
    throw new Error("Expected transcript_updated_at from upsert");
  }

  return { sessionId, turnCount, updatedAt };
}
