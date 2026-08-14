import { loadCase } from "@/lib/eval/loadCase";
import { areTrialConfigsCompatible } from "@/lib/eval/baselineCompare";
import {
  parseEvalTrialResultFilter,
  type EvalTrialFilterSearchInput,
  type EvalTrialResultFilter,
} from "@/lib/eval/evalTrialFilterQuery";
import { resolveTrialResultLabel } from "@/lib/eval/trialDisplay";
import {
  getEvalTrialById,
  listEvalTrials,
  type EvalTrialRecord,
} from "@/lib/db/evalTrials";
import { sql } from "@/lib/db/client";
import { resolveObserveWindow } from "@/lib/observe/queries";

export type EvalTrialsQueryInput = {
  result?: EvalTrialResultFilter;
  evalCaseId?: string;
  experimentId?: string;
  overCap?: boolean;
  from?: string;
  to?: string;
  limit?: number;
};

export type EvalTrialsTeaser = {
  totalTrials: number;
  passRate: number | null;
  caseBreakdown: Array<{
    evalCaseId: string;
    passed: number;
    total: number;
  }>;
};

function matchesResultFilter(
  trial: EvalTrialRecord,
  result: EvalTrialResultFilter,
): boolean {
  if (!result) {
    return true;
  }

  const label = resolveTrialResultLabel(trial);

  switch (result) {
    case "pass":
      return label === "Pass";
    case "fail":
      return label === "Fail";
    case "incomplete":
      return label === "Incomplete";
    case "error":
      return label === "Error";
    case "infra":
      return trial.run_state === "error" && trial.failure_owner === "infra";
    default:
      return true;
  }
}

export function isOverProcessCap(trial: EvalTrialRecord): boolean {
  try {
    const evalCase = loadCase(trial.eval_case_id);
    const { maxRetries, maxUserTurns } = evalCase.successCriteria;

    if (typeof maxRetries === "number" && trial.validate_attempts > maxRetries) {
      return true;
    }
    if (typeof maxUserTurns === "number" && trial.user_turns > maxUserTurns) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function parseEvalTrialsQuery(
  input: EvalTrialFilterSearchInput,
): EvalTrialsQueryInput {
  return {
    result: parseEvalTrialResultFilter(input.result),
    experimentId: input.experiment?.trim() || undefined,
    overCap: input.overCap === "1",
    from: input.from,
    to: input.to,
  };
}

export async function queryEvalTrials(
  input: EvalTrialsQueryInput = {},
): Promise<EvalTrialRecord[]> {
  const limit = input.limit ?? 200;
  let trials = await listEvalTrials({
    experimentId: input.experimentId,
    evalCaseId: input.evalCaseId,
    limit,
  });

  if (input.result) {
    trials = trials.filter((trial) => matchesResultFilter(trial, input.result!));
  }

  if (input.overCap) {
    trials = trials.filter(isOverProcessCap);
  }

  if (input.from || input.to) {
    const { windowStart, windowEnd } = resolveObserveWindow({
      from: input.from,
      to: input.to,
    });
    trials = trials.filter(
      (trial) => trial.started_at >= windowStart && trial.started_at <= windowEnd,
    );
  }

  return trials;
}

export async function getEvalTrialsTeaser(): Promise<EvalTrialsTeaser> {
  const result = await sql`
    SELECT
      ROUND(100.0 * COUNT(*) FILTER (WHERE passed IS TRUE) / NULLIF(COUNT(*), 0), 1) AS pass_rate,
      COUNT(*) AS total_trials
    FROM eval_trials
  `;

  const caseResult = await sql`
    SELECT
      eval_case_id,
      COUNT(*) FILTER (WHERE passed IS TRUE) AS passed,
      COUNT(*) AS total
    FROM eval_trials
    GROUP BY eval_case_id
    ORDER BY eval_case_id ASC
  `;

  const overall = result.rows[0] ?? {};

  return {
    totalTrials: Number(overall.total_trials ?? 0),
    passRate:
      overall.pass_rate === null || overall.pass_rate === undefined
        ? null
        : Number(overall.pass_rate),
    caseBreakdown: caseResult.rows.map((row) => ({
      evalCaseId: String(row.eval_case_id),
      passed: Number(row.passed ?? 0),
      total: Number(row.total ?? 0),
    })),
  };
}

export async function listDistinctEvalCaseIdsFromTrials(): Promise<string[]> {
  const result = await sql`
    SELECT DISTINCT eval_case_id
    FROM eval_trials
    ORDER BY eval_case_id ASC
  `;
  return result.rows.map((row) => String(row.eval_case_id));
}

export async function listDistinctExperimentIdsFromTrials(
  limit = 20,
): Promise<string[]> {
  const result = await sql`
    SELECT experiment_id
    FROM eval_trials
    GROUP BY experiment_id
    ORDER BY MAX(started_at) DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => String(row.experiment_id));
}

export type BaselineCompareResult = {
  compatible: boolean;
  baselineTrial: EvalTrialRecord | null;
  passedChanged: boolean | null;
};

/** Compare trial to its baseline experiment when configs are compatible. */
export async function compareTrialToBaseline(
  trial: EvalTrialRecord,
): Promise<BaselineCompareResult> {
  if (!trial.baseline_experiment_id) {
    return { compatible: false, baselineTrial: null, passedChanged: null };
  }

  const baselineTrials = await listEvalTrials({
    experimentId: trial.baseline_experiment_id,
    evalCaseId: trial.eval_case_id,
    limit: 50,
  });

  const baselineTrial =
    baselineTrials.find((candidate) =>
      areTrialConfigsCompatible(
        {
          evalCaseId: candidate.eval_case_id,
          caseHash: candidate.case_hash,
          model: candidate.model,
          promptVersion: candidate.prompt_version,
          evalMode: candidate.eval_mode,
          validationVersion: candidate.validation_version,
          registryVersion: candidate.registry_version,
        },
        {
          evalCaseId: trial.eval_case_id,
          caseHash: trial.case_hash,
          model: trial.model,
          promptVersion: trial.prompt_version,
          evalMode: trial.eval_mode,
          validationVersion: trial.validation_version,
          registryVersion: trial.registry_version,
        },
      ),
    ) ?? null;

  if (!baselineTrial) {
    return { compatible: false, baselineTrial: null, passedChanged: null };
  }

  return {
    compatible: true,
    baselineTrial,
    passedChanged: baselineTrial.passed !== trial.passed,
  };
}

export { getEvalTrialById };

export function getTrialProcessCaps(evalCaseId: string): {
  maxRetries: number | null;
  maxUserTurns: number | null;
  maxLatencyMs: number | null;
  mustValidate: boolean;
} {
  try {
    const evalCase = loadCase(evalCaseId);
    return {
      maxRetries: evalCase.successCriteria.maxRetries ?? null,
      maxUserTurns: evalCase.successCriteria.maxUserTurns ?? null,
      maxLatencyMs: evalCase.successCriteria.maxLatencyMs ?? null,
      mustValidate: evalCase.successCriteria.mustValidate === true,
    };
  } catch {
    return {
      maxRetries: null,
      maxUserTurns: null,
      maxLatencyMs: null,
      mustValidate: false,
    };
  }
}
