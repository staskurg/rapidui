import { NextResponse } from "next/server";

import { insertSpec, STORAGE_UNAVAILABLE_RESPONSE } from "@/lib/db";
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
      endpoint: "/api/specs",
      result,
      httpStatus: 400,
      startedAt,
    });
    return NextResponse.json(result, { status: 400 });
  }

  if (!result.valid) {
    await recordApiEvent({
      request,
      endpoint: "/api/specs",
      result,
      httpStatus: 200,
      startedAt,
    });
    return NextResponse.json(result, { status: 200 });
  }

  try {
    const saved = await insertSpec(result.normalizedRui, {
      validationVersion: result.validationVersion,
      registryVersion: result.registryVersion,
    });
    await recordApiEvent({
      request,
      endpoint: "/api/specs",
      result,
      httpStatus: 201,
      specId: saved.specId,
      startedAt,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch {
    await recordApiEvent({
      request,
      endpoint: "/api/specs",
      result,
      httpStatus: 503,
      startedAt,
    });
    return NextResponse.json(STORAGE_UNAVAILABLE_RESPONSE, { status: 503 });
  }
}
