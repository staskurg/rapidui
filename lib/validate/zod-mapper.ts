import type { ZodIssue } from "zod";

import { formatError } from "./messages";
import {
  formatZodPath,
  getAtPath,
  getBlockTypeAtBindingPath,
} from "./path";
import type { ValidationError } from "./types";

function isPageChildPath(path: PropertyKey[]): boolean {
  return (
    path.length >= 4 &&
    path[0] === "pages" &&
    typeof path[1] === "number" &&
    path[2] === "children" &&
    typeof path[3] === "number" &&
    (path.length === 4 || path[4] === "type")
  );
}

function isSectionChildPath(path: PropertyKey[]): boolean {
  return (
    path.length >= 7 &&
    path[0] === "pages" &&
    typeof path[1] === "number" &&
    path[2] === "children" &&
    typeof path[3] === "number" &&
    path[4] === "children" &&
    typeof path[5] === "number" &&
    (path.length === 6 || path[6] === "type")
  );
}

function isMetricValuePathIssue(path: PropertyKey[], root: unknown): boolean {
  const last = path[path.length - 1];
  if (last !== "valuePath") {
    return false;
  }

  const bindingIndex = path.lastIndexOf("binding");
  if (bindingIndex === -1) {
    return false;
  }

  const blockType = getBlockTypeAtBindingPath(root, path.slice(0, bindingIndex + 1));
  return blockType === "Metric";
}

function isMissingBindingIssue(path: PropertyKey[], root: unknown): boolean {
  const last = path[path.length - 1];
  if (last !== "binding") {
    return false;
  }

  const blockType = getBlockTypeAtBindingPath(root, path);
  return blockType === "Metric" || blockType === "Table";
}

function mapUnrecognizedKeys(
  issue: ZodIssue & { code: "unrecognized_keys" },
): ValidationError[] {
  const basePath = formatZodPath(issue.path);

  return issue.keys.map((key) => {
    const path = basePath === "" ? key : `${basePath}.${key}`;
    const { message, hint } = formatError("UNKNOWN_PROP", { prop: key });
    return { path, code: "UNKNOWN_PROP", message, hint };
  });
}

function mapTooSmall(
  issue: ZodIssue & { code: "too_small"; path: PropertyKey[] },
): ValidationError {
  const path = formatZodPath(issue.path);
  const last = issue.path[issue.path.length - 1];

  if (last === "pages") {
    const { message, hint } = formatError("EMPTY_PAGES");
    return { path, code: "EMPTY_PAGES", message, hint };
  }

  if (last === "items" && issue.path.includes("navigation")) {
    const { message, hint } = formatError("EMPTY_NAVIGATION");
    return { path, code: "EMPTY_NAVIGATION", message, hint };
  }

  if (last === "children" && issue.path.length === 3 && issue.path[0] === "pages") {
    const { message, hint } = formatError("EMPTY_PAGE");
    return { path, code: "EMPTY_PAGE", message, hint };
  }

  if (last === "children" && issue.path.length === 6) {
    const { message, hint } = formatError("EMPTY_SECTION");
    return { path, code: "EMPTY_SECTION", message, hint };
  }

  if (last === "columns") {
    const { message, hint } = formatError("INVALID_COLUMNS");
    return { path, code: "INVALID_COLUMNS", message, hint };
  }

  const prop = String(last);
  const { message, hint } = formatError("INVALID_PROP_TYPE", { prop });
  return { path, code: "INVALID_PROP_TYPE", message, hint };
}

function mapInvalidUnion(
  issue: ZodIssue & { code: "invalid_union"; path: PropertyKey[] },
  root: unknown,
): ValidationError {
  const path = formatZodPath(issue.path);

  if (isSectionChildPath(issue.path)) {
    const node = getAtPath(root, issue.path);
    const type =
      typeof node === "string"
        ? node
        : typeof getAtPath(root, issue.path.slice(0, -1)) === "object" &&
            getAtPath(root, issue.path.slice(0, -1)) !== null
          ? String(
              (getAtPath(root, issue.path.slice(0, -1)) as { type?: unknown })
                .type ?? "unknown",
            )
          : "unknown";
    const { message, hint } = formatError("UNKNOWN_TYPE", { type });
    return { path, code: "UNKNOWN_TYPE", message, hint };
  }

  const { message, hint } = formatError("UNKNOWN_TYPE", { type: "unknown" });
  return { path, code: "UNKNOWN_TYPE", message, hint };
}

function mapIssue(issue: ZodIssue, root: unknown): ValidationError[] {
  const path = formatZodPath(issue.path);
  const last = issue.path[issue.path.length - 1];

  if (issue.code === "unrecognized_keys") {
    return mapUnrecognizedKeys(issue as ZodIssue & { code: "unrecognized_keys" });
  }

  if (issue.code === "too_small") {
    return [mapTooSmall(issue as ZodIssue & { code: "too_small" })];
  }

  if (issue.code === "invalid_value" && issue.path[0] === "version") {
    const { message, hint } = formatError("VERSION_MISMATCH");
    return [{ path, code: "VERSION_MISMATCH", message, hint }];
  }

  if (
    issue.code === "invalid_value" &&
    isPageChildPath(issue.path) &&
    last === "type"
  ) {
    const { message, hint } = formatError("INVALID_PAGE_CHILD");
    return [{ path, code: "INVALID_PAGE_CHILD", message, hint }];
  }

  if (issue.code === "invalid_union") {
    return [mapInvalidUnion(issue as ZodIssue & { code: "invalid_union" }, root)];
  }

  if (issue.code === "invalid_type" && isMissingBindingIssue(issue.path, root)) {
    const blockType = getBlockTypeAtBindingPath(root, issue.path) ?? "Block";
    const { message, hint } = formatError("MISSING_BINDING", { blockType });
    return [{ path, code: "MISSING_BINDING", message, hint }];
  }

  if (
    issue.code === "invalid_type" &&
    last === "valuePath" &&
    isMetricValuePathIssue(issue.path, root)
  ) {
    const { message, hint } = formatError("MISSING_VALUE_PATH");
    return [{ path, code: "MISSING_VALUE_PATH", message, hint }];
  }

  if (
    issue.code === "invalid_format" &&
    "format" in issue &&
    issue.format === "starts_with"
  ) {
    const { message, hint } = formatError("INVALID_BINDING");
    return [{ path, code: "INVALID_BINDING", message, hint }];
  }

  if (
    issue.code === "invalid_format" &&
    "format" in issue &&
    issue.format === "regex" &&
    last === "valuePath"
  ) {
    const valuePath = String(getAtPath(root, issue.path) ?? "");
    const { message, hint } = formatError("INVALID_VALUE_PATH", { valuePath });
    return [{ path, code: "INVALID_VALUE_PATH", message, hint }];
  }

  if (issue.code === "invalid_type" && issue.expected !== "undefined") {
    const prop = String(last);
    const { message, hint } = formatError("INVALID_PROP_TYPE", { prop });
    return [{ path, code: "INVALID_PROP_TYPE", message, hint }];
  }

  if (issue.code === "invalid_type") {
    const prop = String(last);
    const { message, hint } = formatError("MISSING_REQUIRED_PROP", { prop });
    return [{ path, code: "MISSING_REQUIRED_PROP", message, hint }];
  }

  if (issue.code === "invalid_value") {
    const prop = String(last);
    const { message, hint } = formatError("INVALID_PROP_TYPE", { prop });
    return [{ path, code: "INVALID_PROP_TYPE", message, hint }];
  }

  const prop = last !== undefined ? String(last) : "value";
  const { message, hint } = formatError("INVALID_PROP_TYPE", { prop });
  return [{ path, code: "INVALID_PROP_TYPE", message, hint }];
}

/** Maps Zod issues to stable RapidUI validation errors (phase 3). */
export function mapZodIssues(issues: ZodIssue[], root: unknown): ValidationError[] {
  return issues.flatMap((issue) => mapIssue(issue, root));
}
