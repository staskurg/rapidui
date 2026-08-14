import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import type { RunState } from "@/lib/eval/runnerTypes";

export type TrialResultLabel = "Pass" | "Fail" | "Incomplete" | "Error";

export function resolveTrialResultLabel(trial: {
  passed: boolean | null;
  run_state: RunState;
}): TrialResultLabel {
  if (trial.run_state === "error") {
    return "Error";
  }
  if (trial.run_state === "incomplete") {
    return "Incomplete";
  }
  if (trial.passed) {
    return "Pass";
  }
  return "Fail";
}

export const trialResultStyles: Record<TrialResultLabel, string> = {
  Pass: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  Fail: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  Incomplete:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  Error:
    "bg-zinc-100 text-zinc-800 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
};

export function formatTrialLatency(latencyMs: number | null): string {
  if (latencyMs === null) {
    return "—";
  }
  if (latencyMs >= 1000) {
    return `${(latencyMs / 1000).toFixed(1)}s`;
  }
  return `${latencyMs}ms`;
}

export function formatTrialStartedAt(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMustValidateBeforeSave(met: boolean | null): string {
  if (met === null) {
    return "—";
  }
  return met ? "Yes" : "No";
}

export function truncateExperimentId(experimentId: string, visible = 8): string {
  if (experimentId.length <= visible * 2 + 1) {
    return experimentId;
  }
  return `${experimentId.slice(0, visible)}…${experimentId.slice(-visible)}`;
}

export function buildTrialRerunCommand(evalCaseId: string): string {
  return `npm run eval:run -- --case=${evalCaseId}`;
}

export function trialConfigDimensionsFromRecord(
  trial: EvalTrialRecord,
): import("@/lib/eval/baselineCompare").TrialConfigDimensions {
  return {
    evalCaseId: trial.eval_case_id,
    caseHash: trial.case_hash,
    model: trial.model,
    promptVersion: trial.prompt_version,
    evalMode: trial.eval_mode,
    validationVersion: trial.validation_version,
    registryVersion: trial.registry_version,
  };
}
