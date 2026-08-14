import { sql } from "@/lib/db/client";
import { resolveObserveWindow } from "@/lib/observe/queries";
import {
  isOverProcessCap,
  queryEvalTrials,
  type EvalTrialsQueryInput,
} from "@/lib/eval/queryEvalTrials";
import type { TrialResultLabel } from "@/lib/eval/trialDisplay";

export type EvalExperimentSummary = {
  experiment_id: string;
  total_cases: number;
  passed: number;
  failed: number;
  incomplete: number;
  errors: number;
  started_at: Date;
  completed_at: Date;
  model: string | null;
  prompt_version: string | null;
  git_commit: string | null;
  baseline_experiment_id: string | null;
};

function rowToSummary(row: Record<string, unknown>): EvalExperimentSummary {
  return {
    experiment_id: String(row.experiment_id),
    total_cases: Number(row.total_cases ?? 0),
    passed: Number(row.passed ?? 0),
    failed: Number(row.failed ?? 0),
    incomplete: Number(row.incomplete ?? 0),
    errors: Number(row.errors ?? 0),
    started_at:
      row.started_at instanceof Date
        ? row.started_at
        : new Date(String(row.started_at)),
    completed_at:
      row.completed_at instanceof Date
        ? row.completed_at
        : new Date(String(row.completed_at)),
    model: row.model ? String(row.model) : null,
    prompt_version: row.prompt_version ? String(row.prompt_version) : null,
    git_commit: row.git_commit ? String(row.git_commit) : null,
    baseline_experiment_id: row.baseline_experiment_id
      ? String(row.baseline_experiment_id)
      : null,
  };
}

export function resolveExperimentOutcome(
  summary: Pick<
    EvalExperimentSummary,
    "total_cases" | "passed" | "failed" | "incomplete" | "errors"
  >,
): TrialResultLabel {
  if (summary.errors > 0) {
    return "Error";
  }
  if (summary.incomplete > 0) {
    return "Incomplete";
  }
  if (summary.failed > 0) {
    return "Fail";
  }
  if (summary.passed === summary.total_cases && summary.total_cases > 0) {
    return "Pass";
  }
  return "Fail";
}

export function formatExperimentPassRate(
  summary: Pick<EvalExperimentSummary, "total_cases" | "passed">,
): string {
  if (summary.total_cases === 0) {
    return "—";
  }
  const rate = (summary.passed / summary.total_cases) * 100;
  return `${rate.toFixed(0)}%`;
}

export async function queryEvalExperiments(
  input: EvalTrialsQueryInput = {},
): Promise<EvalExperimentSummary[]> {
  const limit = input.limit ?? 200;
  const { windowStart, windowEnd } = resolveObserveWindow({
    from: input.from,
    to: input.to,
  });

  const result = await sql`
    SELECT
      experiment_id,
      COUNT(*)::int AS total_cases,
      COUNT(*) FILTER (WHERE passed IS TRUE)::int AS passed,
      COUNT(*) FILTER (WHERE passed IS FALSE AND run_state = 'complete')::int AS failed,
      COUNT(*) FILTER (WHERE run_state = 'incomplete')::int AS incomplete,
      COUNT(*) FILTER (WHERE run_state = 'error')::int AS errors,
      MIN(started_at) AS started_at,
      MAX(completed_at) AS completed_at,
      MAX(model) AS model,
      MAX(prompt_version) AS prompt_version,
      MAX(git_commit) AS git_commit,
      MAX(baseline_experiment_id::text) AS baseline_experiment_id
    FROM eval_trials
    GROUP BY experiment_id
    HAVING MIN(started_at) >= ${windowStart}
      AND MIN(started_at) <= ${windowEnd}
    ORDER BY MAX(started_at) DESC
    LIMIT ${limit}
  `;

  let summaries = result.rows.map((row) =>
    rowToSummary(row as Record<string, unknown>),
  );

  const experimentSearch = input.experimentId?.trim();
  if (experimentSearch) {
    const needle = experimentSearch.toLowerCase();
    summaries = summaries.filter((summary) =>
      summary.experiment_id.toLowerCase().includes(needle),
    );
  }

  const hasTrialLevelFilters = Boolean(input.result) || Boolean(input.overCap);

  if (hasTrialLevelFilters) {
    const matchingTrials = await queryEvalTrials({
      ...input,
      limit: 10_000,
    });
    const matchingExperimentIds = new Set(
      matchingTrials.map((trial) => trial.experiment_id),
    );
    summaries = summaries.filter((summary) =>
      matchingExperimentIds.has(summary.experiment_id),
    );
  }

  return summaries;
}

export async function getEvalExperimentSummary(
  experimentId: string,
): Promise<EvalExperimentSummary | null> {
  const result = await sql`
    SELECT
      experiment_id,
      COUNT(*)::int AS total_cases,
      COUNT(*) FILTER (WHERE passed IS TRUE)::int AS passed,
      COUNT(*) FILTER (WHERE passed IS FALSE AND run_state = 'complete')::int AS failed,
      COUNT(*) FILTER (WHERE run_state = 'incomplete')::int AS incomplete,
      COUNT(*) FILTER (WHERE run_state = 'error')::int AS errors,
      MIN(started_at) AS started_at,
      MAX(completed_at) AS completed_at,
      MAX(model) AS model,
      MAX(prompt_version) AS prompt_version,
      MAX(git_commit) AS git_commit,
      MAX(baseline_experiment_id::text) AS baseline_experiment_id
    FROM eval_trials
    WHERE experiment_id = ${experimentId}
    GROUP BY experiment_id
    LIMIT 1
  `;

  const row = result.rows[0];
  return row ? rowToSummary(row as Record<string, unknown>) : null;
}

export type EvalObserveSummary = {
  experimentCount: number;
  totalCases: number;
  passedCases: number;
  passRate: number | null;
  failedCases: number;
  errorCases: number;
  incompleteCases: number;
  avgLatencyMs: number | null;
  p50LatencyMs: number | null;
  latencySampleSize: number;
  avgValidateAttempts: number | null;
  avgUserTurns: number | null;
  overCapCount: number;
};

function percentile(sortedValues: number[], percentile: number): number | null {
  if (sortedValues.length === 0) {
    return null;
  }

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)] ?? null;
}

function roundMetric(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getEvalObserveSummary(
  input: EvalTrialsQueryInput = {},
): Promise<EvalObserveSummary> {
  let trials = await queryEvalTrials({
    ...input,
    limit: 10_000,
  });

  const experimentSearch = input.experimentId?.trim();
  if (experimentSearch) {
    const needle = experimentSearch.toLowerCase();
    trials = trials.filter((trial) =>
      trial.experiment_id.toLowerCase().includes(needle),
    );
  }

  const experimentIds = new Set(trials.map((trial) => trial.experiment_id));
  const latencies = trials
    .map((trial) => trial.latency_ms)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const passedCases = trials.filter((trial) => trial.passed === true).length;
  const failedCases = trials.filter(
    (trial) => trial.passed === false && trial.run_state === "complete",
  ).length;

  return {
    experimentCount: experimentIds.size,
    totalCases: trials.length,
    passedCases,
    passRate: trials.length > 0 ? passedCases / trials.length : null,
    failedCases,
    errorCases: trials.filter((trial) => trial.run_state === "error").length,
    incompleteCases: trials.filter((trial) => trial.run_state === "incomplete").length,
    avgLatencyMs:
      latencies.length > 0
        ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
        : null,
    p50LatencyMs: percentile(latencies, 50),
    latencySampleSize: latencies.length,
    avgValidateAttempts:
      trials.length > 0
        ? roundMetric(
            trials.reduce((sum, trial) => sum + trial.validate_attempts, 0) / trials.length,
          )
        : null,
    avgUserTurns:
      trials.length > 0
        ? roundMetric(
            trials.reduce((sum, trial) => sum + trial.user_turns, 0) / trials.length,
          )
        : null,
    overCapCount: trials.filter((trial) => isOverProcessCap(trial)).length,
  };
}
