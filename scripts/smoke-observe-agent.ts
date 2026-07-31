import { randomUUID } from "node:crypto";

import { sql } from "../lib/db/client";
import { TELEMETRY_HEADERS } from "../lib/observe/headers";
import { recordApiEvent } from "../lib/observe/telemetry";
import {
  AGENT_STALE_SESSION_MS,
  countPlatformApiCalls,
  countValidateAttempts,
  getAgentObserveSummary,
  getAgentRunDetail,
  getAgentRunExists,
  listAgentRuns,
  resolveAgentRunOutcome,
} from "../lib/observe/queries";
import { ingestAgentTelemetry } from "../lib/observe/writes";
import { validateSpec } from "../lib/validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeObserveAgent(): Promise<void> {
  // --- Terminal outcomes + downgrade guard ---
  const savedSessionId = `smoke-agent-saved-${randomUUID()}`;
  await ingestAgentTelemetry({
    session_id: savedSessionId,
    run: { outcome: "saved", validate_attempts: 2, total_tokens: 100, latency_ms: 5000 },
    turns: [{ turn_index: 0, latency_ms: 5000, had_save: true }],
  });

  await ingestAgentTelemetry({
    session_id: savedSessionId,
    run: { outcome: "abandoned" },
  });

  const savedRun = await sql`
    SELECT outcome FROM agent_runs WHERE session_id = ${savedSessionId}
  `;
  assert(savedRun.rows[0]?.outcome === "saved", "Downgrade guard: saved must not become abandoned");

  const failedSessionId = `smoke-agent-failed-${randomUUID()}`;
  await ingestAgentTelemetry({
    session_id: failedSessionId,
    run: {
      outcome: "failed",
      error_summary: "transport error",
      total_tokens: 50,
      latency_ms: 2000,
    },
  });

  const failedRun = await sql`
    SELECT outcome, finished_at FROM agent_runs WHERE session_id = ${failedSessionId}
  `;
  assert(failedRun.rows[0]?.outcome === "failed", "Expected failed outcome");
  assert(failedRun.rows[0]?.finished_at, "Failed run should set finished_at");

  const abandonedSessionId = `smoke-agent-abandoned-${randomUUID()}`;
  await ingestAgentTelemetry({
    session_id: abandonedSessionId,
    run: { outcome: "abandoned" },
    turns: [{ turn_index: 0, latency_ms: 800, had_validate_call: true }],
  });

  const abandonedRun = await sql`
    SELECT outcome FROM agent_runs WHERE session_id = ${abandonedSessionId}
  `;
  assert(abandonedRun.rows[0]?.outcome === "abandoned", "Expected abandoned outcome");

  // --- Stale-session inference ---
  const staleAt = new Date(Date.now() - AGENT_STALE_SESSION_MS - 60_000);
  assert(
    resolveAgentRunOutcome(null, staleAt) === "abandoned_inferred",
    "Stale null outcome should infer abandoned",
  );
  assert(
    resolveAgentRunOutcome(null, new Date()) === "in_progress",
    "Recent null outcome should be in progress",
  );

  // --- http_status persisted ---
  const httpSessionId = `smoke-agent-http-${randomUUID()}`;
  const request = new Request("http://localhost/api/validate", {
    method: "POST",
    headers: {
      [TELEMETRY_HEADERS.sessionId]: httpSessionId,
      [TELEMETRY_HEADERS.agent]: "smoke-observe-agent",
    },
    body: JSON.stringify({ invalid: true }),
  });

  const invalidResult = validateSpec({ definitely: "not-rui" });
  await recordApiEvent({
    request,
    endpoint: "/api/validate",
    result: invalidResult,
    httpStatus: 400,
    startedAt: Date.now(),
  });

  const httpRow = await sql`
    SELECT http_status FROM api_events
    WHERE session_id = ${httpSessionId}
    ORDER BY occurred_at DESC
    LIMIT 1
  `;
  assert(httpRow.rows[0]?.http_status === 400, "http_status should be persisted on api_events");

  // --- Validate + platform call counts ---
  await sql`
    INSERT INTO api_events (
      endpoint, session_id, agent, eval_case_id, intent,
      valid, error_codes, spec_id, duration_ms, http_status
    )
    VALUES (
      '/api/validate', ${abandonedSessionId}, 'smoke-observe-agent', NULL, NULL,
      FALSE, ARRAY['TEST'], NULL, 10, 200
    )
  `;

  const validateCount = await countValidateAttempts(abandonedSessionId);
  assert(validateCount >= 1, "countValidateAttempts should count validate rows");

  const platformCalls = await countPlatformApiCalls(abandonedSessionId);
  assert(platformCalls >= 1, "countPlatformApiCalls should count all api_events");

  // --- Query layer shape ---
  const summary = await getAgentObserveSummary();
  assert(typeof summary.runCount === "number", "getAgentObserveSummary returns runCount");

  const runs = await listAgentRuns({}, 5);
  assert(Array.isArray(runs), "listAgentRuns returns array");

  const detail = await getAgentRunDetail(abandonedSessionId);
  assert(detail !== null, "getAgentRunDetail should find abandoned session");
  assert(detail.run.outcome === "abandoned", "Detail outcome should be abandoned");

  const exists = await getAgentRunExists(abandonedSessionId);
  assert(exists, "getAgentRunExists should return true");

  const missing = await getAgentRunExists(`missing-${randomUUID()}`);
  assert(!missing, "getAgentRunExists should return false for unknown session");

  console.log("Observe agent smoke test passed:");
  console.log(`- terminal outcomes (saved/failed/abandoned)`);
  console.log(`- downgrade guard on session ${savedSessionId.slice(0, 20)}…`);
  console.log(`- http_status=400 on session ${httpSessionId.slice(0, 20)}…`);
  console.log(`- query helpers + stale inference (${AGENT_STALE_SESSION_MS}ms)`);
}

runSmokeObserveAgent().catch((error: unknown) => {
  console.error("Observe agent smoke test failed:", error);
  process.exit(1);
});
