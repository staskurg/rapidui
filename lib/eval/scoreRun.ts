import { getSpecById } from "@/lib/db/specs";

import {
  collectFromRui,
  dataPathRequirementMet,
  formatDataPathRef,
} from "./collectOperations";
import { loadCase } from "./loadCase";
import type { ScoreDetails, ScoreResult } from "../../eval/types";

export type ScoreRunInput = {
  specId: string;
  caseId: string;
  validateCount?: number;
  userTurns?: number;
};

/** Deterministic pass/fail — compares saved spec against case successCriteria. */
export async function scoreRun(input: ScoreRunInput): Promise<ScoreResult> {
  const evalCase = loadCase(input.caseId);
  const criteria = evalCase.successCriteria;
  const spec = await getSpecById(input.specId);

  if (!spec) {
    const scoreDetails: ScoreDetails = { specNotFound: true };
    if (criteria.requiredOperations?.length) {
      scoreDetails.missingOperations = [...criteria.requiredOperations];
    }
    if (criteria.requiredEmbeddedActions?.length) {
      scoreDetails.missingEmbeddedActions = [...criteria.requiredEmbeddedActions];
    }
    if (criteria.requiredTransitions?.length) {
      scoreDetails.missingTransitions = [...criteria.requiredTransitions];
    }
    if (criteria.requiredDataPaths?.length) {
      scoreDetails.missingDataPaths = [...criteria.requiredDataPaths];
    }

    return {
      passed: false,
      scoreDetails,
      operationsFound: [],
      embeddedActionsFound: [],
      transitionsFound: [],
      dataPathsFound: [],
    };
  }

  const collected = collectFromRui(spec.normalizedRui);
  const dataPathsFound = collected.dataPaths.map(formatDataPathRef);

  const missingOperations = (criteria.requiredOperations ?? []).filter(
    (operationType) => !collected.operationTypes.includes(operationType),
  );

  const missingEmbeddedActions = (criteria.requiredEmbeddedActions ?? []).filter(
    (actionType) => !collected.embeddedActionTypes.includes(actionType),
  );

  const missingTransitions = (criteria.requiredTransitions ?? []).filter(
    (trigger) => !collected.transitionTriggers.includes(trigger),
  );

  const missingDataPaths = (criteria.requiredDataPaths ?? []).filter(
    (requirement) => !dataPathRequirementMet(collected.dataPaths, requirement),
  );

  const retryExceeded =
    criteria.maxRetries !== undefined &&
    input.validateCount !== undefined &&
    input.validateCount > criteria.maxRetries;

  const userTurnsExceeded =
    criteria.maxUserTurns !== undefined &&
    input.userTurns !== undefined &&
    input.userTurns > criteria.maxUserTurns;

  const scoreDetails: ScoreDetails = {};
  if (missingOperations.length > 0) {
    scoreDetails.missingOperations = missingOperations;
  }
  if (missingEmbeddedActions.length > 0) {
    scoreDetails.missingEmbeddedActions = missingEmbeddedActions;
  }
  if (missingTransitions.length > 0) {
    scoreDetails.missingTransitions = missingTransitions;
  }
  if (missingDataPaths.length > 0) {
    scoreDetails.missingDataPaths = missingDataPaths;
  }
  if (retryExceeded) {
    scoreDetails.retryExceeded = true;
  }
  if (userTurnsExceeded) {
    scoreDetails.userTurnsExceeded = true;
  }

  const passed =
    missingOperations.length === 0 &&
    missingEmbeddedActions.length === 0 &&
    missingTransitions.length === 0 &&
    missingDataPaths.length === 0 &&
    !retryExceeded &&
    !userTurnsExceeded &&
    !(criteria.mustValidate && !spec);

  return {
    passed,
    scoreDetails,
    operationsFound: collected.operationTypes,
    embeddedActionsFound: collected.embeddedActionTypes,
    transitionsFound: collected.transitionTriggers,
    dataPathsFound,
  };
}
