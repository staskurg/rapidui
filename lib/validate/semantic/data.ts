import type { Operation, Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

export function collectBindingPaths(data: unknown): string[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const paths: string[] = [];
  const record = data as Record<string, unknown>;

  for (const key of ["read", "write", "invoke"] as const) {
    const binding = record[key];
    if (binding && typeof binding === "object" && "path" in binding) {
      const path = (binding as { path?: unknown }).path;
      if (typeof path === "string") {
        paths.push(path);
      }
    }
  }

  return paths;
}

export function collectOperationBindingPaths(operation: Operation): string[] {
  const paths = collectBindingPaths(operation.data);

  if (operation.type === "read" && operation.presentation.actions) {
    for (const action of operation.presentation.actions) {
      if ("invoke" in action) {
        paths.push(action.invoke.path);
      }
      if ("write" in action) {
        paths.push(action.write.path);
      }
    }
  }

  return paths;
}

function missingBinding(operationId: string): ValidationError {
  const { message, hint } = formatError("MISSING_DATA_BINDING", { operationId });
  return {
    path: `operations[${operationId}].data`,
    code: "MISSING_DATA_BINDING",
    message,
    hint,
  };
}

/** O7, O8, O12 — data mode and API binding rules. */
export function checkDataBindings(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const operation of rui.operations) {
    const data = operation.data;

    if (data.mode === "static") {
      const hasApiBinding =
        ("read" in data && data.read) ||
        ("write" in data && data.write) ||
        ("invoke" in data && data.invoke);

      if (hasApiBinding) {
        const { message, hint } = formatError("STATIC_API_CONFLICT", {
          operationId: operation.id,
        });
        errors.push({
          path: `operations[${operation.id}].data`,
          code: "STATIC_API_CONFLICT",
          message,
          hint,
        });
      }
      continue;
    }

    switch (operation.type) {
      case "browse":
        if (!data.read) {
          errors.push(missingBinding(operation.id));
        }
        break;
      case "read":
        if (!data.read) {
          errors.push(missingBinding(operation.id));
        }
        break;
      case "create":
        if (!data.write) {
          errors.push(missingBinding(operation.id));
        }
        break;
      case "update":
        if (!data.read || !data.write) {
          errors.push(missingBinding(operation.id));
        }
        break;
      case "delete":
        if (!data.write || data.write.method !== "DELETE") {
          const { message, hint } = formatError("INVALID_DELETE_METHOD", {
            operationId: operation.id,
          });
          errors.push({
            path: `operations[${operation.id}].data.write`,
            code: "INVALID_DELETE_METHOD",
            message,
            hint,
          });
        }
        break;
    }

    if (operation.type === "create" && data.read) {
      const { message, hint } = formatError("MISSING_DATA_BINDING", {
        operationId: operation.id,
      });
      errors.push({
        path: `operations[${operation.id}].data`,
        code: "MISSING_DATA_BINDING",
        message,
        hint,
      });
    }
  }

  return errors;
}
