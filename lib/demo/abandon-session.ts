/** Fire-and-forget terminal abandon for the prior chat session on New chat. */
export function abandonAgentSession(sessionId: string): void {
  void fetch("/api/observe/ingest/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      run: { outcome: "abandoned" },
    }),
  }).catch((error: unknown) => {
    console.error("[observe] Failed to abandon agent session:", error);
  });
}
