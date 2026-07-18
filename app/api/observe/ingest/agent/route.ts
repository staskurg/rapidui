import { NextResponse } from "next/server";

import {
  agentIngestPayloadSchema,
  validateAgentIngestPayload,
} from "@/lib/observe/writes";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Request body must be application/json.",
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = agentIngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_INGEST_PAYLOAD",
        message: "Agent ingest payload failed validation.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    validateAgentIngestPayload(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "INVALID_INGEST_PAYLOAD",
        message: error instanceof Error ? error.message : "Invalid payload.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
