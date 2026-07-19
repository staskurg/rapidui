import { NextResponse } from "next/server";

import { getSchemaPayload } from "@/lib/operations";

export async function GET() {
  return NextResponse.json(getSchemaPayload(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
