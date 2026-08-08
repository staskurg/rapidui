import { z } from "zod";

export const TransitionTriggerSchema = z.enum(["row", "link", "cta", "cancel"]);

export const TransitionSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    trigger: TransitionTriggerSchema,
    label: z.string().min(1).optional(),
    placement: z.string().min(1).optional(),
    map: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const TRANSITION_TRIGGERS = TransitionTriggerSchema.options;

export type Transition = z.infer<typeof TransitionSchema>;
export type TransitionTrigger = z.infer<typeof TransitionTriggerSchema>;
