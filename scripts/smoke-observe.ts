import { randomUUID } from "node:crypto";

import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import { sql } from "../lib/db/client";
import { getDocsPayload } from "../lib/docs";
import { TELEMETRY_HEADERS } from "../lib/observe/headers";
import {
  ingestAgentTelemetry,
  insertApiEvent,
} from "../lib/observe/writes";
import { recordApiEvent } from "../lib/observe/telemetry";
import { validateSpec } from "../lib/validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeObserve(): Promise<void> {
  const sessionId = `smoke-${randomUUID()}`;
  const request = new Request("http://localhost/api/validate", {
    method: "POST",
    headers: {
      [TELEMETRY_HEADERS.sessionId]: sessionId,
      [TELEMETRY_HEADERS.agent]: "smoke-test",
      [TELEMETRY_HEADERS.evalCaseId]: "static-browse-v0.2",
    },
  });

  const goldenResult = validateSpec(uc1Golden);
  assert(goldenResult.valid, "Golden RUI should validate");

  const startedAt = Date.now();
  await recordApiEvent({
    request,
    endpoint: "/api/validate",
    result: goldenResult,
    httpStatus: 200,
    startedAt,
  });

  const apiEvents = await sql`
    SELECT endpoint, session_id, agent, valid, spec_id
    FROM api_events
    WHERE session_id = ${sessionId}
    ORDER BY occurred_at DESC
    LIMIT 1
  `;
  assert(apiEvents.rows.length === 1, "Expected one api_events row for session");
  assert(apiEvents.rows[0]?.endpoint === "/api/validate", "Expected validate endpoint");
  assert(apiEvents.rows[0]?.agent === "smoke-test", "Expected agent header persisted");

  await insertApiEvent({
    endpoint: "/api/specs",
    session_id: sessionId,
    agent: "smoke-test",
    eval_case_id: "static-browse-v0.2",
    intent: null,
    valid: true,
    error_codes: null,
    spec_id: null,
    duration_ms: 12,
  });

  const ingestSessionId = `ingest-${randomUUID()}`;
  const firstIngest = await ingestAgentTelemetry({
    session_id: ingestSessionId,
    run: { outcome: "saved", validate_attempts: 1 },
    turns: [{ turn_index: 0, latency_ms: 100, had_validate_call: true }],
  });

  await ingestAgentTelemetry({
    session_id: ingestSessionId,
    run: { validate_attempts: 3, outcome: "saved" },
  });

  const runs = await sql`
    SELECT id, session_id, outcome, validate_attempts
    FROM agent_runs
    WHERE session_id = ${ingestSessionId}
  `;
  assert(runs.rows.length === 1, "Upsert should keep one agent_runs row");
  assert(runs.rows[0]?.validate_attempts === 3, "Upsert should merge validate_attempts");
  assert(runs.rows[0]?.id === firstIngest.runId, "runId should be stable across upserts");

  const turns = await sql`
    SELECT turn_index, had_validate_call
    FROM agent_turns
    WHERE run_id = ${firstIngest.runId}
  `;
  assert(turns.rows.length === 1, "Expected one agent_turns row");
  assert(turns.rows[0]?.turn_index === 0, "Expected turn_index 0");

  const docs = getDocsPayload();
  assert(docs.telemetry, "Docs payload should include telemetry section");
  assert(
    Array.isArray(docs.telemetry.headers) && docs.telemetry.headers.length === 4,
    "Telemetry section should document four headers",
  );
  assert(
    docs.telemetry.requiredHeaders.length === 1,
    "Telemetry section should require session id",
  );

  const apiSection = docs.sections.find((section) => section.id === "api")?.content as {
    validate?: { requiredHeaders?: unknown[] };
    specs?: { requiredHeaders?: unknown[] };
  };
  assert(apiSection?.validate?.requiredHeaders?.length === 1, "Validate API should list requiredHeaders");
  assert(apiSection?.specs?.requiredHeaders?.length === 1, "Specs API should list requiredHeaders");

  console.log("Observe smoke test passed:");
  console.log(`- api_events recorded for session ${sessionId}`);
  console.log(`- agent ingest upsert for session ${ingestSessionId}`);
  console.log("- /api/docs telemetry section present");
}

runSmokeObserve().catch((error: unknown) => {
  console.error("Observe smoke test failed:", error);
  process.exit(1);
});
