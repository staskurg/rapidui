import { z } from "zod";

export const HttpMethodSchema = z.enum(["GET", "POST", "PATCH", "DELETE"]);

export const ReadBindingSchema = z
  .object({
    method: z.literal("GET"),
    path: z.string().min(1).startsWith("/"),
    valuePath: z.string().min(1).optional(),
    labelKey: z.string().min(1).optional(),
    valueKey: z.string().min(1).optional(),
  })
  .strict();

export const WriteBindingSchema = z
  .object({
    method: z.enum(["POST", "PATCH", "DELETE"]),
    path: z.string().min(1).startsWith("/"),
    bodyMap: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export const InvokeBindingSchema = z
  .object({
    method: z.literal("POST"),
    path: z.string().min(1).startsWith("/"),
  })
  .strict();

export const StaticDataSchema = z
  .object({
    mode: z.literal("static"),
    records: z.array(z.record(z.string(), z.unknown())).min(1),
  })
  .strict();

export const ApiDataSchema = z
  .object({
    mode: z.literal("api"),
    read: ReadBindingSchema.optional(),
    write: WriteBindingSchema.optional(),
    invoke: InvokeBindingSchema.optional(),
  })
  .strict();

export const OperationDataSchema = z.discriminatedUnion("mode", [
  StaticDataSchema,
  ApiDataSchema,
]);

export const HTTP_METHODS = HttpMethodSchema.options;

export type ReadBinding = z.infer<typeof ReadBindingSchema>;
export type WriteBinding = z.infer<typeof WriteBindingSchema>;
export type InvokeBinding = z.infer<typeof InvokeBindingSchema>;
export type OperationData = z.infer<typeof OperationDataSchema>;
