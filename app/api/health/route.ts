import { NextResponse } from "next/server";

import { recordDiscoveryEvent } from "@/lib/observe/telemetry";

/** Platform liveness — no session required (monitoring / curl). Optional session for Observe. */
export async function GET(request: Request) {
  const startedAt = Date.now();
  const response = NextResponse.json({ ok: true });
  await recordDiscoveryEvent({ request, endpoint: "/api/health", startedAt });
  return response;
}
