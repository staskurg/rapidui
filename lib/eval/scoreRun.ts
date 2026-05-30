import { getSpecById } from "@/lib/db/specs";

import {
  bindingRequirementMet,
  collectFromRui,
  formatBindingRef,
} from "./collectBlocks";
import { loadCase } from "./loadCase";
import type { ScoreDetails, ScoreResult } from "../../eval/types";

export type ScoreRunInput = {
  specId: string;
  caseId: string;
  validateCount?: number;
};

/** Deterministic pass/fail — compares saved spec against case successCriteria. */
export async function scoreRun(input: ScoreRunInput): Promise<ScoreResult> {
  const evalCase = loadCase(input.caseId);
  const criteria = evalCase.successCriteria;
  const spec = await getSpecById(input.specId);

  if (!spec) {
    const scoreDetails: ScoreDetails = { specNotFound: true };
    if (criteria.requiredBlocks?.length) {
      scoreDetails.missingBlocks = [...criteria.requiredBlocks];
    }
    if (criteria.requiredBindings?.length) {
      scoreDetails.missingBindings = [...criteria.requiredBindings];
    }

    return {
      passed: false,
      scoreDetails,
      blocksFound: [],
      bindingsFound: [],
    };
  }

  const collected = collectFromRui(spec.normalizedRui);
  const bindingsFound = collected.bindings.map(formatBindingRef);

  const missingBlocks = (criteria.requiredBlocks ?? []).filter(
    (blockType) => !collected.blockTypes.includes(blockType),
  );

  const missingBindings = (criteria.requiredBindings ?? []).filter(
    (requirement) => !bindingRequirementMet(collected.bindings, requirement),
  );

  const retryExceeded =
    criteria.maxRetries !== undefined &&
    input.validateCount !== undefined &&
    input.validateCount > criteria.maxRetries;

  const scoreDetails: ScoreDetails = {};
  if (missingBlocks.length > 0) {
    scoreDetails.missingBlocks = missingBlocks;
  }
  if (missingBindings.length > 0) {
    scoreDetails.missingBindings = missingBindings;
  }
  if (retryExceeded) {
    scoreDetails.retryExceeded = true;
  }

  const passed =
    missingBlocks.length === 0 &&
    missingBindings.length === 0 &&
    !retryExceeded &&
    !(criteria.mustValidate && !spec);

  return {
    passed,
    scoreDetails,
    blocksFound: collected.blockTypes,
    bindingsFound,
  };
}
