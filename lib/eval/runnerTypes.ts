import type { AssertionResult } from "../../eval/types";

/** All automated guided eval cases — default `npm run eval:run` batch. */
export const EVAL_RUN_CASES = [
  "static-browse-v0.2",
  "crud-admin-v0.2",
  "ai-review-queue-v0.2",
  "ai-review-queue-clarification-v0.2",
  "ai-review-queue-negotiation-v0.2",
] as const;

export type EvalRunCaseId = (typeof EVAL_RUN_CASES)[number];

export type RunState = "complete" | "incomplete" | "error";

export type FailureOwner = "infra" | "model" | "runner" | null;

export type ProcessMetrics = {
  validateAttempts: number;
  platformApiCalls: number;
  latencyMs: number | null;
  agentOutcome: string | null;
  infraFailureCount: number;
};

/** JSON envelope emitted by agent/scripts/eval_driver.py */
export type DriverResult = {
  sessionId: string;
  caseId: string;
  status: "saved" | "failed" | "abandoned" | "error";
  specId: string | null;
  userTurns: number;
  error: string | null;
  messages: unknown[];
};

/** Trial envelope — persisted to eval_trials in 7.4; printed by eval:run in 7.3 */
export type TrialResult = {
  id: string;
  experimentId: string;
  trialIndex: number;
  sessionId: string;
  evalCaseId: string;
  passed: boolean | null;
  runState: RunState;
  failureOwner: FailureOwner;
  failureStage: string | null;
  failureDetail: string | null;
  finalSpecId: string | null;
  assertionResults: AssertionResult[];
  process: ProcessMetrics;
  userTurns: number;
  mustValidateMet: boolean | null;
  driverStatus: DriverResult["status"];
  transcript: unknown[];
  startedAt: string;
  completedAt: string;
};

export type EvalRunSummary = {
  experimentId: string;
  trials: TrialResult[];
  passed: number;
  failed: number;
  incomplete: number;
  errors: number;
};
