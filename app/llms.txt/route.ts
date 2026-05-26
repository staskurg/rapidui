import { NextResponse } from "next/server";

import { getLlmsTxt } from "@/lib/docs/llms";

export async function GET() {
  return new NextResponse(getLlmsTxt(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
