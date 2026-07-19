/** Validation error codes for operations-first RUI v0.2. */
export type RuleCode =
  | "INVALID_JSON"
  | "MISSING_SESSION_ID"
  | "VERSION_MISMATCH"
  | "MISSING_REQUIRED_PROP"
  | "DUPLICATE_ID"
  | "INVALID_ID_FORMAT"
  | "UNKNOWN_TYPE"
  | "INVALID_PROP_TYPE"
  | "UNKNOWN_PROP"
  | "INVALID_TRANSITION_REF"
  | "INVALID_ENTITY_REF"
  | "INVALID_TRANSITION_TRIGGER"
  | "INVALID_TRANSITION_MAP"
  | "MISSING_DATA_BINDING"
  | "STATIC_API_CONFLICT"
  | "ROUTE_PARAM_MISMATCH"
  | "INVALID_FORM_FIELD"
  | "INVALID_EMBEDDED_ACTION"
  | "INVALID_DELETE_METHOD"
  | "INVALID_BREADCRUMB"
  | "ORPHAN_OPERATION"
  | "MISSING_ROUTE"
  | "MISSING_OUTCOME"
  | "MISSING_CTA_TRANSITION"
  | "SCOPE_PLACEHOLDER_MISSING"
  | "INVALID_COLUMNS"
  | "INVALID_FILTER_FIELD";

export type Rule = {
  id: string;
  code: RuleCode;
  description: string;
};

/** Semantic validation rules O1–O20 (reference §7). */
export const RULES: Rule[] = [
  { id: "O1", code: "VERSION_MISMATCH", description: 'version must equal "0.2"' },
  { id: "O2", code: "DUPLICATE_ID", description: "Every entity and operation id must be unique" },
  {
    id: "O3",
    code: "INVALID_TRANSITION_REF",
    description: "transition.from and transition.to must reference existing operations",
  },
  {
    id: "O4",
    code: "INVALID_ENTITY_REF",
    description: "operation.entityId and entities[].operationIds must be consistent",
  },
  {
    id: "O5",
    code: "INVALID_TRANSITION_TRIGGER",
    description: "trigger: row only from browse operations",
  },
  {
    id: "O6",
    code: "INVALID_TRANSITION_MAP",
    description: "transition.map values must match browse column keys",
  },
  {
    id: "O7",
    code: "MISSING_DATA_BINDING",
    description: "api mode requires bindings per operation type",
  },
  {
    id: "O8",
    code: "STATIC_API_CONFLICT",
    description: "static mode must not include API bindings",
  },
  {
    id: "O9",
    code: "ROUTE_PARAM_MISMATCH",
    description: "route placeholders must match operation params",
  },
  {
    id: "O10",
    code: "INVALID_FORM_FIELD",
    description: "form fields and bodyMap must be consistent",
  },
  {
    id: "O11",
    code: "INVALID_EMBEDDED_ACTION",
    description: "embedded actions only on read operations",
  },
  {
    id: "O12",
    code: "INVALID_DELETE_METHOD",
    description: "delete bindings must use DELETE method",
  },
  {
    id: "O13",
    code: "INVALID_BREADCRUMB",
    description: "breadcrumb only on read/update; target must be reachable",
  },
  {
    id: "O14",
    code: "ORPHAN_OPERATION",
    description: "operations must be reachable from entity entrypoints",
  },
  {
    id: "O15",
    code: "MISSING_ROUTE",
    description: "every operation requires route and matching params",
  },
  {
    id: "O16",
    code: "MISSING_OUTCOME",
    description: "mutating operations require success, error, and cancel outcomes",
  },
  {
    id: "O17",
    code: "MISSING_OUTCOME",
    description: "embedded actions require success and error outcomes",
  },
  {
    id: "O18",
    code: "MISSING_CTA_TRANSITION",
    description: "browse + create in same entity requires cta transition",
  },
  {
    id: "O19",
    code: "SCOPE_PLACEHOLDER_MISSING",
    description: "scope selector placeholders must appear in operation bindings",
  },
  {
    id: "O20",
    code: "INVALID_TRANSITION_TRIGGER",
    description: "transition trigger must be row, link, cta, or cancel",
  },
];
