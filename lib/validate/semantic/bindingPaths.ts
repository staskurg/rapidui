import type { Rui } from "@/lib/operations";
import { extractPathParams } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";
import { collectOperationBindingPaths } from "./data";

const VALID_SCOPE_TOKEN = /^scope\.[a-zA-Z0-9_-]+$/;

/** O19c — every `{...}` in a binding path is a declared param or a well-formed `{scope.<selectorId>}`.
 *  Missing-selector detection for well-formed scope tokens is owned by checkScope (O19b) —
 *  emitting it here too would duplicate the error per operation. */
export function checkBindingPathPlaceholders(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const operation of rui.operations) {
    const declaredParams = new Set(operation.params ?? []);

    for (const bindingPath of collectOperationBindingPaths(operation)) {
      for (const token of extractPathParams(bindingPath)) {
        if (token.startsWith("scope.")) {
          if (!VALID_SCOPE_TOKEN.test(token)) {
            const { message, hint } = formatError("INVALID_BINDING_PLACEHOLDER", {
              operationId: operation.id,
              param: `{${token}}`,
            });
            errors.push({
              path: `operations[${operation.id}].data`,
              code: "INVALID_BINDING_PLACEHOLDER",
              message,
              hint,
            });
          }
          continue;
        }

        if (!declaredParams.has(token)) {
          const { message, hint } = formatError("INVALID_BINDING_PLACEHOLDER", {
            operationId: operation.id,
            param: `{${token}}`,
          });
          errors.push({
            path: `operations[${operation.id}].data`,
            code: "INVALID_BINDING_PLACEHOLDER",
            message,
            hint,
          });
        }
      }
    }
  }

  return errors;
}
