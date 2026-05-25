export type RuleCode =
  | "INVALID_JSON"
  | "VERSION_MISMATCH"
  | "MISSING_REQUIRED_PROP"
  | "DUPLICATE_ID"
  | "INVALID_ID_FORMAT"
  | "UNKNOWN_TYPE"
  | "INVALID_PROP_TYPE"
  | "UNKNOWN_PROP"
  | "EMPTY_PAGES"
  | "EMPTY_NAVIGATION"
  | "INVALID_NAV_PAGE_ID"
  | "ORPHAN_PAGE"
  | "INVALID_PAGE_CHILD"
  | "INVALID_SECTION_CHILD"
  | "INVALID_NESTING"
  | "EMPTY_PAGE"
  | "EMPTY_SECTION"
  | "INVALID_COLUMNS"
  | "MISSING_BINDING"
  | "MISSING_VALUE_PATH"
  | "INVALID_BINDING"
  | "INVALID_FILTER_FIELD"
  | "PLANNED_NOT_SUPPORTED"
  | "INVALID_VALUE_PATH";

export type Rule = {
  id: string;
  code: RuleCode;
  description: string;
};

/** Validation rules R0–R24. Semantic checks are implemented in §2; cataloged here for /api/schema. */
export const RULES: Rule[] = [
  { id: "R0", code: "INVALID_JSON", description: "Payload must be valid JSON" },
  {
    id: "R1",
    code: "VERSION_MISMATCH",
    description: 'version must equal registry version ("0.1")',
  },
  {
    id: "R2",
    code: "MISSING_REQUIRED_PROP",
    description:
      "Required top-level keys version, meta, navigation, pages must be present",
  },
  {
    id: "R3",
    code: "DUPLICATE_ID",
    description: "Every node id must be globally unique across the RUI",
  },
  {
    id: "R4",
    code: "INVALID_ID_FORMAT",
    description: "Every node id must match ^[a-z][a-z0-9-]*$ (1–64 chars)",
  },
  {
    id: "R5",
    code: "UNKNOWN_TYPE",
    description: "Node type must be a registered layout or block",
  },
  {
    id: "R6",
    code: "MISSING_REQUIRED_PROP",
    description: "Required props must be present per type",
  },
  {
    id: "R7",
    code: "UNKNOWN_PROP",
    description: "No unknown properties (strict mode)",
  },
  {
    id: "R7b",
    code: "INVALID_PROP_TYPE",
    description: "Prop types must match registry",
  },
  {
    id: "R8",
    code: "EMPTY_PAGES",
    description: "pages.length must be >= 1",
  },
  {
    id: "R9",
    code: "EMPTY_NAVIGATION",
    description: "navigation.items.length must be >= 1",
  },
  {
    id: "R10",
    code: "INVALID_NAV_PAGE_ID",
    description: "Every navigation.items[].pageId must match a pages[].id",
  },
  {
    id: "R11",
    code: "ORPHAN_PAGE",
    description: "Every pages[].id must appear in at least one navigation item",
  },
  {
    id: "R12",
    code: "INVALID_PAGE_CHILD",
    description: "Page.children must contain only Section nodes",
  },
  {
    id: "R13",
    code: "INVALID_SECTION_CHILD",
    description: "Section.children must contain only block nodes",
  },
  {
    id: "R14",
    code: "INVALID_NESTING",
    description: "No Section-in-Section nesting",
  },
  {
    id: "R15",
    code: "EMPTY_PAGE",
    description: "Page.children.length must be >= 1",
  },
  {
    id: "R16",
    code: "EMPTY_SECTION",
    description: "Section.children.length must be >= 1",
  },
  {
    id: "R17",
    code: "INVALID_COLUMNS",
    description: "Table.columns.length >= 1; column key unique within table",
  },
  {
    id: "R18",
    code: "MISSING_BINDING",
    description: "Table.binding and Metric.binding are required",
  },
  {
    id: "R19",
    code: "MISSING_VALUE_PATH",
    description: "Metric.binding.valuePath is required",
  },
  {
    id: "R20",
    code: "INVALID_BINDING",
    description: 'Binding type must be "read"; method must be "GET"',
  },
  {
    id: "R21",
    code: "INVALID_FILTER_FIELD",
    description: "Table.filter.field must match a column key",
  },
  {
    id: "R22",
    code: "PLANNED_NOT_SUPPORTED",
    description: "Planned block/binding types are not supported in v0.1",
  },
  {
    id: "R23",
    code: "INVALID_VALUE_PATH",
    description: "valuePath must be valid dot-segments",
  },
  {
    id: "R24",
    code: "INVALID_BINDING",
    description: "ReadBinding.path must start with /",
  },
];
