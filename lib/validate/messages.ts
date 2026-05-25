import type { RuleCode } from "@/lib/registry";

export type ErrorTemplate = {
  message: string;
  hint: string;
};

export type ErrorContext = {
  id?: string;
  type?: string;
  prop?: string;
  pageId?: string;
  field?: string;
  valuePath?: string;
  blockType?: string;
};

export const ERROR_CATALOG: Record<RuleCode, ErrorTemplate> = {
  INVALID_JSON: {
    message: "Request body must be valid JSON.",
    hint: "Send Content-Type: application/json with the spec object as the raw body.",
  },
  VERSION_MISMATCH: {
    message: 'RUI version must be "0.1".',
    hint: 'Set `version` to `"0.1"` to match the registry.',
  },
  DUPLICATE_ID: {
    message: 'Duplicate node id "{id}".',
    hint: "Each Page, Section, and block id must be unique across the entire spec.",
  },
  INVALID_ID_FORMAT: {
    message: 'Invalid id "{id}".',
    hint: "Use lowercase kebab-case: `^[a-z][a-z0-9-]*$`, 1–64 chars (e.g. `table-tickets`).",
  },
  UNKNOWN_TYPE: {
    message: 'Unknown node type "{type}".',
    hint: "Use Page, Section, Metric, Table, or Text for v0.1.",
  },
  MISSING_REQUIRED_PROP: {
    message: 'Missing required property "{prop}".',
    hint: "Add the property per the spec shape (top-level: `version`, `meta`, `navigation`, `pages`; see §3 schema when live).",
  },
  INVALID_PROP_TYPE: {
    message: 'Invalid value for "{prop}".',
    hint: "Check type and allowed enum values in the schema.",
  },
  UNKNOWN_PROP: {
    message: 'Unknown property "{prop}".',
    hint: "Remove extra properties; v0.1 uses strict schemas.",
  },
  EMPTY_PAGES: {
    message: "RUI must include at least one page.",
    hint: "Add a `pages` array with one or more Page nodes.",
  },
  EMPTY_NAVIGATION: {
    message: "Navigation must include at least one item.",
    hint: "Add `navigation.items` linking to each page via `pageId`.",
  },
  INVALID_NAV_PAGE_ID: {
    message: 'Navigation pageId "{pageId}" does not match any page.',
    hint: "Set `pageId` to an existing `pages[].id`.",
  },
  ORPHAN_PAGE: {
    message: 'Page "{id}" is not linked from navigation.',
    hint: "Add a navigation item with `pageId` matching this page.",
  },
  INVALID_PAGE_CHILD: {
    message: "Page children must be Section nodes.",
    hint: "Only Section nodes allowed under Page.",
  },
  INVALID_SECTION_CHILD: {
    message: "Section children must be Metric, Table, or Text.",
    hint: "Blocks only under Section — no nested sections.",
  },
  INVALID_NESTING: {
    message: "Sections cannot be nested inside sections.",
    hint: "Use Page → Section → Block structure only.",
  },
  EMPTY_PAGE: {
    message: "Page must contain at least one section.",
    hint: "Add a Section to `children`.",
  },
  EMPTY_SECTION: {
    message: "Section must contain at least one block.",
    hint: "Add Metric, Table, or Text to `children`.",
  },
  INVALID_COLUMNS: {
    message: "Table must have at least one column with unique keys.",
    hint: "Define `columns[]` with unique `key` per column.",
  },
  MISSING_BINDING: {
    message: "{blockType} requires a read binding.",
    hint: 'Add `binding` with `type: "read"`, `method: "GET"`, and `path`.',
  },
  MISSING_VALUE_PATH: {
    message: "Metric binding requires valuePath.",
    hint: 'Set `valuePath` to the scalar field (e.g. `"openCount"`).',
  },
  INVALID_BINDING: {
    message: "Invalid read binding.",
    hint: 'Use `type: "read"`, `method: "GET"`, `path` starting with `/`.',
  },
  INVALID_FILTER_FIELD: {
    message: 'Filter field "{field}" does not match a column key.',
    hint: "Set `filter.field` to an existing column `key`.",
  },
  PLANNED_NOT_SUPPORTED: {
    message: '"{type}" is planned for a future version.',
    hint: "v0.1 supports Metric, Table, Text and read (GET) bindings only.",
  },
  INVALID_VALUE_PATH: {
    message: 'Invalid valuePath "{valuePath}".',
    hint: 'Use dot segments only (e.g. `"data.items"`), no JSONPath or brackets.',
  },
};

function interpolate(template: string, context: ErrorContext): string {
  return template.replace(/\{(\w+)\}/g, (_, key: keyof ErrorContext) => {
    const value = context[key];
    return value ?? `{${key}}`;
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
