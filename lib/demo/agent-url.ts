const DEFAULT_AGENT_CHAT_URL = "https://agent.rapidui.dev/chat";

/** Browser-facing agent chat endpoint (Phase 4 `POST /chat`). */
export function getAgentChatUrl(): string {
  return process.env.NEXT_PUBLIC_RAPIDUI_AGENT_URL ?? DEFAULT_AGENT_CHAT_URL;
}
