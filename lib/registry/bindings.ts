import { z } from "zod";

/** Dot-segments only — no JSONPath (R23). */
export const VALUE_PATH_PATTERN =
  /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

export const ReadBindingSchema = z
  .object({
    type: z.literal("read"),
    method: z.literal("GET"),
    path: z.string().min(1).startsWith("/"),
    valuePath: z.string().regex(VALUE_PATH_PATTERN).optional(),
  })
  .strict();

export type ReadBinding = z.infer<typeof ReadBindingSchema>;

export const BINDING_DEFINITIONS = [
  {
    type: "read",
    description: "Fetch data via GET",
    props: [
      { name: "type", type: "literal", value: "read", required: true },
      { name: "method", type: "literal", value: "GET", required: true },
      { name: "path", type: "string", required: true, notes: "Must start with /" },
      {
        name: "valuePath",
        type: "string",
        required: false,
        notes: "Dot-path into JSON response; required for Metric",
      },
    ],
  },
] as const;
