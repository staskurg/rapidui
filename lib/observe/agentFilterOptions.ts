import type { AgentRunEnv, AgentSessionState } from "@/lib/observe/queries";

export const AGENT_SESSION_STATES: AgentSessionState[] = [
  "saved",
  "draft",
  "active",
  "failed",
  "abandoned",
];

export const AGENT_RUN_ENVS: AgentRunEnv[] = ["local", "prod"];

export function parseAgentStateFilter(
  value: string | undefined,
): AgentSessionState | undefined {
  return AGENT_SESSION_STATES.includes(value as AgentSessionState)
    ? (value as AgentSessionState)
    : undefined;
}

export function parseAgentEnvFilter(value: string | undefined): AgentRunEnv | undefined {
  return AGENT_RUN_ENVS.includes(value as AgentRunEnv) ? (value as AgentRunEnv) : undefined;
}
