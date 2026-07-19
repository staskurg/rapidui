import { z } from "zod";

export const OutcomeNavigateSchema = z
  .object({
    navigate: z.string().min(1),
  })
  .strict();

export const OutcomeStaySchema = z
  .object({
    stay: z.literal(true),
  })
  .strict();

export const MutatingOutcomesSchema = z
  .object({
    success: OutcomeNavigateSchema,
    error: OutcomeStaySchema,
    cancel: z.union([OutcomeNavigateSchema, OutcomeStaySchema]),
  })
  .strict();

export const EmbeddedActionOutcomesSchema = z
  .object({
    success: OutcomeNavigateSchema,
    error: OutcomeStaySchema,
  })
  .strict();

export type OutcomeNavigate = z.infer<typeof OutcomeNavigateSchema>;
export type OutcomeStay = z.infer<typeof OutcomeStaySchema>;
export type MutatingOutcomes = z.infer<typeof MutatingOutcomesSchema>;
export type EmbeddedActionOutcomes = z.infer<typeof EmbeddedActionOutcomesSchema>;
