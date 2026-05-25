import { z } from "zod";

import { PageSchema } from "./layouts";
import { REGISTRY_VERSION } from "./version";

/** App-level metadata (whole application, not a single page). */
export const MetaSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
  })
  .strict();

export const NavigationItemSchema = z
  .object({
    pageId: z.string().min(1),
    label: z.string().min(1),
  })
  .strict();

export const NavigationSchema = z
  .object({
    items: z.array(NavigationItemSchema).min(1),
  })
  .strict();

/** Root schema for a RUI — JSON document with version, meta, navigation, and pages. */
export const RuiSchema = z
  .object({
    version: z.literal(REGISTRY_VERSION),
    meta: MetaSchema,
    navigation: NavigationSchema,
    pages: z.array(PageSchema).min(1),
  })
  .strict();

export type Meta = z.infer<typeof MetaSchema>;
export type NavigationItem = z.infer<typeof NavigationItemSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type Rui = z.infer<typeof RuiSchema>;
