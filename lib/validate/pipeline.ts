import { REGISTRY_VERSION, RuiSchema, type Rui } from "@/lib/registry";

import { normalizeRui } from "./normalize";
import { runPlannedGate } from "./planned-gate";
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

/** Validates a parsed RUI object (phases 2–5). */
export function validateSpec(body: unknown): ValidationSuccess | ValidationFailure {
  const errors: ValidationError[] = [];

  errors.push(...runPlannedGate(body));

  const parsed = RuiSchema.safeParse(body);
  if (!parsed.success) {
    errors.push(...mapZodIssues(parsed.error.issues, body));
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
