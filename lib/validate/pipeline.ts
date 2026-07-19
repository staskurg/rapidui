import {
  REGISTRY_VERSION,
  RuiSchema,
  SCHEMA_VERSION,
  type Rui,
} from "@/lib/operations";

import { formatError } from "./messages";
import { normalizeRui } from "./normalize";
import { runSemanticChecks } from "./semantic";
import type { ValidationError, ValidationFailure, ValidationSuccess } from "./types";
import { VALIDATION_VERSION } from "./version";
import { mapZodIssues } from "./zod-mapper";

const MAX_ERRORS = 50;

function dedupeAndSortErrors(errors: ValidationError[]): ValidationError[] {
  const seen = new Set<string>();
  const unique: ValidationError[] = [];

  for (const error of errors) {
    const key = `${error.path}\0${error.code}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(error);
  }

  return unique.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return a.code.localeCompare(b.code);
  });
}

function capErrors(errors: ValidationError[]): {
  errors: ValidationError[];
  truncated: boolean;
} {
  if (errors.length <= MAX_ERRORS) {
    return { errors, truncated: false };
  }

  return { errors: errors.slice(0, MAX_ERRORS), truncated: true };
}

function failure(errors: ValidationError[]): ValidationFailure {
  const { errors: capped, truncated } = capErrors(dedupeAndSortErrors(errors));

  return {
    valid: false,
    validationVersion: VALIDATION_VERSION,
    registryVersion: REGISTRY_VERSION,
    errors: capped,
    ...(truncated ? { truncated: true } : {}),
  };
}

function versionMismatch(): ValidationFailure {
  const { message, hint } = formatError("VERSION_MISMATCH");
  return failure([
    {
      path: "version",
      code: "VERSION_MISMATCH",
      message,
      hint,
    },
  ]);
}

/** Validates a parsed RUI object. */
export function validateSpec(body: unknown): ValidationSuccess | ValidationFailure {
  if (!body || typeof body !== "object") {
    return failure([
      {
        path: "",
        code: "MISSING_REQUIRED_PROP",
        message: 'Missing required property "version".',
        hint: "Send a RUI object with version, app, entities, operations, and transitions.",
      },
    ]);
  }

  const record = body as Record<string, unknown>;
  if (record.version !== SCHEMA_VERSION) {
    return versionMismatch();
  }

  const errors: ValidationError[] = [];
  const parsed = RuiSchema.safeParse(body);
  if (!parsed.success) {
    errors.push(...mapZodIssues(parsed.error.issues));
    return failure(errors);
  }

  errors.push(...runSemanticChecks(parsed.data));
  if (errors.length > 0) {
    return failure(errors);
  }

  return {
    valid: true,
    validationVersion: VALIDATION_VERSION,
    registryVersion: REGISTRY_VERSION,
    normalizedRui: normalizeRui(parsed.data as Rui),
  };
}
