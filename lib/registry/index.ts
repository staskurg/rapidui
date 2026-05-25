import { BINDING_DEFINITIONS, ReadBindingSchema } from "./bindings";
import { BLOCK_DEFINITIONS, BlockSchema } from "./blocks";
import {
  collectIdsFromRui,
  ID_MAX_LENGTH,
  ID_MIN_LENGTH,
  ID_PATTERN,
  isValidId,
} from "./ids";
import { LAYOUT_DEFINITIONS, PageSchema, SectionSchema } from "./layouts";
import { getPlannedPayload, PLANNED_BINDINGS, PLANNED_BLOCKS } from "./planned";
import { RuiSchema } from "./rui";
import { RULES } from "./rules";
import { REGISTRY_VERSION } from "./version";

/** Conventional file extension for RUI documents (JSON content). */
export const RUI_FILE_EXTENSION = ".rui.json";

export {
  BINDING_DEFINITIONS,
  BLOCK_DEFINITIONS,
  BlockSchema,
  collectIdsFromRui,
  ID_MAX_LENGTH,
  ID_MIN_LENGTH,
  ID_PATTERN,
  isValidId,
  LAYOUT_DEFINITIONS,
  PageSchema,
  PLANNED_BINDINGS,
  PLANNED_BLOCKS,
  ReadBindingSchema,
  REGISTRY_VERSION,
  RuiSchema,
  RULES,
  SectionSchema,
};

export { MetaSchema, NavigationItemSchema, NavigationSchema } from "./rui";
export type { Block, Metric, Table, Text } from "./blocks";
export type { Meta, Navigation, NavigationItem, Rui } from "./rui";
export type { Page, Section } from "./layouts";
export type { ReadBinding } from "./bindings";
export type { Rule, RuleCode } from "./rules";

/** Builds the JSON payload for GET /api/schema (§3). */
export function getSchemaPayload() {
  return {
    version: REGISTRY_VERSION,
    rui: {
      description:
        "A RUI is a JSON document describing an app — its screens, blocks, and data bindings.",
      fileExtension: RUI_FILE_EXTENSION,
    },
    layouts: LAYOUT_DEFINITIONS,
    blocks: BLOCK_DEFINITIONS,
    bindings: BINDING_DEFINITIONS,
    rules: RULES,
    planned: getPlannedPayload(),
    ids: {
      pattern: ID_PATTERN.source,
      minLength: ID_MIN_LENGTH,
      maxLength: ID_MAX_LENGTH,
      assignedBy: "agent",
    },
  };
}
