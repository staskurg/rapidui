import type { Rui } from "@/lib/operations";

import type { ValidationError } from "../types";
import { checkDataBindings } from "./data";
import { checkEntities } from "./entities";
import { checkIds, checkRoutes } from "./ids";
import { checkEmbeddedActions, checkReachability } from "./operations";
import { checkBreadcrumbs, checkOutcomes } from "./outcomes";
import { checkPresentations } from "./presentations";
import { checkScope } from "./scope";
import { checkCtaTransitions, checkTransitions } from "./transitions";

/** Semantic checks O1–O20 on a structurally valid RUI. */
export function runSemanticChecks(rui: Rui): ValidationError[] {
  return [
    ...checkIds(rui),
    ...checkEntities(rui),
    ...checkScope(rui),
    ...checkRoutes(rui),
    ...checkPresentations(rui),
    ...checkDataBindings(rui),
    ...checkBreadcrumbs(rui),
    ...checkOutcomes(rui),
    ...checkEmbeddedActions(rui),
    ...checkTransitions(rui),
    ...checkCtaTransitions(rui),
    ...checkReachability(rui),
  ];
}
