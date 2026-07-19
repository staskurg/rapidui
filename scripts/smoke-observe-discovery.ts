import { randomUUID } from "node:crypto";

import { GET as getDocs } from "../app/api/docs/route";
import { GET as getHealth } from "../app/api/health/route";
import { GET as getLlms } from "../app/llms.txt/route";
import { GET as getSchema } from "../app/api/schema/route";
import { POST as postSpecs } from "../app/api/specs/route";
import { POST as postValidate } from "../app/api/validate/route";

import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import { sql } from "../lib/db/client";
import { TELEMETRY_HEADERS } from "../lib/observe/headers";
import {
  getSessionFunnel,
  getSessionTimeline,
} from "../lib/observe/queries";
import { assertSessionId } from "../lib/observe/session-gate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sessionHeaders(sessionId: string): HeadersInit {
  return {
    [TELEMETRY_HEADERS.sessionId]: sessionId,
    [TELEMETRY_HEADERS.agent]: "smoke-observe-discovery",
    [TELEMETRY_HEADERS.evalCaseId]: "static-browse-v0.2",
  };
}

async function runSmokeObserveDiscovery(): Promise<void> {
  const sessionId = `observe-discovery-smoke-${randomUUID()}`;
  const startedAt = new Date();

  const missingDocsRequest = new Request("http://localhost/api/docs");
  const missingDocsResponse = await getDocs(missingDocsRequest);
  assert(missingDocsResponse.status === 400, "Missing session on /api/docs should return 400");
  const missingDocsBody = (await missingDocsResponse.json()) as {
    valid: boolean;
    errors: { code: string }[];
  };
  assert(missingDocsBody.valid === false, "Missing session body should have valid: false");
  assert(
    missingDocsBody.errors[0]?.code === "MISSING_SESSION_ID",
    "Missing session should return MISSING_SESSION_ID",
  );

  const gate = assertSessionId(missingDocsRequest);
  assert(!gate.ok, "assertSessionId should fail without header");

  const llmsResponse = await getLlms(new Request("http://localhost/llms.txt"));
  assert(llmsResponse.status === 200, "llms.txt without session should return 200");

  const anonymousLlms = await sql`
    SELECT session_id, endpoint
    FROM api_events
    WHERE endpoint = '/llms.txt'
    ORDER BY occurred_at DESC
    LIMIT 1
  `;
  assert(anonymousLlms.rows.length >= 1, "llms.txt should insert anonymous api_events row");
  assert(
    anonymousLlms.rows[0]?.session_id === null,
    "Anonymous llms.txt row should have null session_id",
  );

  const headers = sessionHeaders(sessionId);

  assert(
    (await getDocs(new Request("http://localhost/api/docs", { headers }))).status === 200,
    "GET /api/docs with session should return 200",
  );
  assert(
    (await getSchema(new Request("http://localhost/api/schema", { headers }))).status === 200,
    "GET /api/schema with session should return 200",
  );
  assert(
    (await getHealth(new Request("http://localhost/api/health", { headers }))).status === 200,
    "GET /api/health with session should return 200",
  );

  const validateResponse = await postValidate(
    new Request("http://localhost/api/validate", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(uc1Golden),
    }),
  );
  assert(validateResponse.status === 200, "Validate with session should succeed");

  const validateBody = (await validateResponse.json()) as {
    valid: boolean;
    normalizedRui?: unknown;
  };
  assert(validateBody.valid, "UC1 golden should validate via route");

  const saveResponse = await postSpecs(
    new Request("http://localhost/api/specs", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validateBody.normalizedRui),
    }),
  );
  assert(saveResponse.status === 201, "Save with session should return 201");
  const savedBody = (await saveResponse.json()) as { specId: string };

  const timeline = await getSessionTimeline(sessionId);
  assert(timeline.length >= 5, "Timeline should include docs, schema, health, validate, save");
  assert(
    timeline.some((event) => event.endpoint === "/api/docs"),
    "Timeline should include docs discovery",
  );
  assert(
    timeline.some((event) => event.endpoint === "/api/schema"),
    "Timeline should include schema discovery",
  );
  assert(
    timeline.some((event) => event.endpoint === "/api/validate"),
    "Timeline should include validate",
  );
  assert(
    timeline.some((event) => event.spec_id),
    "Timeline should include save with spec_id",
  );

  const funnel = await getSessionFunnel({ session: sessionId });
  assert(funnel.docs >= 1, "Funnel should show docs stage");
  assert(funnel.schema >= 1, "Funnel should show schema stage");
  assert(funnel.validate >= 1, "Funnel should show validate stage");
  assert(funnel.save >= 1, "Funnel should show save stage");

  await sql`
    DELETE FROM api_events
    WHERE session_id = ${sessionId}
  `;

  await sql`
    DELETE FROM api_events
    WHERE endpoint = '/llms.txt'
      AND session_id IS NULL
      AND occurred_at >= ${startedAt}
  `;

  await sql`
    DELETE FROM specs
    WHERE id = ${savedBody.specId}
  `;

  console.log("Observe discovery smoke test passed:");
  console.log(`- session gate + discovery routes for session ${sessionId}`);
  console.log("- anonymous llms.txt telemetry + full journey funnel/timeline");
  console.log("- seeded rows cleaned up");
}

runSmokeObserveDiscovery().catch((error: unknown) => {
  console.error("Observe discovery smoke test failed:", error);
  process.exit(1);
});
