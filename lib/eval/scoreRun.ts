import { getSpecById } from "@/lib/db/specs";

import {
  evaluateAssertions,
  evaluateAssertionsSpecNotFound,
} from "./assertions";
import { collectFromRui } from "./collectOperations";
import { loadCase } from "./loadCase";
import type { ScoreDetails, ScoreResult } from "../../eval/types";

export type ScoreRunInput = {
  specId: string;
  caseId: string;
  validateCount?: number;
  userTurns?: number;
};

/** Deterministic pass/fail — compares saved spec against case successCriteria.assertions. */
export async function scoreRun(input: ScoreRunInput): Promise<ScoreResult> {
  const evalCase = loadCase(input.caseId);
  const { assertions } = evalCase.successCriteria;
  const spec = await getSpecById(input.specId);

  if (!spec) {
    const assertionResults = evaluateAssertionsSpecNotFound(assertions);
    const scoreDetails: ScoreDetails = {
      assertions: assertionResults,
      specNotFound: true,
    };

    return {
      passed: false,
      assertions: scoreDetails.assertions,
      operationsFound: [],
    };
  }

  const assertionResults = evaluateAssertions(spec.normalizedRui, assertions);
  const collected = collectFromRui(spec.normalizedRui);
  const passed = assertionResults.every((result) => result.passed);

  return {
    passed,
    assertions: assertionResults,
    operationsFound: collected.operationTypes,
  };
}

/** Build score_details for eval_runs persistence. */
export function toScoreDetails(result: ScoreResult): ScoreDetails {
  return {
    assertions: result.assertions,
    ...(result.operationsFound.length === 0 && result.assertions.some(
      (assertion) => assertion.actual === "spec not found",
    )
      ? { specNotFound: true }
      : {}),
  };
}
