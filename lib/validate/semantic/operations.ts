import type { Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

/** O14 — operations unreachable from entrypoints via transitions. */
export function checkReachability(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const operationIds = new Set(rui.operations.map((op) => op.id));
  const reachable = new Set<string>();

  for (const entity of rui.entities) {
    for (const entrypoint of entity.entrypoints) {
      reachable.add(entrypoint);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const transition of rui.transitions) {
      if (reachable.has(transition.from) && !reachable.has(transition.to)) {
        reachable.add(transition.to);
        changed = true;
      }
    }
  }

  for (const operationId of operationIds) {
    if (!reachable.has(operationId)) {
      const { message, hint } = formatError("ORPHAN_OPERATION", {
        operationId,
      });
      errors.push({
        path: `operations[${operationId}]`,
        code: "ORPHAN_OPERATION",
        message,
        hint,
      });
    }
  }

  return errors;
}

/** O11 — embedded actions only on read operations (defense in depth beyond Zod). */
export function checkEmbeddedActions(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const operation of rui.operations) {
    if (operation.type !== "read" && "presentation" in operation) {
      const presentation = operation.presentation as { actions?: unknown };
      if (Array.isArray(presentation.actions) && presentation.actions.length > 0) {
        const { message, hint } = formatError("INVALID_EMBEDDED_ACTION", {
          operationId: operation.id,
        });
        errors.push({
          path: `operations[${operation.id}].presentation.actions`,
          code: "INVALID_EMBEDDED_ACTION",
          message,
          hint,
        });
      }
    }
  }

  return errors;
}
