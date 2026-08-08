import { randomUUID } from "node:crypto";

import {
  countUserTurns,
  transcriptPutBodySchema,
} from "../lib/chat/transcriptSchema";
import { getChatTranscript, upsertChatTranscript } from "../lib/chat/transcriptWrites";
import { sql } from "../lib/db/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const sampleMessages = transcriptPutBodySchema.parse({
  messages: [
    {
      id: "m-user-smoke",
      role: "user",
      parts: [{ type: "text", text: "Smoke test message." }],
    },
    {
      id: "m-asst-smoke",
      role: "assistant",
      parts: [
        { type: "text", text: "Smoke test reply.", state: "done" },
        {
          type: "tool-validate_rui",
          toolCallId: "tc-smoke",
          input: {},
          state: "output-available",
          output: { valid: true },
        },
      ],
    },
  ],
}).messages;

async function runSmokeChatTranscript(): Promise<void> {
  const sessionId = `smoke-chat-transcript-${randomUUID()}`;

  const missing = await getChatTranscript(sessionId);
  assert(missing === null, "Missing row should return null");

  const upserted = await upsertChatTranscript(sessionId, sampleMessages);
  assert(upserted.turnCount === 1, "Upsert should count one user turn");
  assert(Boolean(upserted.updatedAt), "Upsert should return updatedAt");

  const loaded = await getChatTranscript(sessionId);
  assert(loaded !== null, "Loaded transcript should exist after upsert");
  assert(loaded.messages.length === 2, "Loaded transcript should have two messages");
  assert(loaded.turnCount === 1, "Loaded turnCount should match user messages");
  assert(
    countUserTurns(loaded.messages) === 1,
    "Derived user turn count should match stored count",
  );
  assert(
    loaded.messages[1]?.parts.some((part) => part.type === "tool-validate_rui"),
    "Tool parts should round-trip through JSONB",
  );

  await sql`DELETE FROM agent_runs WHERE session_id = ${sessionId}`;

  console.log("smoke:chat-transcript passed");
}

runSmokeChatTranscript().catch((error: unknown) => {
  console.error("smoke:chat-transcript failed:", error);
  process.exit(1);
});
