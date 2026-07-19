import { z } from "zod";

import { EntitySchema } from "./entities";
import { OperationSchema } from "./operations";
import { TransitionSchema } from "./transitions";
import { SCHEMA_VERSION } from "./version";

export const AppSchema = z
  .object({
    title: z.string().min(1),
  })
  .strict();

export const RuiSchema = z
  .object({
    version: z.literal(SCHEMA_VERSION),
    app: AppSchema,
    entities: z.array(EntitySchema).min(1),
    operations: z.array(OperationSchema).min(1),
    transitions: z.array(TransitionSchema),
  })
  .strict();

export type App = z.infer<typeof AppSchema>;
export type Rui = z.infer<typeof RuiSchema>;
