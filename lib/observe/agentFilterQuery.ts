import {
  isDefaultObserveWindow,
  OBSERVE_DEFAULT_WINDOW_DAYS,
  parseIsoDateUtc,
  parseObserveWindowDays,
  windowRangeForPreset,
} from "@/lib/observe/queries";

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

function resolvedDateRange(input: AgentFilterSearchInput): { from: string; to: string } {
  const from = parseIsoDateUtc(input.from);
  const to = parseIsoDateUtc(input.to);
  if (from && to) {
    return { from, to };
  }

  if (input.days?.trim()) {
    return windowRangeForPreset(parseObserveWindowDays(input.days));
  }

  return windowRangeForPreset(OBSERVE_DEFAULT_WINDOW_DAYS);
}

/** Build query string omitting empty values and default date range. */
export function buildAgentFilterQuery(input: AgentFilterSearchInput): string {
  const params = new URLSearchParams();
  const { from, to } = resolvedDateRange(input);

  for (const key of AGENT_FILTER_KEYS) {
    if (key === "from" || key === "to") {
      continue;
    }

    const value = input[key]?.trim();
    if (value) {
      params.set(key, value);
    }
  }

  if (!isDefaultObserveWindow(from, to)) {
    params.set("from", from);
    params.set("to", to);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildAgentFilterHref(input: AgentFilterSearchInput): string {
  return `/observe/agent${buildAgentFilterQuery(input)}`;
}

/** True when URL should redirect to a canonical filter query. */
export function shouldCanonicalizeAgentFilterUrl(input: AgentFilterSearchInput): boolean {
  if (input.days !== undefined) {
    return true;
  }

  for (const key of AGENT_FILTER_KEYS) {
    if (input[key] === "") {
      return true;
    }
  }

  const from = parseIsoDateUtc(input.from);
  const to = parseIsoDateUtc(input.to);

  if ((input.from !== undefined || input.to !== undefined) && (!from || !to)) {
    return true;
  }

  if (from && to && isDefaultObserveWindow(from, to)) {
    return true;
  }

  return false;
}

export function canonicalAgentFilterInput(
  input: AgentFilterSearchInput,
): AgentFilterSearchInput {
  const { from, to } = resolvedDateRange(input);
  const canonical: AgentFilterSearchInput = {
    model: input.model?.trim() || undefined,
    promptVersion: input.promptVersion?.trim() || undefined,
    state: input.state?.trim() || undefined,
    env: input.env?.trim() || undefined,
    agent: input.agent?.trim() || undefined,
    session: input.session?.trim() || undefined,
    notice: input.notice?.trim() || undefined,
  };

  if (!isDefaultObserveWindow(from, to)) {
    canonical.from = from;
    canonical.to = to;
  }

  return canonical;
}

/** Convert form payload (may include days preset) into canonical filter input. */
export function agentFilterInputFromForm(
  filters: Record<string, string | undefined>,
): AgentFilterSearchInput {
  const { days, ...rest } = filters;
  if (days?.trim()) {
    const range = windowRangeForPreset(parseObserveWindowDays(days));
    return {
      ...rest,
      from: range.from,
      to: range.to,
    };
  }

  return rest;
}

export function hasActiveAgentFilters(input: AgentFilterSearchInput): boolean {
  return buildAgentFilterQuery(input) !== "";
}
