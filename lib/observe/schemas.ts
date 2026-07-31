import { z } from "zod";

export const POST_ENDPOINTS = ["/api/validate", "/api/specs"] as const;

export const DISCOVERY_ENDPOINTS = [
  "/llms.txt",
  "/api/docs",
  "/api/schema",
  "/api/health",
] as const;

export const API_ENDPOINTS = [...POST_ENDPOINTS, ...DISCOVERY_ENDPOINTS] as const;

export type PostEndpoint = (typeof POST_ENDPOINTS)[number];
export type DiscoveryEndpoint = (typeof DISCOVERY_ENDPOINTS)[number];
export type ApiEndpoint = (typeof API_ENDPOINTS)[number];

export const apiEventInputSchema = z.object({
  endpoint: z.enum(API_ENDPOINTS),
  session_id: z.string().nullable(),
  agent: z.string().nullable(),
  eval_case_id: z.string().nullable(),
  intent: z.string().nullable(),
  valid: z.boolean().nullable(),
  error_codes: z.array(z.string()).nullable(),
  spec_id: z.string().uuid().nullable(),
  duration_ms: z.number().int().nonnegative(),
  http_status: z.number().int().nullable().optional(),
});

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

export type ApiEventInput = z.infer<typeof apiEventInputSchema>;
export type AgentIngestPayload = z.infer<typeof agentIngestPayloadSchema>;
export type AgentRunPayload = z.infer<typeof agentRunPayloadSchema>;
export type AgentTurnPayload = z.infer<typeof agentTurnPayloadSchema>;
