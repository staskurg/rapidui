import { sql } from "@/lib/db/client";
import {
  countPlatformApiCalls,
  countValidateAttempts,
  getAgentRunDetail,
} from "@/lib/observe/queries";

import type { ProcessMetrics } from "./runnerTypes";

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

/** Pull process numbers for an eval trial — primary authority is api_events. */
export async function collectProcessMetrics(
  sessionId: string,
): Promise<ProcessMetrics> {
  const [validateAttempts, platformApiCalls, infraFailureCount, runDetail, outcomeResult] =
    await Promise.all([
      countValidateAttempts(sessionId),
      countPlatformApiCalls(sessionId),
      countInfraFailures(sessionId),
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
  };
}
