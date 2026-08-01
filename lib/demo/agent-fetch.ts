const AGENT_FETCH_TIMEOUT_MS = 30_000;

/** Fetch with a client-side timeout so chat does not hang on a dead agent. */
export async function fetchWithAgentTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGENT_FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
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
