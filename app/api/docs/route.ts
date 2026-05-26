import { NextResponse } from "next/server";

import { getDocsPayload } from "@/lib/docs";

export async function GET() {
  return NextResponse.json(getDocsPayload(), {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
