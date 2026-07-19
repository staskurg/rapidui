import { NextResponse } from "next/server";

import { getLlmsTxt } from "@/lib/docs/llms";
import { recordDiscoveryEvent } from "@/lib/observe/telemetry";

export async function GET(request: Request) {
  const startedAt = Date.now();

  const response = new NextResponse(getLlmsTxt(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });

  await recordDiscoveryEvent({ request, endpoint: "/llms.txt", startedAt });
  return response;
}
