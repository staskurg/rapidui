import { createObserveFilterQueryModule } from "@/lib/observe/observeFilterQuery";

const AGENT_FILTER_KEYS = [
  "model",
  "promptVersion",
  "state",
  "env",
  "agent",
  "session",
  "from",
  "to",
  "notice",
] as const;

export type AgentFilterSearchInput = Partial<
  Record<(typeof AGENT_FILTER_KEYS)[number] | "days", string | undefined>
>;

const agentFilterQuery = createObserveFilterQueryModule({
  filterKeys: AGENT_FILTER_KEYS,
  basePath: "/observe/agent",
  inactiveFilterKeys: ["from", "to", "notice"],
});

export const buildAgentFilterQuery = agentFilterQuery.buildQuery;
export const buildAgentFilterHref = agentFilterQuery.buildHref;
export const shouldCanonicalizeAgentFilterUrl = agentFilterQuery.shouldCanonicalize;
export const canonicalAgentFilterInput = agentFilterQuery.canonicalInput;
export const agentFilterInputFromForm = agentFilterQuery.inputFromForm;
export const agentFilterInputWithPreset = agentFilterQuery.inputWithPreset;
export const hasActiveAgentFilters = agentFilterQuery.hasActiveFilters;
