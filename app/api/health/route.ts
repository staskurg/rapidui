import { NextResponse } from "next/server";

import { recordDiscoveryEvent } from "@/lib/observe/telemetry";
import { assertSessionId } from "@/lib/observe/session-gate";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const gate = assertSessionId(request);
  if (!gate.ok) {
    return NextResponse.json(gate.error, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  await recordDiscoveryEvent({ request, endpoint: "/api/health", startedAt });
  return response;
}
