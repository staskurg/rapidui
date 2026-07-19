import { randomUUID } from "node:crypto";

import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import { insertSpec } from "../lib/db/specs";
import { sql } from "../lib/db/client";
import { insertApiEvent } from "../lib/observe/writes";
import {
  getApiObserveSummary,
  getObserveHubSummary,
  getSessionTimeline,
  listRecentSessions,
  resolveSessionOutcome,
} from "../lib/observe/queries";
import { validateSpec } from "../lib/validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeObserveApi(): Promise<void> {
  const sessionId = `observe-api-smoke-${randomUUID()}`;
  const agent = "smoke-observe-api";
  const evalCaseId = "static-browse-v0.2";

  const goldenResult = validateSpec(uc1Golden);
  assert(goldenResult.valid, "UC1 golden RUI should validate");

  const savedSpec = await insertSpec(goldenResult.normalizedRui, {
    validationVersion: goldenResult.validationVersion,
    registryVersion: goldenResult.registryVersion,
  });

  await insertApiEvent({
    endpoint: "/api/validate",
    session_id: sessionId,
    agent,
    eval_case_id: evalCaseId,
    intent: "smoke",
    valid: false,
    error_codes: ["O18"],
    spec_id: null,
    duration_ms: 120,
  });

  await insertApiEvent({
    endpoint: "/api/validate",
    session_id: sessionId,
    agent,
    eval_case_id: evalCaseId,
    intent: "smoke",
    valid: true,
    error_codes: null,
    spec_id: null,
    duration_ms: 95,
  });

  const specId = savedSpec.specId;
  await insertApiEvent({
    endpoint: "/api/specs",
    session_id: sessionId,
    agent,
    eval_case_id: evalCaseId,
    intent: "smoke",
    valid: true,
    error_codes: null,
    spec_id: specId,
    duration_ms: 210,
  });

  const hub = await getObserveHubSummary();
  assert(hub.apiRequestCount >= 3, "Hub summary should include seeded POST events");
  assert(hub.specsSaved >= 1, "Hub summary should count saved specs");

  const apiSummary = await getApiObserveSummary({ session: sessionId });
  assert(apiSummary.sessionCount === 1, "Filtered API summary should find one session");
  assert(Number(apiSummary.avgTriesBeforeSave) === 2, "Avg tries before save should be 2 for seeded session");
  assert(apiSummary.specsSaved >= 1, "API summary should count saved specs");

  const sessions = await listRecentSessions({ session: sessionId });
  assert(sessions.length === 1, "Recent sessions should return seeded session");
  assert(sessions[0]?.sessionId === sessionId, "Session id should match seed");
  assert(sessions[0]?.validateCount === 2, "Session should have two validate events");
  assert(sessions[0]?.outcome === "saved", "Session outcome should be saved");
  assert(sessions[0]?.finalSpecId === specId, "Session should reference saved spec id");

  const timeline = await getSessionTimeline(sessionId);
  assert(timeline.length === 3, "Timeline should include fail → pass → save");
  assert(timeline[0]?.endpoint === "/api/validate", "First event should be validate");
  assert(timeline[0]?.valid === false, "First validate should fail");
  assert(timeline[1]?.valid === true, "Second validate should pass");
  assert(timeline[2]?.endpoint === "/api/specs", "Third event should be save");
  assert(timeline[2]?.spec_id === specId, "Save event should include spec id");

  const saved = true;
  const lastValidateValid = true;
  assert(
    resolveSessionOutcome(saved, lastValidateValid) === "saved",
    "Outcome helper should mark saved sessions",
  );
  assert(
    resolveSessionOutcome(false, false) === "failed",
    "Outcome helper should mark failed sessions",
  );
  assert(
    resolveSessionOutcome(false, null) === "in_progress",
    "Outcome helper should mark in-progress sessions",
  );

  await sql`
    DELETE FROM api_events
    WHERE session_id = ${sessionId}
  `;

  await sql`
    DELETE FROM specs
    WHERE id = ${specId}
  `;

  console.log("Observe API smoke test passed:");
  console.log(`- hub + API summary queries for session ${sessionId}`);
  console.log("- listRecentSessions + getSessionTimeline counts matched seed");
  console.log("- seeded rows cleaned up");
}

runSmokeObserveApi().catch((error: unknown) => {
  console.error("Observe API smoke test failed:", error);
  process.exit(1);
});
