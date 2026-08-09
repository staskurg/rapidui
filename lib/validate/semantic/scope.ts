import type { Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";
import { collectOperationBindingPaths } from "./data";

const SCOPE_PLACEHOLDER_PATTERN = /\{scope\.([a-zA-Z0-9_-]+)\}/g;

function getEntityMap(rui: Rui) {
  return new Map(rui.entities.map((entity) => [entity.id, entity]));
}

function collectScopePlaceholderIds(paths: string[]): Set<string> {
  const ids = new Set<string>();
  for (const path of paths) {
    for (const match of path.matchAll(SCOPE_PLACEHOLDER_PATTERN)) {
      const id = match[1];
      if (id) {
        ids.add(id);
      }
    }
  }
  return ids;
}

function collectEntityBindingPaths(rui: Rui, entityId: string): string[] {
  const paths: string[] = [];

  for (const operation of rui.operations) {
    if (operation.entityId !== entityId) {
      continue;
    }

    paths.push(...collectOperationBindingPaths(operation));
  }

  return paths;
}

/** O19 — scope selector placeholders appear in operation bindings (both directions). */
export function checkScope(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const entities = getEntityMap(rui);

  for (const entity of rui.entities) {
    const selectorIds = new Set(entity.scope?.selectors?.map((selector) => selector.id) ?? []);
    const bindingPaths = collectEntityBindingPaths(rui, entity.id);
    const placeholderIds = collectScopePlaceholderIds(bindingPaths);

    for (const placeholderId of placeholderIds) {
      if (!selectorIds.has(placeholderId)) {
        const { message, hint } = formatError("SCOPE_SELECTOR_MISSING", {
          entityId: entity.id,
          param: `{scope.${placeholderId}}`,
        });
        errors.push({
          path: `entities[${entity.id}].scope`,
          code: "SCOPE_SELECTOR_MISSING",
          message,
          hint,
        });
      }
    }
  }

  for (const operation of rui.operations) {
    const entity = entities.get(operation.entityId);
    if (!entity?.scope?.selectors?.length) {
      continue;
    }

    const combined = collectOperationBindingPaths(operation).join(" ");
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
