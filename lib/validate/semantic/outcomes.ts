import type { Operation, Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

function checkNavigateTarget(
  operationId: string,
  path: string,
  target: string,
  operations: Map<string, Operation>,
): ValidationError | null {
  if (!operations.has(target)) {
    const { message, hint } = formatError("MISSING_OUTCOME", { operationId });
    return {
      path,
      code: "MISSING_OUTCOME",
      message: `${message} Unknown navigate target "${target}".`,
      hint,
    };
  }
  return null;
}

/** O16, O17 — outcome navigate targets reference existing operations. */
export function checkOutcomes(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const operations = new Map(rui.operations.map((op) => [op.id, op]));

  for (const operation of rui.operations) {
    if ("outcomes" in operation && operation.outcomes) {
      const { outcomes } = operation;
      for (const [key, outcome] of Object.entries(outcomes)) {
        if ("navigate" in outcome) {
          const error = checkNavigateTarget(
            operation.id,
            `operations[${operation.id}].outcomes.${key}`,
            outcome.navigate,
            operations,
          );
          if (error) {
            errors.push(error);
          }
        }
      }
    }

    if (operation.type === "read" && operation.presentation.actions) {
      for (const [index, action] of operation.presentation.actions.entries()) {
        for (const [key, outcome] of Object.entries(action.outcomes)) {
          if ("navigate" in outcome) {
            const error = checkNavigateTarget(
              operation.id,
              `operations[${operation.id}].presentation.actions[${index}].outcomes.${key}`,
              outcome.navigate,
              operations,
            );
            if (error) {
              errors.push(error);
            }
          }
        }
      }
    }
  }

  return errors;
}

/** O13 — breadcrumb rules. */
export function checkBreadcrumbs(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const operations = new Map(rui.operations.map((op) => [op.id, op]));
  const entrypoints = new Set(rui.entities.flatMap((entity) => entity.entrypoints));

  for (const operation of rui.operations) {
    const breadcrumb = operation.context?.breadcrumb;
    if (!breadcrumb) {
      continue;
    }

    if (operation.type === "browse" || operation.type === "create") {
      const { message, hint } = formatError("INVALID_BREADCRUMB", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].context.breadcrumb`,
        code: "INVALID_BREADCRUMB",
        message,
        hint,
      });
      continue;
    }

    const target = operations.get(breadcrumb.operation);
    if (!target) {
      const { message, hint } = formatError("INVALID_BREADCRUMB", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].context.breadcrumb.operation`,
        code: "INVALID_BREADCRUMB",
        message,
        hint,
      });
      continue;
    }

    const reachable =
      entrypoints.has(breadcrumb.operation) || target.type === "browse";

    if (!reachable) {
      const { message, hint } = formatError("INVALID_BREADCRUMB", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].context.breadcrumb.operation`,
        code: "INVALID_BREADCRUMB",
        message,
        hint,
      });
    }
  }

  return errors;
}
