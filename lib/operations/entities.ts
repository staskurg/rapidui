import { z } from "zod";

import { ReadBindingSchema } from "./data";

export const ScopeSelectorSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.literal("select"),
    required: z.boolean(),
    binding: z
      .object({
        read: ReadBindingSchema,
      })
      .strict(),
  })
  .strict();

export const EntitySchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    entrypoints: z.array(z.string().min(1)).min(1),
    operationIds: z.array(z.string().min(1)).min(1),
    scope: z
      .object({
        selectors: z.array(ScopeSelectorSchema).min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

export type Entity = z.infer<typeof EntitySchema>;
export type ScopeSelector = z.infer<typeof ScopeSelectorSchema>;
