import type { ZodIssue } from "zod";

import { formatError } from "./messages";
import { formatZodPath } from "./path";
import type { ValidationError } from "./types";

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

function mapIssue(issue: ZodIssue): ValidationError[] {
  const path = formatZodPath(issue.path);
  const last = issue.path[issue.path.length - 1];

  if (issue.code === "unrecognized_keys") {
    return mapUnrecognizedKeys(issue as ZodIssue & { code: "unrecognized_keys" });
  }

  if (issue.code === "invalid_value" && issue.path[0] === "version") {
    const { message, hint } = formatError("VERSION_MISMATCH");
    return [{ path, code: "VERSION_MISMATCH", message, hint }];
  }

  if (issue.code === "invalid_union" && issue.path.includes("type")) {
    const { message, hint } = formatError("UNKNOWN_TYPE", {
      prop: String(last ?? "type"),
    });
    return [{ path, code: "UNKNOWN_TYPE", message, hint }];
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

/** Maps Zod issues to stable RapidUI validation errors. */
export function mapZodIssues(issues: ZodIssue[]): ValidationError[] {
  return issues.flatMap((issue) => mapIssue(issue));
}
