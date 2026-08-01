/** Observe metric copy — sourced from `.cursor/rapidui-v0.2-implementation.md`. */

export const agentMetricTooltips = {
  p50Latency:
    "Median run latency among saved sessions only: wall-clock from the first /chat message to a successful save (includes LLM time, tool calls, and idle time between turns). Shows — until at least 3 saved runs.",
  p95Latency:
    "95th percentile run latency among saved sessions — the slow tail (retries, multi-turn fixes). Saved runs only. Shows — until at least 10 saved runs.",
  avgTokens:
    "Average total tokens recorded on agent_runs for sessions in the window (when the agent reports token usage).",
  avgValidateAttempts:
    "Average POST /api/validate calls per session, counted from api_events (authoritative platform telemetry).",
  avgPlatformApiCalls:
    "Average platform HTTP requests per session from api_events (discovery, validate, save). Not LLM tool-call counts.",
} as const;

export const apiMetricTooltips = {
  discoveryHits:
    "GET hits on discovery and health routes in the window: /llms.txt, /api/docs, /api/schema, and /api/health.",
  validateOk:
    "Share of /api/validate calls that returned valid: true among sessions with validate events in the window.",
  avgTriesBeforeSave:
    "Among sessions that saved a spec, the mean number of /api/validate calls before the first successful save.",
} as const;
