import type { RuleCode } from "@/lib/operations";

export type { RuleCode };

export type ErrorContext = {
  id?: string;
  operationId?: string;
  entityId?: string;
  prop?: string;
  field?: string;
  transitionIndex?: number;
  from?: string;
  to?: string;
  trigger?: string;
  param?: string;
  path?: string;
};

export const ERROR_CATALOG: Record<RuleCode, { message: string; hint: string }> = {
  INVALID_JSON: {
    message: "Request body must be valid JSON.",
    hint: "Send Content-Type: application/json with the spec object as the raw body.",
  },
  MISSING_SESSION_ID: {
    message:
      "X-RapidUI-Session-Id is required on this endpoint. Read GET /llms.txt for session rules.",
    hint: "Generate once per session: uuidgen (or crypto.randomUUID). Send on every request after llms.txt.",
  },
  VERSION_MISMATCH: {
    message: 'RUI version must be "0.2".',
    hint: 'Set `version` to `"0.2"`. v0.1 page/block documents are not supported.',
  },
  DUPLICATE_ID: {
    message: 'Duplicate id "{id}".',
    hint: "Each entity, operation, and embedded action id must be unique across the spec.",
  },
  INVALID_ID_FORMAT: {
    message: 'Invalid id "{id}".',
    hint: "Use lowercase kebab-case: `^[a-z][a-z0-9-]*$`, 1–64 chars (e.g. `op-browse-users`).",
  },
  UNKNOWN_TYPE: {
    message: 'Unknown operation type "{prop}".',
    hint: "Use browse, read, create, update, or delete.",
  },
  MISSING_REQUIRED_PROP: {
    message: 'Missing required property "{prop}".',
    hint: "See GET /api/schema for required fields per operation type.",
  },
  INVALID_PROP_TYPE: {
    message: 'Invalid value for "{prop}".',
    hint: "Check type and allowed enum values in GET /api/schema.",
  },
  UNKNOWN_PROP: {
    message: 'Unknown property "{prop}".',
    hint: "Remove extra properties; v0.2 uses strict schemas.",
  },
  INVALID_TRANSITION_REF: {
    message: 'Transition references unknown operation "{prop}".',
    hint: "Set from/to to existing operation ids.",
  },
  INVALID_ENTITY_REF: {
    message: 'Operation "{operationId}" references unknown entity "{entityId}".',
    hint: "Set entityId to an existing entities[].id and list the operation in entity.operationIds.",
  },
  INVALID_TRANSITION_TRIGGER: {
    message: 'Invalid transition trigger "{trigger}" on {from} → {to}.',
    hint: "Use row (browse→read), link, cta (browse→create), or cancel (form back).",
  },
  INVALID_TRANSITION_MAP: {
    message: 'Transition map key "{param}" is invalid for {from} → {to}.',
    hint: "Map keys must match target params; values must match browse column keys.",
  },
  MISSING_DATA_BINDING: {
    message: 'Operation "{operationId}" is missing a required data binding.',
    hint: "api mode: browse/read need read; create/delete need write; update needs read+write.",
  },
  STATIC_API_CONFLICT: {
    message: 'Operation "{operationId}" uses static mode but declares API bindings.',
    hint: "Use data.mode static with records only, or api with bindings — not both.",
  },
  ROUTE_PARAM_MISMATCH: {
    message: 'Operation "{operationId}" route placeholders do not match params[].',
    hint: "Every {param} in route must appear in params[] and vice versa.",
  },
  INVALID_FORM_FIELD: {
    message: 'Invalid form field on operation "{operationId}".',
    hint: "Field names must be unique; select fields need options; bodyMap keys must match field names.",
  },
  INVALID_EMBEDDED_ACTION: {
    message: 'Embedded action on operation "{operationId}" is invalid.',
    hint: "Only read.presentation.actions[] supports act and delete with invoke/write bindings.",
  },
  INVALID_DELETE_METHOD: {
    message: 'Delete binding on "{operationId}" must use method DELETE.',
    hint: 'Set write.method or embedded delete write.method to "DELETE".',
  },
  INVALID_BREADCRUMB: {
    message: 'Invalid breadcrumb on operation "{operationId}".',
    hint: "Breadcrumb belongs on read/update only; operation must reference a reachable browse or entrypoint.",
  },
  ORPHAN_OPERATION: {
    message: 'Operation "{operationId}" is unreachable from entity entrypoints.',
    hint: "Add transitions from entrypoints or list as entities[].entrypoints.",
  },
  MISSING_ROUTE: {
    message: 'Operation "{operationId}" must declare route and matching params.',
    hint: "Every operation needs route; params[] must match {placeholders} in route.",
  },
  MISSING_OUTCOME: {
    message: 'Operation "{operationId}" is missing required outcomes.',
    hint: "Mutations need success, error, cancel; embedded actions need success and error.",
  },
  MISSING_CTA_TRANSITION: {
    message: 'Entity "{entityId}" has browse and create but no cta transition.',
    hint: "Add transitions[] with trigger cta from browse to create.",
  },
  SCOPE_PLACEHOLDER_MISSING: {
    message: 'Operation "{operationId}" must reference scope placeholder {param}.',
    hint: "Use {scope.<selectorId>} in API paths when the entity declares scope.selectors.",
  },
  SCOPE_SELECTOR_MISSING: {
    message: 'Entity "{entityId}" uses scope placeholder {param} but has no matching scope.selectors entry.',
    hint: "Declare scope.selectors[] on the entity with id matching the placeholder (e.g. companyId for {scope.companyId}).",
  },
  INVALID_COLUMNS: {
    message: 'Browse operation "{operationId}" must have at least one column with unique keys.',
    hint: "Define presentation.columns[] with unique key per column.",
  },
  INVALID_FILTER_FIELD: {
    message: 'Filter field "{field}" on "{operationId}" does not match a column key.',
    hint: "Set filter.field to an existing column key.",
  },
};

function interpolate(template: string, context: ErrorContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof ErrorContext) => {
    const value = context[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

export function formatError(
  code: RuleCode,
  context: ErrorContext = {},
): { message: string; hint: string } {
  const template = ERROR_CATALOG[code];
  return {
    message: interpolate(template.message, context),
    hint: interpolate(template.hint, context),
  };
}
