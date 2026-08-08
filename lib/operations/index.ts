import { ID_MAX_LENGTH, ID_MIN_LENGTH, ID_PATTERN } from "./ids";
import { RULES } from "./rules";
import { getSchemaExamples, getSchemaShapes } from "./schema-payload";
import { RuiSchema } from "./rui";
import { RUI_FILE_EXTENSION, SCHEMA_VERSION } from "./version";

export {
  collectIdsFromRui,
  extractPathParams,
  ID_MAX_LENGTH,
  ID_MIN_LENGTH,
  ID_PATTERN,
  isValidId,
} from "./ids";
export { RUI_FILE_EXTENSION, SCHEMA_VERSION };
export { RuiSchema, RULES };
export type { RuleCode, Rule } from "./rules";
export type { Rui, App } from "./rui";
export type { Entity, ScopeSelector } from "./entities";
export type { Operation, EmbeddedAction } from "./operations";
export {
  ACTION_VARIANTS,
  COLUMN_FORMATS,
  DETAIL_FIELD_FORMATS,
  FORM_FIELD_TYPES,
} from "./operations";
export type { Transition, TransitionTrigger } from "./transitions";
export {
  CRUD_ILLUSTRATION_SPEC,
  HITL_ILLUSTRATION_SPEC,
  STATIC_BROWSE_ILLUSTRATION_SPEC,
  getSchemaExamples,
  getSchemaShapes,
} from "./schema-payload";

/** Alias for API responses — same value as SCHEMA_VERSION. */
export const REGISTRY_VERSION = SCHEMA_VERSION;

/** Builds the JSON payload for GET /api/schema (reference §7). */
export function getSchemaPayload() {
  return {
    version: SCHEMA_VERSION,
    rui: {
      description:
        "A RUI is a JSON workflow document — entities, operations, transitions, and data bindings. Not React code.",
      fileExtension: RUI_FILE_EXTENSION,
      topLevel: ["version", "app", "entities", "operations", "transitions"],
    },
    entities: {
      description: "Domain umbrellas grouping related operations and nav entrypoints.",
      required: ["id", "label", "entrypoints", "operationIds"],
      optional: ["scope.selectors"],
    },
    operationTypes: {
      browse: { presentation: "table", data: "read GET or static records" },
      read: { presentation: "detail", data: "read GET or static", embeddedActions: true },
      create: { presentation: "form", data: "write POST", outcomes: true },
      update: { presentation: "form", data: "read + write PATCH", outcomes: true },
      delete: { presentation: "confirm", data: "write DELETE", outcomes: true },
    },
    presentationLayouts: ["table", "form", "detail", "confirm"],
    transitionTriggers: ["row", "link", "cta", "cancel"],
    dataModes: ["static", "api"],
    embeddedActionTypes: ["act", "delete"],
    flowPatterns: {
      crud: "browse → read → update; cta browse→create; cancel on forms; embedded delete on read",
      hitlReview: "browse → read + embedded act actions with outcomes",
      staticDashboard: "browse static + optional header.metrics",
    },
    shapes: getSchemaShapes(),
    rules: RULES,
    ids: {
      pattern: ID_PATTERN.source,
      minLength: ID_MIN_LENGTH,
      maxLength: ID_MAX_LENGTH,
      entityPrefix: "ent-",
      operationPrefix: "op-",
    },
    examples: getSchemaExamples(),
  };
}
