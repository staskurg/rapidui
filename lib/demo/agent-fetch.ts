import { normalizeWireMessages } from "@/lib/chat/normalizeWireMessages";
import type { UIMessageWire } from "@/lib/chat/transcriptSchema";

const AGENT_FETCH_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_AGENT_FETCH_TIMEOUT_MS ?? 60_000,
);

function normalizeAgentChatBody(body: BodyInit | null | undefined): BodyInit | null | undefined {
  if (typeof body !== "string") {
    return body;
  }

  try {
    const parsed = JSON.parse(body) as { messages?: UIMessageWire[] };
    if (!Array.isArray(parsed.messages)) {
      return body;
    }
    return JSON.stringify({
      ...parsed,
      messages: normalizeWireMessages(parsed.messages),
    });
  } catch {
    return body;
  }
}

/** Fetch with a client-side timeout so chat does not hang on a dead agent. */
export async function fetchWithAgentTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGENT_FETCH_TIMEOUT_MS);
  const requestInit: RequestInit = {
    ...init,
    signal: controller.signal,
    body: normalizeAgentChatBody(init?.body),
  };

  try {
    return await fetch(input, requestInit);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "Agent request timed out. Check that the agent is running and try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
