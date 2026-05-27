import { NextResponse } from "next/server";

import {
  getSpecById,
  isValidSpecId,
  STORAGE_UNAVAILABLE_RESPONSE,
} from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isValidSpecId(id)) {
    return NextResponse.json(
      {
        error: "INVALID_SPEC_ID",
        message: "specId must be a UUID.",
      },
      { status: 400 },
    );
  }

  try {
    const spec = await getSpecById(id);
    if (!spec) {
      return NextResponse.json(
        { error: "NOT_FOUND", specId: id },
        { status: 404 },
      );
    }

    return NextResponse.json(spec, { status: 200 });
  } catch {
    return NextResponse.json(STORAGE_UNAVAILABLE_RESPONSE, { status: 503 });
  }
}
