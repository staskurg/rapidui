import type { Rui } from "@/lib/operations";
import { collectIdsFromRui, extractPathParams, isValidId } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

/** O2 — globally unique ids; invalid id format. */
export function checkIds(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();

  for (const id of collectIdsFromRui(rui)) {
    if (!isValidId(id)) {
      const { message, hint } = formatError("INVALID_ID_FORMAT", { id });
      errors.push({ path: "id", code: "INVALID_ID_FORMAT", message, hint });
      continue;
    }

    const prior = seen.get(id);
    if (prior) {
      const { message, hint } = formatError("DUPLICATE_ID", { id });
      errors.push({ path: prior, code: "DUPLICATE_ID", message, hint });
    } else {
      seen.set(id, id);
    }
  }

  return errors;
}

/** O15 — every operation has route; params match route placeholders. */
export function checkRoutes(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const operation of rui.operations) {
    if (!operation.route.startsWith("/")) {
      const { message, hint } = formatError("MISSING_ROUTE", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].route`,
        code: "MISSING_ROUTE",
        message,
        hint,
      });
    }

    const routeParams = extractPathParams(operation.route);
    const declared = operation.params ?? [];

    for (const param of routeParams) {
      if (!declared.includes(param)) {
        const { message, hint } = formatError("ROUTE_PARAM_MISMATCH", {
          operationId: operation.id,
          param,
        });
        errors.push({
          path: `operations[${operation.id}].params`,
          code: "ROUTE_PARAM_MISMATCH",
          message,
          hint,
        });
      }
    }

    for (const param of declared) {
      if (!routeParams.includes(param)) {
        const { message, hint } = formatError("ROUTE_PARAM_MISMATCH", {
          operationId: operation.id,
          param,
        });
        errors.push({
          path: `operations[${operation.id}].params`,
          code: "ROUTE_PARAM_MISMATCH",
          message,
          hint,
        });
      }
    }
  }

  return errors;
}
