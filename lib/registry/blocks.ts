import { z } from "zod";

import { ReadBindingSchema, VALUE_PATH_PATTERN } from "./bindings";

const ColumnTypeSchema = z.enum(["string", "number", "date", "badge"]);

export const ColumnSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: ColumnTypeSchema.optional(),
  })
  .strict();

export const TableFilterOptionSchema = z
  .object({
    value: z.string(),
    label: z.string().min(1),
  })
  .strict();

export const TableFilterSchema = z
  .object({
    field: z.string().min(1),
    label: z.string().min(1),
    options: z.array(TableFilterOptionSchema).min(1),
  })
  .strict();

export const MetricSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("Metric"),
    label: z.string().min(1),
    binding: ReadBindingSchema.extend({
      valuePath: z.string().regex(VALUE_PATH_PATTERN),
    }),
    format: z.enum(["number", "text"]).optional(),
  })
  .strict();

export const TableSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("Table"),
    title: z.string().optional(),
    binding: ReadBindingSchema,
    columns: z.array(ColumnSchema).min(1),
    filter: TableFilterSchema.optional(),
  })
  .strict();

export const TextSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("Text"),
    content: z.string(),
  })
  .strict();

export const BlockSchema = z.discriminatedUnion("type", [
  MetricSchema,
  TableSchema,
  TextSchema,
]);

export type Column = z.infer<typeof ColumnSchema>;
export type TableFilter = z.infer<typeof TableFilterSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Table = z.infer<typeof TableSchema>;
export type Text = z.infer<typeof TextSchema>;
export type Block = z.infer<typeof BlockSchema>;

export const BLOCK_DEFINITIONS = [
  {
    type: "Metric",
    description: "Single numeric or text KPI",
    props: [
      { name: "id", type: "string", required: true },
      { name: "type", type: "literal", value: "Metric", required: true },
      { name: "label", type: "string", required: true },
      { name: "binding", type: "ReadBinding", required: true, notes: "valuePath required" },
      { name: "format", type: "enum", values: ["number", "text"], required: false },
    ],
  },
  {
    type: "Table",
    description: "Tabular list with optional static filter",
    props: [
      { name: "id", type: "string", required: true },
      { name: "type", type: "literal", value: "Table", required: true },
      { name: "title", type: "string", required: false },
      { name: "binding", type: "ReadBinding", required: true },
      { name: "columns", type: "Column[]", required: true },
      { name: "filter", type: "TableFilter", required: false },
    ],
  },
  {
    type: "Text",
    description: "Static copy",
    props: [
      { name: "id", type: "string", required: true },
      { name: "type", type: "literal", value: "Text", required: true },
      { name: "content", type: "string", required: true },
    ],
  },
] as const;
