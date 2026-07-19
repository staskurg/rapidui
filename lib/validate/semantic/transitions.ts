import type { Operation, Rui } from "@/lib/operations";

import { formatError } from "../messages";
import type { ValidationError } from "../types";

function getOperationMap(rui: Rui): Map<string, Operation> {
  return new Map(rui.operations.map((operation) => [operation.id, operation]));
}

/** O3, O5, O6, O20 — transition integrity. */
export function checkTransitions(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const operations = getOperationMap(rui);

  rui.transitions.forEach((transition, index) => {
    const path = `transitions[${index}]`;
    const fromOp = operations.get(transition.from);
    const toOp = operations.get(transition.to);

    if (!fromOp) {
      const { message, hint } = formatError("INVALID_TRANSITION_REF", {
        prop: transition.from,
      });
      errors.push({
        path: `${path}.from`,
        code: "INVALID_TRANSITION_REF",
        message,
        hint,
      });
    }

    if (!toOp) {
      const { message, hint } = formatError("INVALID_TRANSITION_REF", {
        prop: transition.to,
      });
      errors.push({
        path: `${path}.to`,
        code: "INVALID_TRANSITION_REF",
        message,
        hint,
      });
    }

    if (!fromOp || !toOp) {
      return;
    }

    if (transition.trigger === "row") {
      if (fromOp.type !== "browse") {
        const { message, hint } = formatError("INVALID_TRANSITION_TRIGGER", {
          from: transition.from,
          to: transition.to,
          trigger: transition.trigger,
        });
        errors.push({
          path: `${path}.trigger`,
          code: "INVALID_TRANSITION_TRIGGER",
          message,
          hint,
        });
      }

      if (transition.map) {
        const columnKeys = new Set(
          fromOp.type === "browse"
            ? fromOp.presentation.columns.map((column) => column.key)
            : [],
        );

        for (const [param, columnKey] of Object.entries(transition.map)) {
          if (!toOp.params?.includes(param)) {
            const { message, hint } = formatError("INVALID_TRANSITION_MAP", {
              from: transition.from,
              to: transition.to,
              param,
            });
            errors.push({
              path: `${path}.map.${param}`,
              code: "INVALID_TRANSITION_MAP",
              message,
              hint,
            });
          }

          if (!columnKeys.has(columnKey)) {
            const { message, hint } = formatError("INVALID_TRANSITION_MAP", {
              from: transition.from,
              to: transition.to,
              param: columnKey,
            });
            errors.push({
              path: `${path}.map.${param}`,
              code: "INVALID_TRANSITION_MAP",
              message,
              hint,
            });
          }
        }
      }
    }

    if (transition.trigger === "cta" && fromOp.type !== "browse") {
      const { message, hint } = formatError("INVALID_TRANSITION_TRIGGER", {
        from: transition.from,
        to: transition.to,
        trigger: transition.trigger,
      });
      errors.push({
        path: `${path}.trigger`,
        code: "INVALID_TRANSITION_TRIGGER",
        message,
        hint,
      });
    }

    if (
      transition.trigger === "cancel" &&
      toOp.type !== "browse" &&
      toOp.type !== "read"
    ) {
      const { message, hint } = formatError("INVALID_TRANSITION_TRIGGER", {
        from: transition.from,
        to: transition.to,
        trigger: transition.trigger,
      });
      errors.push({
        path: `${path}.trigger`,
        code: "INVALID_TRANSITION_TRIGGER",
        message,
        hint,
      });
    }
  });

  return errors;
}

/** O18 — browse + create in same entity requires cta transition. */
export function checkCtaTransitions(rui: Rui): ValidationError[] {
  const errors: ValidationError[] = [];
  const operations = getOperationMap(rui);

  for (const entity of rui.entities) {
    const entityOps = entity.operationIds
      .map((id) => operations.get(id))
      .filter((op): op is Operation => op !== undefined);

    const browseOps = entityOps.filter((op) => op.type === "browse");
    const createOps = entityOps.filter((op) => op.type === "create");

    if (browseOps.length === 0 || createOps.length === 0) {
      continue;
    }

    for (const browse of browseOps) {
      for (const create of createOps) {
        const hasCta = rui.transitions.some(
          (transition) =>
            transition.from === browse.id &&
            transition.to === create.id &&
            transition.trigger === "cta",
        );

        if (!hasCta) {
          const { message, hint } = formatError("MISSING_CTA_TRANSITION", {
            entityId: entity.id,
          });
          errors.push({
            path: `entities[${entity.id}]`,
            code: "MISSING_CTA_TRANSITION",
            message,
            hint,
          });
        }
      }
    }
  }

  return errors;
}
