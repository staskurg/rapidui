export type AgentChatErrorCopy = {
  title: string;
  hint: string;
};

const DEFAULT_ERROR: AgentChatErrorCopy = {
  title: "Something went wrong",
  hint: "Please try again.",
};

/** User-facing copy for agent chat transport failures. */
export function formatAgentChatError(_raw: string): AgentChatErrorCopy {
  const lower = _raw.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused")
  ) {
    return {
      title: "Service unavailable",
      hint: "Please try again.",
    };
  }

  if (lower.includes("timed out") || lower.includes("aborted")) {
    return {
      title: "Request timed out",
      hint: "Please try again.",
    };
  }

  return DEFAULT_ERROR;
}
