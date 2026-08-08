import { z } from "zod";

/** Max serialized PUT body size (512 KB — generous for exploration sessions). */
export const TRANSCRIPT_MAX_BYTES = 512 * 1024;

/** Any AI SDK message part (text, reasoning, tool-*, dynamic-tool, step-start, data-*, …). */
const messagePartSchema = z
  .object({
    type: z.string().min(1),
  })
  .loose();

/** Vercel AI SDK wire-format message (live /chat + eval_driver.py). */
export const uiMessageSchema = z
  .object({
    id: z.string().min(1),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(messagePartSchema).min(1),
  })
  .loose();

export const transcriptMessagesSchema = z.array(uiMessageSchema);

export const transcriptPutBodySchema = z.object({
  messages: transcriptMessagesSchema.min(1),
});

export type UIMessageWire = z.infer<typeof uiMessageSchema>;
export type TranscriptPutBody = z.infer<typeof transcriptPutBodySchema>;

export function countUserTurns(messages: UIMessageWire[]): number {
  return messages.filter((message) => message.role === "user").length;
}

export function transcriptPutByteLength(messages: UIMessageWire[]): number {
  return Buffer.byteLength(JSON.stringify({ messages }), "utf8");
}

export function isTranscriptPayloadTooLarge(messages: UIMessageWire[]): boolean {
  return transcriptPutByteLength(messages) > TRANSCRIPT_MAX_BYTES;
}

/** Non-empty session id from route param or header. */
export function parseChatSessionId(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}
