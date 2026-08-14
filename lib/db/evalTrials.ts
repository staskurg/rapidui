import { sql } from "./client";
import type { AssertionResult } from "../../eval/types";

import type { FailureOwner, RunState } from "../eval/runnerTypes";

export type InsertEvalTrialInput = {
  id: string;
  experimentId: string;
  trialIndex: number;
  sessionId: string;
  evalCaseId: string;
  caseHash: string;
  agent: string;
  baseUrl: string;
  model?: string | null;
  provider?: string | null;
  promptVersion?: string | null;
  promptHash?: string | null;
  evalMode: string;
  gitCommit?: string | null;
  gitDirty?: boolean | null;
  runnerVersion?: string | null;
  validationVersion?: string | null;
  registryVersion?: string | null;
  passed: boolean | null;
  runState: RunState;
  failureOwner?: FailureOwner;
  failureStage?: string | null;
  failureCode?: string | null;
  failureDetail?: string | null;
  finalSpecId?: string | null;
  contentHash?: string | null;
  assertionResults: AssertionResult[];
  userTurns: number;
  validateAttempts: number;
  validationFailures: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
  mustValidateMet?: boolean | null;
  transcript?: unknown[] | null;
  baselineExperimentId?: string | null;
  startedAt: string;
  completedAt: string;
};

export type EvalTrialRecord = {
  id: string;
  experiment_id: string;
  trial_index: number;
  session_id: string;
  eval_case_id: string;
  case_hash: string;
  agent: string;
  base_url: string;
  model: string | null;
  provider: string | null;
  prompt_version: string | null;
  prompt_hash: string | null;
  eval_mode: string;
  git_commit: string | null;
  git_dirty: boolean | null;
  runner_version: string | null;
  validation_version: string | null;
  registry_version: string | null;
  passed: boolean | null;
  run_state: RunState;
  failure_owner: FailureOwner;
  failure_stage: string | null;
  failure_code: string | null;
  failure_detail: string | null;
  final_spec_id: string | null;
  content_hash: string | null;
  assertion_results: AssertionResult[];
  user_turns: number;
  validate_attempts: number;
  validation_failures: number;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  must_validate_met: boolean | null;
  transcript_jsonb: unknown[] | null;
  conversation_scores: unknown | null;
  baseline_experiment_id: string | null;
  started_at: Date;
  completed_at: Date;
};

export type ListEvalTrialsOptions = {
  experimentId?: string;
  evalCaseId?: string;
  runState?: RunState;
  passed?: boolean;
  limit?: number;
};

function rowToRecord(row: Record<string, unknown>): EvalTrialRecord {
  return {
    id: String(row.id),
    experiment_id: String(row.experiment_id),
    trial_index: Number(row.trial_index),
    session_id: String(row.session_id),
    eval_case_id: String(row.eval_case_id),
    case_hash: String(row.case_hash),
    agent: String(row.agent),
    base_url: String(row.base_url),
    model: row.model ? String(row.model) : null,
    provider: row.provider ? String(row.provider) : null,
    prompt_version: row.prompt_version ? String(row.prompt_version) : null,
    prompt_hash: row.prompt_hash ? String(row.prompt_hash) : null,
    eval_mode: String(row.eval_mode),
    git_commit: row.git_commit ? String(row.git_commit) : null,
    git_dirty: row.git_dirty === null ? null : Boolean(row.git_dirty),
    runner_version: row.runner_version ? String(row.runner_version) : null,
    validation_version: row.validation_version
      ? String(row.validation_version)
      : null,
    registry_version: row.registry_version ? String(row.registry_version) : null,
    passed: row.passed === null ? null : Boolean(row.passed),
    run_state: String(row.run_state) as RunState,
    failure_owner: (row.failure_owner as FailureOwner) ?? null,
    failure_stage: row.failure_stage ? String(row.failure_stage) : null,
    failure_code: row.failure_code ? String(row.failure_code) : null,
    failure_detail: row.failure_detail ? String(row.failure_detail) : null,
    final_spec_id: row.final_spec_id ? String(row.final_spec_id) : null,
    content_hash: row.content_hash ? String(row.content_hash) : null,
    assertion_results: Array.isArray(row.assertion_results)
      ? (row.assertion_results as AssertionResult[])
      : [],
    user_turns: Number(row.user_turns),
    validate_attempts: Number(row.validate_attempts),
    validation_failures: Number(row.validation_failures),
    tokens_in: row.tokens_in === null ? null : Number(row.tokens_in),
    tokens_out: row.tokens_out === null ? null : Number(row.tokens_out),
    latency_ms: row.latency_ms === null ? null : Number(row.latency_ms),
    must_validate_met:
      row.must_validate_met === null ? null : Boolean(row.must_validate_met),
    transcript_jsonb: Array.isArray(row.transcript_jsonb)
      ? (row.transcript_jsonb as unknown[])
      : null,
    conversation_scores: row.conversation_scores ?? null,
    baseline_experiment_id: row.baseline_experiment_id
      ? String(row.baseline_experiment_id)
      : null,
    started_at:
      row.started_at instanceof Date
        ? row.started_at
        : new Date(String(row.started_at)),
    completed_at:
      row.completed_at instanceof Date
        ? row.completed_at
        : new Date(String(row.completed_at)),
  };
}

/** Append-only insert — eval trials are immutable snapshots. */
export async function insertEvalTrial(
  input: InsertEvalTrialInput,
): Promise<EvalTrialRecord> {
  const result = await sql`
    INSERT INTO eval_trials (
      id,
      experiment_id,
      trial_index,
      session_id,
      eval_case_id,
      case_hash,
      agent,
      base_url,
      model,
      provider,
      prompt_version,
      prompt_hash,
      eval_mode,
      git_commit,
      git_dirty,
      runner_version,
      validation_version,
      registry_version,
      passed,
      run_state,
      failure_owner,
      failure_stage,
      failure_code,
      failure_detail,
      final_spec_id,
      content_hash,
      assertion_results,
      user_turns,
      validate_attempts,
      validation_failures,
      tokens_in,
      tokens_out,
      latency_ms,
      must_validate_met,
      transcript_jsonb,
      baseline_experiment_id,
      started_at,
      completed_at
    )
    VALUES (
      ${input.id},
      ${input.experimentId},
      ${input.trialIndex},
      ${input.sessionId},
      ${input.evalCaseId},
      ${input.caseHash},
      ${input.agent},
      ${input.baseUrl},
      ${input.model ?? null},
      ${input.provider ?? null},
      ${input.promptVersion ?? null},
      ${input.promptHash ?? null},
      ${input.evalMode},
      ${input.gitCommit ?? null},
      ${input.gitDirty ?? null},
      ${input.runnerVersion ?? null},
      ${input.validationVersion ?? null},
      ${input.registryVersion ?? null},
      ${input.passed},
      ${input.runState},
      ${input.failureOwner ?? null},
      ${input.failureStage ?? null},
      ${input.failureCode ?? null},
      ${input.failureDetail ?? null},
      ${input.finalSpecId ?? null},
      ${input.contentHash ?? null},
      ${JSON.stringify(input.assertionResults)}::jsonb,
      ${input.userTurns},
      ${input.validateAttempts},
      ${input.validationFailures},
      ${input.tokensIn ?? null},
      ${input.tokensOut ?? null},
      ${input.latencyMs ?? null},
      ${input.mustValidateMet ?? null},
      ${input.transcript ? JSON.stringify(input.transcript) : null}::jsonb,
      ${input.baselineExperimentId ?? null},
      ${input.startedAt},
      ${input.completedAt}
    )
    RETURNING *
  `;

  const row = result.rows[0];
  if (!row) {
    throw new Error("INSERT INTO eval_trials returned no row");
  }

  return rowToRecord(row);
}

export async function getEvalTrialById(id: string): Promise<EvalTrialRecord | null> {
  const result = await sql`
    SELECT *
    FROM eval_trials
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = result.rows[0];
  return row ? rowToRecord(row) : null;
}

export async function listEvalTrials(
  options: ListEvalTrialsOptions = {},
): Promise<EvalTrialRecord[]> {
  const limit = options.limit ?? 100;

  if (options.experimentId && options.evalCaseId) {
    const result = await sql`
      SELECT *
      FROM eval_trials
      WHERE experiment_id = ${options.experimentId}
        AND eval_case_id = ${options.evalCaseId}
      ORDER BY trial_index ASC, started_at DESC
      LIMIT ${limit}
    `;
    return result.rows.map((row) => rowToRecord(row));
  }

  if (options.experimentId) {
    const result = await sql`
      SELECT *
      FROM eval_trials
      WHERE experiment_id = ${options.experimentId}
      ORDER BY trial_index ASC, started_at DESC
      LIMIT ${limit}
    `;
    return result.rows.map((row) => rowToRecord(row));
  }

  if (options.evalCaseId) {
    const result = await sql`
      SELECT *
      FROM eval_trials
      WHERE eval_case_id = ${options.evalCaseId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return result.rows.map((row) => rowToRecord(row));
  }

  if (options.runState !== undefined && options.passed !== undefined) {
    const result = await sql`
      SELECT *
      FROM eval_trials
      WHERE run_state = ${options.runState}
        AND passed = ${options.passed}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return result.rows.map((row) => rowToRecord(row));
  }

  const result = await sql`
    SELECT *
    FROM eval_trials
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return result.rows.map((row) => rowToRecord(row));
}

export async function listEvalTrialsByExperiment(
  experimentId: string,
): Promise<EvalTrialRecord[]> {
  return listEvalTrials({ experimentId, limit: 500 });
}
