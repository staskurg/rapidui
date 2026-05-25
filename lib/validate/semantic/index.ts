import type { Rui } from "@/lib/registry";

import { checkIds } from "./ids";
import { checkNavigation } from "./navigation";
import { checkNesting } from "./nesting";
import { checkTables } from "./table";
import type { ValidationError } from "../types";

/** Phase 4 — semantic checks on a structurally valid RUI. */
export function runSemanticChecks(rui: Rui): ValidationError[] {
  return [
    ...checkIds(rui),
    ...checkNavigation(rui),
    ...checkTables(rui),
    ...checkNesting(),
  ];
}
