import { NextResponse } from "next/server";

import { validateFromRequest } from "@/lib/validate";

export async function POST(request: Request) {
  const result = await validateFromRequest(request);

  if (!("validationVersion" in result)) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: 200 });
}
