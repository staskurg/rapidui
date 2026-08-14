import { getSpecById } from "@/lib/db/specs";
import {
  insertEvalTrial,
  type InsertEvalTrialInput,
} from "@/lib/db/evalTrials";

import { collectTrialConfigSnapshot } from "./collectTrialConfig";
import {
  collectExtendedProcessMetrics,
  type ExtendedProcessMetrics,
} from "./processMetrics";

import type { EvalCase } from "../../eval/types";
import type { TrialResult } from "./runnerTypes";

export type PersistTrialOptions = {
  platformBaseUrl: string;
  baselineExperimentId?: string | null;
};

function deriveFailureCode(trial: TrialResult): string | null {
  if (trial.runState === "complete" && trial.passed) {
    return null;
  }
  return trial.failureStage ?? trial.driverStatus;
}

export function buildEvalTrialInsert(
  trial: TrialResult,
  config: Awaited<ReturnType<typeof collectTrialConfigSnapshot>>,
  process: ExtendedProcessMetrics,
  contentHash: string | null,
  options: PersistTrialOptions,
): InsertEvalTrialInput {
  return {
    id: trial.id,
    experimentId: trial.experimentId,
    trialIndex: trial.trialIndex,
    sessionId: trial.sessionId,
    evalCaseId: trial.evalCaseId,
    caseHash: config.caseHash,
    agent: config.agent,
    baseUrl: config.baseUrl,
    model: config.model,
    provider: config.provider,
    promptVersion: config.promptVersion,
    promptHash: config.promptHash,
    evalMode: config.evalMode,
    gitCommit: config.gitCommit,
    gitDirty: config.gitDirty,
    runnerVersion: config.runnerVersion,
    validationVersion: config.validationVersion,
    registryVersion: config.registryVersion,
    passed: trial.passed,
    runState: trial.runState,
    failureOwner: trial.failureOwner,
    failureStage: trial.failureStage,
    failureCode: deriveFailureCode(trial),
    failureDetail: trial.failureDetail,
    finalSpecId: trial.finalSpecId,
    contentHash,
    assertionResults: trial.assertionResults,
    userTurns: trial.userTurns,
    validateAttempts: process.validateAttempts,
    validationFailures: process.validationFailures,
    tokensIn: process.tokensIn,
    tokensOut: process.tokensOut,
    latencyMs: process.latencyMs,
    mustValidateMet: trial.mustValidateMet,
    transcript: trial.transcript,
    baselineExperimentId: options.baselineExperimentId ?? null,
    startedAt: trial.startedAt,
    completedAt: trial.completedAt,
  };
}

/** Persist a completed eval:run trial to eval_trials (append-only). */
export async function persistEvalTrial(
  trial: TrialResult,
  evalCase: EvalCase,
  options: PersistTrialOptions,
) {
  const [config, process] = await Promise.all([
    collectTrialConfigSnapshot({
      evalCase,
      sessionId: trial.sessionId,
      platformBaseUrl: options.platformBaseUrl,
    }),
    collectExtendedProcessMetrics(trial.sessionId),
  ]);

  let contentHash: string | null = null;
  if (trial.finalSpecId) {
    const spec = await getSpecById(trial.finalSpecId);
    contentHash = spec?.contentHash ?? null;
  }

  const input = buildEvalTrialInsert(trial, config, process, contentHash, options);
  return insertEvalTrial(input);
}
