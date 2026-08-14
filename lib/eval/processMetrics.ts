import { sql } from "@/lib/db/client";
import {
  countPlatformApiCalls,
  countValidateAttempts,
  getAgentRunDetail,
} from "@/lib/observe/queries";

import type { ProcessMetrics } from "./runnerTypes";

export type ExtendedProcessMetrics = ProcessMetrics & {
  validationFailures: number;
  tokensIn: number | null;
  tokensOut: number | null;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number.parseInt(value, 10) || 0;
  }
  return 0;
}

/** Count api_events with transport or gate failures for a session. */
export async function countInfraFailures(sessionId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) AS cnt
    FROM api_events
    WHERE session_id = ${sessionId}
      AND http_status IS NOT NULL
      AND endpoint != '/api/validate'
      AND (http_status >= 500 OR http_status = 400)
  `;
  return toNumber(result.rows[0]?.cnt);
}

/** Count failed validate calls for a session. */
export async function countValidationFailures(sessionId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) AS cnt
    FROM api_events
    WHERE session_id = ${sessionId}
      AND endpoint = '/api/validate'
      AND valid = false
  `;
  return toNumber(result.rows[0]?.cnt);
}

/** Sum per-turn token usage from agent_turns when available. */
export async function getSessionTokenTotals(
  sessionId: string,
): Promise<{ tokensIn: number; tokensOut: number } | null> {
  const result = await sql`
    SELECT
      COALESCE(SUM(at.input_tokens), 0) AS tokens_in,
      COALESCE(SUM(at.output_tokens), 0) AS tokens_out
    FROM agent_turns at
    INNER JOIN agent_runs ar ON ar.id = at.run_id
    WHERE ar.session_id = ${sessionId}
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const tokensIn = toNumber(row.tokens_in);
  const tokensOut = toNumber(row.tokens_out);
  if (tokensIn === 0 && tokensOut === 0) {
    return null;
  }

  return { tokensIn, tokensOut };
}

/** Pull process numbers for an eval trial — primary authority is api_events. */
export async function collectProcessMetrics(
  sessionId: string,
): Promise<ProcessMetrics> {
  const extended = await collectExtendedProcessMetrics(sessionId);
  return {
    validateAttempts: extended.validateAttempts,
    platformApiCalls: extended.platformApiCalls,
    latencyMs: extended.latencyMs,
    agentOutcome: extended.agentOutcome,
    infraFailureCount: extended.infraFailureCount,
  };
}

/** Extended process metrics for eval_trials persistence. */
export async function collectExtendedProcessMetrics(
  sessionId: string,
): Promise<ExtendedProcessMetrics> {
  const [
    validateAttempts,
    platformApiCalls,
    infraFailureCount,
    validationFailures,
    tokenTotals,
    runDetail,
    outcomeResult,
  ] = await Promise.all([
    countValidateAttempts(sessionId),
    countPlatformApiCalls(sessionId),
    countInfraFailures(sessionId),
    countValidationFailures(sessionId),
    getSessionTokenTotals(sessionId),
    getAgentRunDetail(sessionId),
    sql`SELECT outcome FROM agent_runs WHERE session_id = ${sessionId} LIMIT 1`,
  ]);

  const agentOutcome = outcomeResult.rows[0]?.outcome
    ? String(outcomeResult.rows[0].outcome)
    : null;

  return {
    validateAttempts,
    platformApiCalls,
    latencyMs: runDetail?.run.latencyMs ?? null,
    agentOutcome,
    infraFailureCount,
    validationFailures,
    tokensIn: tokenTotals?.tokensIn ?? null,
    tokensOut: tokenTotals?.tokensOut ?? null,
  };
}
