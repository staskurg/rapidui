import { PLANNED_BINDINGS, PLANNED_BLOCKS } from "@/lib/registry";

import { formatError } from "./messages";
import type { ValidationError } from "./types";

const PLANNED_BLOCK_SET = new Set<string>(PLANNED_BLOCKS);
const PLANNED_BINDING_SET = new Set<string>(PLANNED_BINDINGS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Phase 2 — detect planned block/binding types before Zod (R22). */
export function runPlannedGate(root: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  function walk(value: unknown, path: string): void {
    if (!isRecord(value)) {
      return;
    }

    const nodeType = value.type;
    if (typeof nodeType === "string" && PLANNED_BLOCK_SET.has(nodeType)) {
      const { message, hint } = formatError("PLANNED_NOT_SUPPORTED", {
        type: nodeType,
      });
      errors.push({
        path,
        code: "PLANNED_NOT_SUPPORTED",
        message,
        hint,
      });
    }

    const binding = value.binding;
    if (isRecord(binding)) {
      const bindingType = binding.type;
      if (
        typeof bindingType === "string" &&
        PLANNED_BINDING_SET.has(bindingType)
      ) {
        const bindingPath = path === "" ? "binding" : `${path}.binding`;
        const { message, hint } = formatError("PLANNED_NOT_SUPPORTED", {
          type: bindingType,
        });
        errors.push({
          path: bindingPath,
          code: "PLANNED_NOT_SUPPORTED",
          message,
          hint,
        });
      }
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "binding") {
        continue;
      }

      const childPath = path === "" ? key : `${path}.${key}`;

      if (Array.isArray(child)) {
        child.forEach((item, index) => {
          walk(item, `${childPath}[${index}]`);
        });
      } else {
        walk(child, childPath);
      }
    }
  }

  walk(root, "");
  return errors;
}
