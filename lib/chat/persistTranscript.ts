import type { UIMessageWire } from "./transcriptSchema";

export type TranscriptFinishFlags = {
  isAbort: boolean;
  isDisconnect: boolean;
  isError: boolean;
};

/** Whether an onFinish event should trigger a transcript PUT (W3). */
export function shouldPersistTranscript(
  flags: TranscriptFinishFlags,
  messageCount: number,
): boolean {
  if (messageCount < 1) {
    return false;
  }
  if (flags.isAbort || flags.isDisconnect) {
    return true;
  }
  if (flags.isError) {
    return false;
  }
  return true;
}

function transcriptPutUrl(sessionId: string): string {
  return `/api/chat/sessions/${encodeURIComponent(sessionId)}/transcript`;
}

/** Fire-and-forget PUT of the full wire-format transcript snapshot. */
export function putChatTranscript(
  sessionId: string,
  messages: UIMessageWire[],
): void {
  if (!sessionId || messages.length === 0) {
    return;
  }

  void fetch(transcriptPutUrl(sessionId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `[chat] Transcript PUT failed (${response.status}) for ${sessionId}:`,
        body || response.statusText,
      );
    }
  }).catch((error: unknown) => {
    console.error("[chat] Transcript PUT request failed:", error);
  });
}
