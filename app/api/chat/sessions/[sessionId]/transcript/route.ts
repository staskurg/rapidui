import { NextResponse } from "next/server";

import {
  isTranscriptPayloadTooLarge,
  parseChatSessionId,
  transcriptPutBodySchema,
} from "@/lib/chat/transcriptSchema";
import {
  getChatTranscript,
  upsertChatTranscript,
} from "@/lib/chat/transcriptWrites";
import { STORAGE_UNAVAILABLE_RESPONSE } from "@/lib/db";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

function invalidSessionIdResponse() {
  return NextResponse.json(
    {
      error: "INVALID_SESSION_ID",
      message: "sessionId must be a non-empty string.",
    },
    { status: 400 },
  );
}

function invalidJsonResponse() {
  return NextResponse.json(
    {
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    },
    { status: 400 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { sessionId: rawSessionId } = await context.params;
  const sessionId = parseChatSessionId(rawSessionId);
  if (!sessionId) {
    return invalidSessionIdResponse();
  }

  try {
    const transcript = await getChatTranscript(sessionId);
    if (!transcript) {
      return NextResponse.json(
        {
          error: "SESSION_NOT_FOUND",
          message: "No session exists for this id.",
          sessionId,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(transcript, { status: 200 });
  } catch (error) {
    console.error("[chat] Transcript GET failed:", error);
    return NextResponse.json(STORAGE_UNAVAILABLE_RESPONSE, { status: 503 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { sessionId: rawSessionId } = await context.params;
  const sessionId = parseChatSessionId(rawSessionId);
  if (!sessionId) {
    return invalidSessionIdResponse();
  }

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
    return invalidJsonResponse();
  }

  const parsed = transcriptPutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_TRANSCRIPT",
        message: "Transcript payload failed validation.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (isTranscriptPayloadTooLarge(parsed.data.messages)) {
    return NextResponse.json(
      {
        error: "PAYLOAD_TOO_LARGE",
        message: "Transcript payload exceeds the 512 KB limit.",
      },
      { status: 413 },
    );
  }

  try {
    const result = await upsertChatTranscript(sessionId, parsed.data.messages);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[chat] Transcript PUT failed:", error);
    return NextResponse.json(STORAGE_UNAVAILABLE_RESPONSE, { status: 503 });
  }
}
