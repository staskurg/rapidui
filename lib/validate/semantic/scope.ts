import type { Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";
import { collectBindingPaths } from "./data";

function getEntityMap(rui: Rui) {
  return new Map(rui.entities.map((entity) => [entity.id, entity]));
}

/** O19 — scope selector placeholders appear in operation bindings. */
export function checkScope(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const entities = getEntityMap(rui);

  for (const operation of rui.operations) {
    const entity = entities.get(operation.entityId);
    if (!entity?.scope?.selectors?.length) {
      continue;
    }

    const bindingPaths = collectBindingPaths(operation.data);
    if (operation.type === "read" && operation.presentation.actions) {
      for (const action of operation.presentation.actions) {
        if ("invoke" in action) {
          bindingPaths.push(action.invoke.path);
        }
        if ("write" in action) {
          bindingPaths.push(action.write.path);
        }
      }
    }

    const combined = bindingPaths.join(" ");
    for (const selector of entity.scope.selectors) {
      const placeholder = `{scope.${selector.id}}`;
      if (!combined.includes(placeholder)) {
        const { message, hint } = formatError("SCOPE_PLACEHOLDER_MISSING", {
          operationId: operation.id,
          param: placeholder,
        });
        errors.push({
          path: `operations[${operation.id}].data`,
          code: "SCOPE_PLACEHOLDER_MISSING",
          message,
          hint,
        });
      }
    }
  }

  return errors;
}
