import { z } from "zod";

import { BlockSchema } from "./blocks";

export const SectionSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("Section"),
    title: z.string().optional(),
    direction: z.enum(["stack", "row"]),
    children: z.array(BlockSchema).min(1),
  })
  .strict();

export const PageSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("Page"),
    title: z.string().min(1),
    description: z.string().optional(),
    children: z.array(SectionSchema).min(1),
  })
  .strict();

export type Section = z.infer<typeof SectionSchema>;
export type Page = z.infer<typeof PageSchema>;

export const LAYOUT_DEFINITIONS = [
  {
    type: "Page",
    description: "Screen container — one per routable screen",
    props: [
      { name: "id", type: "string", required: true },
      { name: "type", type: "literal", value: "Page", required: true },
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: false },
      { name: "children", type: "Section[]", required: true },
    ],
  },
  {
    type: "Section",
    description: "Grouping container for blocks",
    props: [
      { name: "id", type: "string", required: true },
      { name: "type", type: "literal", value: "Section", required: true },
      { name: "title", type: "string", required: false },
      { name: "direction", type: "enum", values: ["stack", "row"], required: true },
      { name: "children", type: "Block[]", required: true },
    ],
  },
] as const;
