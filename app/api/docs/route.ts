import { NextResponse } from "next/server";

import { getDocsPayload } from "@/lib/docs";
import { recordDiscoveryEvent } from "@/lib/observe/telemetry";
import { assertSessionId } from "@/lib/observe/session-gate";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const gate = assertSessionId(request);
  if (!gate.ok) {
    return NextResponse.json(gate.error, { status: 400 });
  }

  const response = NextResponse.json(getDocsPayload(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });

  await recordDiscoveryEvent({ request, endpoint: "/api/docs", startedAt });
  return response;
}
