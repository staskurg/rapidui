/** Observe metric copy for dashboard tooltips. */

export const agentMetricTooltips = {
  p50Latency:
    "Median run latency among saved sessions only: wall-clock from the first /chat message to a successful save (includes LLM time, tool calls, and idle time between turns). Shows — until at least 3 saved runs.",
  p95Latency:
    "95th percentile run latency among saved sessions — the slow tail (retries, multi-turn fixes). Saved runs only. Shows — until at least 10 saved runs.",
  avgTokens:
    "Average total tokens per session in the window — summed from agent_turns when available (includes draft/active runs), otherwise from agent_runs.",
  avgValidateAttempts:
    "Average POST /api/validate calls per session, counted from api_events (authoritative platform telemetry).",
  avgPlatformApiCalls:
    "Average platform HTTP requests per session from api_events (discovery, validate, save). Not LLM tool-call counts.",
  draftCount:
    "Sessions that reached a passing validate but never published a spec — draft ready in the panel (live or stale).",
  env:
    "Deployment environment for the agent run — local dev sessions vs prod (rapidui.dev). Legacy rows without env show —.",
  estCost:
    "Estimated LLM cost from summed turn tokens and model list rates. When cache_read_tokens are recorded, cached input is priced at the discounted rate. Legacy runs without cache data show ~ (list price, upper bound).",
  avgEstCost:
    "Average estimated LLM cost per session among runs with computable turn tokens and a known model price.",
  totalTokens:
    "Sum of session tokens (input + output) across runs in the selected period.",
  totalEstCost:
    "Sum of estimated LLM cost in the selected period. ~ prefix on rows or totals means list-price upper bound (no cache telemetry for those runs).",
} as const;

export const apiMetricTooltips = {
  discoveryHits:
    "GET hits on discovery and health routes in the window: /llms.txt, /api/docs, /api/schema, and /api/health.",
  validateOk:
    "Share of /api/validate calls that returned valid: true among sessions with validate events in the window.",
  avgTriesBeforeSave:
    "Among sessions that saved a spec, the mean number of /api/validate calls before the first successful save.",
} as const;

export const evalMetricTooltips = {
  overProcessCap:
    "Show trials that exceeded process limits from the eval case (maxRetries, maxUserTurns, or maxLatencyMs). These are tuning signals — not pass/fail. A trial can Pass on assertions and still appear here.",
  experimentSearch:
    "Search by experiment UUID printed by npm run eval:run. Prefix or substring match — paste the full id or the first few characters.",
  casePassRate:
    "Share of eval case runs that passed assertions in the selected period (and current filters). One experiment can include many cases.",
  avgLatency:
    "Average wall-clock latency per eval case run — from first turn through assertion scoring.",
  p50Latency:
    "Median case-run latency in the window. Shows — until at least 3 completed trials with latency recorded.",
  avgValidateAttempts:
    "Average POST /api/validate calls per case run (includes retries before pass or final fail).",
  avgUserTurns:
    "Average guided user turns per case run before the agent finished or hit limits.",
  overCapTrials:
    "Case runs that exceeded maxRetries or maxUserTurns from the eval case definition — tuning signals, not pass/fail.",
} as const;
