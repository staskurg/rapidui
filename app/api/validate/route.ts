import { NextResponse } from "next/server";

import { recordApiEvent } from "@/lib/observe/telemetry";
import { assertSessionId } from "@/lib/observe/session-gate";
import { validateFromRequest } from "@/lib/validate";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const gate = assertSessionId(request);
  if (!gate.ok) {
    return NextResponse.json(gate.error, { status: 400 });
  }

  const result = await validateFromRequest(request);

  if (!("validationVersion" in result)) {
    await recordApiEvent({
      request,
      endpoint: "/api/validate",
      result,
      httpStatus: 400,
      startedAt,
    });
    return NextResponse.json(result, { status: 400 });
  }

  await recordApiEvent({
    request,
    endpoint: "/api/validate",
    result,
    httpStatus: 200,
    startedAt,
  });
  return NextResponse.json(result, { status: 200 });
}
