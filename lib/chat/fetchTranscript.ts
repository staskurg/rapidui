import type { UIMessageWire } from "./transcriptSchema";

export type FetchedChatTranscript = {
  sessionId: string;
  messages: UIMessageWire[];
  updatedAt: string | null;
  turnCount: number;
};

export type FetchChatTranscriptResult =
  | { status: "ok"; transcript: FetchedChatTranscript }
  | { status: "not-found" }
  | { status: "unavailable" };

/** Client-side GET for transcript restore (Phase C). */
export async function fetchChatTranscript(
  sessionId: string,
): Promise<FetchChatTranscriptResult> {
  try {
    const response = await fetch(
      `/api/chat/sessions/${encodeURIComponent(sessionId)}/transcript`,
      { method: "GET", cache: "no-store" },
    );

    if (response.status === 404) {
      return { status: "not-found" };
    }

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const body = (await response.json()) as FetchedChatTranscript;
    return {
      status: "ok",
      transcript: {
        sessionId: body.sessionId,
        messages: Array.isArray(body.messages) ? body.messages : [],
        updatedAt: body.updatedAt ?? null,
        turnCount: typeof body.turnCount === "number" ? body.turnCount : 0,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
