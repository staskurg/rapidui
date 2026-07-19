import type { Entity, Operation, Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

function getEntityMap(rui: Rui): Map<string, Entity> {
  return new Map(rui.entities.map((entity) => [entity.id, entity]));
}

function getOperationMap(rui: Rui): Map<string, Operation> {
  return new Map(rui.operations.map((operation) => [operation.id, operation]));
}

/** O4 — entityId references and operationIds membership. */
export function checkEntities(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const entities = getEntityMap(rui);
  const operations = getOperationMap(rui);

  for (const entity of rui.entities) {
    for (const operationId of entity.operationIds) {
      if (!operations.has(operationId)) {
        const { message, hint } = formatError("INVALID_ENTITY_REF", {
          operationId,
          entityId: entity.id,
        });
        errors.push({
          path: `entities[${entity.id}].operationIds`,
          code: "INVALID_ENTITY_REF",
          message,
          hint,
        });
      }
    }

    for (const entrypoint of entity.entrypoints) {
      if (!entity.operationIds.includes(entrypoint)) {
        const { message, hint } = formatError("INVALID_ENTITY_REF", {
          operationId: entrypoint,
          entityId: entity.id,
        });
        errors.push({
          path: `entities[${entity.id}].entrypoints`,
          code: "INVALID_ENTITY_REF",
          message,
          hint,
        });
      }
    }
  }

  for (const operation of rui.operations) {
    const entity = entities.get(operation.entityId);
    if (!entity) {
      const { message, hint } = formatError("INVALID_ENTITY_REF", {
        operationId: operation.id,
        entityId: operation.entityId,
      });
      errors.push({
        path: `operations[${operation.id}].entityId`,
        code: "INVALID_ENTITY_REF",
        message,
        hint,
      });
      continue;
    }

    if (!entity.operationIds.includes(operation.id)) {
      const { message, hint } = formatError("INVALID_ENTITY_REF", {
        operationId: operation.id,
        entityId: entity.id,
      });
      errors.push({
        path: `entities[${entity.id}].operationIds`,
        code: "INVALID_ENTITY_REF",
        message,
        hint,
      });
    }
  }

  return errors;
}
