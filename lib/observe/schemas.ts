import { z } from "zod";

const agentRunPayloadSchema = z.object({
  outcome: z.enum(["saved", "failed", "abandoned"]).optional(),
  spec_id: z.string().uuid().optional(),
  validate_attempts: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  prompt_version: z.string().optional(),
  eval_case_id: z.string().optional(),
  total_tokens: z.number().int().nonnegative().optional(),
  latency_ms: z.number().int().nonnegative().optional(),
  intent: z.string().optional(),
  error_summary: z.string().optional(),
  started_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

const agentTurnPayloadSchema = z.object({
  turn_index: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative().optional(),
  input_tokens: z.number().int().nonnegative().optional(),
  output_tokens: z.number().int().nonnegative().optional(),
  had_validate_call: z.boolean().optional(),
  had_save: z.boolean().optional(),
});

export const agentIngestPayloadSchema = z.object({
  session_id: z.string().min(1),
  run: agentRunPayloadSchema.optional(),
  turns: z.array(agentTurnPayloadSchema).optional(),
});

export type AgentIngestPayload = z.infer<typeof agentIngestPayloadSchema>;
export type AgentRunPayload = z.infer<typeof agentRunPayloadSchema>;
export type AgentTurnPayload = z.infer<typeof agentTurnPayloadSchema>;
