import { NextResponse } from "next/server";

import { insertSpec, STORAGE_UNAVAILABLE_RESPONSE } from "@/lib/db";
import { validateFromRequest } from "@/lib/validate";

export async function POST(request: Request) {
  const result = await validateFromRequest(request);

  if (!("validationVersion" in result)) {
    return NextResponse.json(result, { status: 400 });
  }

  if (!result.valid) {
    return NextResponse.json(result, { status: 200 });
  }

  try {
    const saved = await insertSpec(result.normalizedRui, {
      validationVersion: result.validationVersion,
      registryVersion: result.registryVersion,
    });
    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json(STORAGE_UNAVAILABLE_RESPONSE, { status: 503 });
  }
}
