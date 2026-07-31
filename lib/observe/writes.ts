export {
  agentIngestPayloadSchema,
  apiEventInputSchema,
  type AgentIngestPayload,
  type AgentRunPayload,
  type AgentTurnPayload,
  type ApiEventInput,
} from "./schemas";

import { sql } from "@/lib/db/client";

import {
  agentIngestPayloadSchema,
  apiEventInputSchema,
  type AgentIngestPayload,
  type AgentRunPayload,
  type AgentTurnPayload,
  type ApiEventInput,
} from "./schemas";

function rowId(row: Record<string, unknown> | undefined): string {
  if (!row?.id) {
    throw new Error("Expected RETURNING id from observe insert");
  }
  return String(row.id);
}

function resolveFinishedAt(run?: AgentRunPayload): Date | null {
  if (!run) {
    return null;
  }
  if (run.finished_at) {
    return new Date(run.finished_at);
  }
  if (run.outcome) {
    return new Date();
  }
  return null;
}

/** Persist one api_events row (validate/save telemetry). */
export async function insertApiEvent(input: ApiEventInput): Promise<{ id: string }> {
  const parsed = apiEventInputSchema.parse(input);

  const result = await sql`
    INSERT INTO api_events (
      endpoint,
      session_id,
      agent,
      eval_case_id,
      intent,
      valid,
      error_codes,
      spec_id,
      duration_ms,
      http_status
    )
    VALUES (
      ${parsed.endpoint},
      ${parsed.session_id},
      ${parsed.agent},
      ${parsed.eval_case_id},
      ${parsed.intent},
      ${parsed.valid},
      ${parsed.error_codes},
      ${parsed.spec_id},
      ${parsed.duration_ms},
      ${parsed.http_status ?? null}
    )
    RETURNING id
  `;

  return { id: rowId(result.rows[0]) };
}

/** Upsert agent_runs by session_id — merges non-null run fields on conflict. */
export async function upsertAgentRun(
  sessionId: string,
  run?: AgentRunPayload,
): Promise<{ id: string; sessionId: string }> {
  const startedAt = run?.started_at ? new Date(run.started_at) : null;
  const finishedAt = resolveFinishedAt(run);

  const result = await sql`
    INSERT INTO agent_runs (
      session_id,
      started_at,
      finished_at,
      outcome,
      spec_id,
      validate_attempts,
      model,
      provider,
      prompt_version,
      eval_case_id,
      total_tokens,
      latency_ms,
      intent,
      error_summary
    )
    VALUES (
      ${sessionId},
      COALESCE(${startedAt}, NOW()),
      ${finishedAt},
      ${run?.outcome ?? null},
      ${run?.spec_id ?? null},
      ${run?.validate_attempts ?? null},
      ${run?.model ?? null},
      ${run?.provider ?? null},
      ${run?.prompt_version ?? null},
      ${run?.eval_case_id ?? null},
      ${run?.total_tokens ?? null},
      ${run?.latency_ms ?? null},
      ${run?.intent ?? null},
      ${run?.error_summary ?? null}
    )
    ON CONFLICT (session_id) DO UPDATE SET
      finished_at = COALESCE(EXCLUDED.finished_at, agent_runs.finished_at),
      outcome = CASE
        WHEN agent_runs.outcome = 'saved' AND EXCLUDED.outcome = 'abandoned'
          THEN agent_runs.outcome
        ELSE COALESCE(EXCLUDED.outcome, agent_runs.outcome)
      END,
      spec_id = COALESCE(EXCLUDED.spec_id, agent_runs.spec_id),
      validate_attempts = COALESCE(EXCLUDED.validate_attempts, agent_runs.validate_attempts),
      model = COALESCE(EXCLUDED.model, agent_runs.model),
      provider = COALESCE(EXCLUDED.provider, agent_runs.provider),
      prompt_version = COALESCE(EXCLUDED.prompt_version, agent_runs.prompt_version),
      eval_case_id = COALESCE(EXCLUDED.eval_case_id, agent_runs.eval_case_id),
      total_tokens = COALESCE(EXCLUDED.total_tokens, agent_runs.total_tokens),
      latency_ms = COALESCE(EXCLUDED.latency_ms, agent_runs.latency_ms),
      intent = COALESCE(EXCLUDED.intent, agent_runs.intent),
      error_summary = COALESCE(EXCLUDED.error_summary, agent_runs.error_summary)
    RETURNING id
  `;

  return { id: rowId(result.rows[0]), sessionId };
}

/** Upsert agent_turns by (run_id, turn_index). */
export async function upsertAgentTurn(
  runId: string,
  turn: AgentTurnPayload,
): Promise<{ id: string }> {
  const result = await sql`
    INSERT INTO agent_turns (
      run_id,
      turn_index,
      latency_ms,
      input_tokens,
      output_tokens,
      had_validate_call,
      had_save
    )
    VALUES (
      ${runId},
      ${turn.turn_index},
      ${turn.latency_ms ?? null},
      ${turn.input_tokens ?? null},
      ${turn.output_tokens ?? null},
      ${turn.had_validate_call ?? false},
      ${turn.had_save ?? false}
    )
    ON CONFLICT (run_id, turn_index) DO UPDATE SET
      latency_ms = EXCLUDED.latency_ms,
      input_tokens = EXCLUDED.input_tokens,
      output_tokens = EXCLUDED.output_tokens,
      had_validate_call = EXCLUDED.had_validate_call,
      had_save = EXCLUDED.had_save
    RETURNING id
  `;

  return { id: rowId(result.rows[0]) };
}

/** Ingest FastAPI agent telemetry — upsert run summary and optional turns. */
export async function ingestAgentTelemetry(
  payload: AgentIngestPayload,
): Promise<{ runId: string }> {
  const parsed = agentIngestPayloadSchema.parse(payload);
  const { session_id, run, turns } = parsed;

  const { id: runId } = await upsertAgentRun(session_id, run);

  if (turns?.length) {
    for (const turn of turns) {
      await upsertAgentTurn(runId, turn);
    }
  }

  return { runId };
}
