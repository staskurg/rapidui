import { sql } from "@/lib/db/client";
import {
  DISCOVERY_ENDPOINTS,
  POST_ENDPOINTS,
} from "@/lib/observe/schemas";

export { DISCOVERY_ENDPOINTS } from "@/lib/observe/schemas";

export const OBSERVE_DEFAULT_WINDOW_DAYS = 30;

export type SessionOutcome = "saved" | "failed" | "in_progress";

export type ObserveFilters = {
  agent?: string;
  evalCase?: string;
  session?: string;
  windowDays?: number;
};

export type ApiEventRow = {
  id: string;
  occurred_at: Date;
  endpoint: string;
  session_id: string | null;
  agent: string | null;
  eval_case_id: string | null;
  intent: string | null;
  valid: boolean | null;
  error_codes: string[] | null;
  spec_id: string | null;
  duration_ms: number | null;
};

export type SessionListRow = {
  sessionId: string;
  agent: string | null;
  evalCaseId: string | null;
  validateCount: number;
  outcome: SessionOutcome;
  finalSpecId: string | null;
  lastActivityAt: Date;
};

export type ObserveHubSummary = {
  apiRequestCount: number;
  validateSuccessRate: number | null;
  specsSaved: number;
  discoveryHits?: number;
  discoveryByEndpoint?: Record<string, number>;
};

export type ApiObserveSummary = ObserveHubSummary & {
  sessionCount: number;
  avgTriesBeforeSave: number | null;
  transportFailureCount: number;
  topErrorCodes: { code: string; count: number }[];
  savesByAgent: { agent: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
  funnel?: {
    llms: number;
    docs: number;
    schema: number;
    validate: number;
    save: number;
  };
};

export type SessionSummary = {
  sessionId: string;
  agent: string | null;
  evalCaseId: string | null;
  intent: string | null;
  validateCount: number;
  outcome: SessionOutcome;
  finalSpecId: string | null;
  firstActivityAt: Date | null;
  lastActivityAt: Date | null;
  durationMs: number | null;
};

export type EvalTeaser = {
  overallPassRate: number | null;
  totalRuns: number;
  caseBreakdown: { evalCaseId: string; passed: number; total: number }[];
};

export function windowStart(windowDays = OBSERVE_DEFAULT_WINDOW_DAYS): Date {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - windowDays);
  return start;
}

export function resolveSessionOutcome(
  saved: boolean,
  lastValidateValid: boolean | null,
): SessionOutcome {
  if (saved) {
    return "saved";
  }
  if (lastValidateValid === false) {
    return "failed";
  }
  return "in_progress";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(String(value));
}

function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  return toDate(value);
}

function toNullableBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Boolean(value);
}

function filterValues(filters: ObserveFilters) {
  return {
    windowStart: windowStart(filters.windowDays),
    agent: filters.agent?.trim() || null,
    evalCase: filters.evalCase?.trim() || null,
    session: filters.session?.trim() || null,
  };
}

export function formatRelativeTime(date: Date): string {
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const absSec = Math.abs(diffSec);

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  return rtf.format(Math.round(diffHour / 24), "day");
}

export function truncateSessionId(sessionId: string, visible = 8): string {
  if (sessionId.length <= visible * 2 + 1) {
    return sessionId;
  }
  return `${sessionId.slice(0, visible)}…${sessionId.slice(-visible)}`;
}

async function queryDiscoveryMetrics(
  filters: ObserveFilters,
): Promise<{ discoveryHits: number; discoveryByEndpoint: Record<string, number> }> {
  const { windowStart: ws, agent, evalCase, session } = filterValues(filters);

  const result = await sql`
    SELECT
      endpoint,
      COUNT(*) AS cnt
    FROM api_events
    WHERE occurred_at >= ${ws}
      AND endpoint IN (
        ${DISCOVERY_ENDPOINTS[0]},
        ${DISCOVERY_ENDPOINTS[1]},
        ${DISCOVERY_ENDPOINTS[2]},
        ${DISCOVERY_ENDPOINTS[3]}
      )
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY endpoint
  `;

  const discoveryByEndpoint: Record<string, number> = {};
  for (const endpoint of DISCOVERY_ENDPOINTS) {
    discoveryByEndpoint[endpoint] = 0;
  }

  let discoveryHits = 0;
  for (const row of result.rows) {
    const endpoint = String(row.endpoint);
    const count = toNumber(row.cnt);
    discoveryByEndpoint[endpoint] = count;
    discoveryHits += count;
  }

  return { discoveryHits, discoveryByEndpoint };
}

export async function getDiscoverySummary(
  filters: ObserveFilters = {},
): Promise<{ discoveryHits: number; discoveryByEndpoint: Record<string, number> }> {
  return queryDiscoveryMetrics(filters);
}

export async function getSessionFunnel(
  filters: ObserveFilters = {},
): Promise<NonNullable<ApiObserveSummary["funnel"]>> {
  const { windowStart: ws, agent, evalCase, session } = filterValues(filters);

  const result = await sql`
    SELECT
      COUNT(*) FILTER (WHERE hit_llms) AS reached_llms,
      COUNT(*) FILTER (WHERE hit_docs) AS reached_docs,
      COUNT(*) FILTER (WHERE hit_schema) AS reached_schema,
      COUNT(*) FILTER (WHERE hit_validate) AS reached_validate,
      COUNT(*) FILTER (WHERE hit_save) AS reached_save
    FROM (
      SELECT session_id,
        BOOL_OR(endpoint = '/llms.txt') AS hit_llms,
        BOOL_OR(endpoint = '/api/docs') AS hit_docs,
        BOOL_OR(endpoint = '/api/schema') AS hit_schema,
        BOOL_OR(endpoint = '/api/validate') AS hit_validate,
        BOOL_OR(spec_id IS NOT NULL) AS hit_save
      FROM api_events
      WHERE session_id IS NOT NULL
        AND occurred_at >= ${ws}
        AND (${agent}::text IS NULL OR agent = ${agent})
        AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
        AND (${session}::text IS NULL OR session_id = ${session})
      GROUP BY session_id
    ) s
  `;

  const row = result.rows[0] ?? {};

  return {
    llms: toNumber(row.reached_llms),
    docs: toNumber(row.reached_docs),
    schema: toNumber(row.reached_schema),
    validate: toNumber(row.reached_validate),
    save: toNumber(row.reached_save),
  };
}

async function queryHubMetrics(filters: ObserveFilters): Promise<ObserveHubSummary> {
  const { windowStart: ws, agent, evalCase, session } = filterValues(filters);
  const [postResult, discovery] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE endpoint IN (${POST_ENDPOINTS[0]}, ${POST_ENDPOINTS[1]})) AS api_request_count,
        COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS TRUE)::float
          / NULLIF(COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS NOT NULL), 0)
          AS validate_success_rate,
        COUNT(*) FILTER (WHERE spec_id IS NOT NULL) AS specs_saved
      FROM api_events
      WHERE occurred_at >= ${ws}
        AND (${agent}::text IS NULL OR agent = ${agent})
        AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
        AND (${session}::text IS NULL OR session_id = ${session})
    `,
    queryDiscoveryMetrics(filters),
  ]);

  const row = postResult.rows[0] ?? {};

  return {
    apiRequestCount: toNumber(row.api_request_count),
    validateSuccessRate: toNullableNumber(row.validate_success_rate),
    specsSaved: toNumber(row.specs_saved),
    discoveryHits: discovery.discoveryHits,
    discoveryByEndpoint: discovery.discoveryByEndpoint,
  };
}

export async function getObserveHubSummary(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<ObserveHubSummary> {
  return queryHubMetrics({ windowDays });
}

export async function getApiObserveSummary(
  filters: ObserveFilters = {},
): Promise<ApiObserveSummary> {
  const hub = await queryHubMetrics(filters);
  const { windowStart: ws, agent, evalCase, session } = filterValues(filters);
  const funnel = await getSessionFunnel(filters);

  const summaryResult = await sql`
    SELECT
      COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS session_count,
      COUNT(*) FILTER (WHERE endpoint = '/api/validate' AND valid IS NULL) AS transport_failure_count
    FROM api_events
    WHERE occurred_at >= ${ws}
      AND endpoint IN (${POST_ENDPOINTS[0]}, ${POST_ENDPOINTS[1]})
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
  `;

  const avgResult = await sql`
    SELECT AVG(validate_calls)::numeric(10,1) AS avg_tries_before_save
    FROM (
      SELECT session_id,
        COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_calls
      FROM api_events
      WHERE session_id IS NOT NULL
        AND occurred_at >= ${ws}
        AND endpoint IN (${POST_ENDPOINTS[0]}, ${POST_ENDPOINTS[1]})
        AND (${agent}::text IS NULL OR agent = ${agent})
        AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
        AND (${session}::text IS NULL OR session_id = ${session})
      GROUP BY session_id
      HAVING BOOL_OR(spec_id IS NOT NULL)
    ) saved_sessions
  `;

  const errorCodesResult = await sql`
    SELECT code, COUNT(*) AS cnt
    FROM api_events, UNNEST(error_codes) AS code
    WHERE endpoint = '/api/validate'
      AND valid = FALSE
      AND occurred_at >= ${ws}
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY code
    ORDER BY cnt DESC
    LIMIT 10
  `;

  const savesByAgentResult = await sql`
    SELECT COALESCE(agent, 'unknown') AS agent, COUNT(DISTINCT spec_id) AS saves
    FROM api_events
    WHERE spec_id IS NOT NULL
      AND occurred_at >= ${ws}
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY agent
    ORDER BY saves DESC
  `;

  const requestsByDayResult = await sql`
    SELECT DATE(occurred_at AT TIME ZONE 'UTC')::text AS day, COUNT(*) AS requests
    FROM api_events
    WHERE occurred_at >= ${ws}
      AND endpoint IN (${POST_ENDPOINTS[0]}, ${POST_ENDPOINTS[1]})
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY day
    ORDER BY day DESC
    LIMIT 14
  `;

  const summaryRow = summaryResult.rows[0] ?? {};
  const avgRow = avgResult.rows[0] ?? {};

  return {
    ...hub,
    sessionCount: toNumber(summaryRow.session_count),
    avgTriesBeforeSave: toNullableNumber(avgRow.avg_tries_before_save),
    transportFailureCount: toNumber(summaryRow.transport_failure_count),
    topErrorCodes: errorCodesResult.rows.map((row) => ({
      code: String(row.code),
      count: toNumber(row.cnt),
    })),
    savesByAgent: savesByAgentResult.rows.map((row) => ({
      agent: String(row.agent),
      count: toNumber(row.saves),
    })),
    requestsByDay: requestsByDayResult.rows.map((row) => ({
      date: String(row.day),
      count: toNumber(row.requests),
    })),
    funnel,
  };
}

export async function listRecentSessions(
  filters: ObserveFilters = {},
  limit = 50,
): Promise<SessionListRow[]> {
  const { windowStart: ws, agent, evalCase, session } = filterValues(filters);

  const result = await sql`
    SELECT
      session_id,
      MAX(agent) AS agent,
      MAX(eval_case_id) AS eval_case_id,
      COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_count,
      BOOL_OR(spec_id IS NOT NULL) AS saved,
      MAX(spec_id::text) FILTER (WHERE spec_id IS NOT NULL) AS final_spec_id,
      MAX(occurred_at) AS last_activity_at,
      (ARRAY_AGG(valid ORDER BY occurred_at DESC)
        FILTER (WHERE endpoint = '/api/validate'))[1] AS last_validate_valid
    FROM api_events
    WHERE session_id IS NOT NULL
      AND occurred_at >= ${ws}
      AND endpoint IN (${POST_ENDPOINTS[0]}, ${POST_ENDPOINTS[1]})
      AND (${agent}::text IS NULL OR agent = ${agent})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY session_id
    ORDER BY last_activity_at DESC
    LIMIT ${limit}
  `;

  return result.rows.map((row) => {
    const saved = Boolean(row.saved);
    const lastValidateValid = toNullableBoolean(row.last_validate_valid);

    return {
      sessionId: String(row.session_id),
      agent: row.agent ? String(row.agent) : null,
      evalCaseId: row.eval_case_id ? String(row.eval_case_id) : null,
      validateCount: toNumber(row.validate_count),
      outcome: resolveSessionOutcome(saved, lastValidateValid),
      finalSpecId: row.final_spec_id ? String(row.final_spec_id) : null,
      lastActivityAt: toDate(row.last_activity_at),
    };
  });
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
  const result = await sql`
    SELECT
      session_id,
      MAX(agent) AS agent,
      MAX(eval_case_id) AS eval_case_id,
      MAX(intent) AS intent,
      COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_count,
      BOOL_OR(spec_id IS NOT NULL) AS saved,
      MAX(spec_id::text) FILTER (WHERE spec_id IS NOT NULL) AS final_spec_id,
      MIN(occurred_at) AS first_activity_at,
      MAX(occurred_at) AS last_activity_at,
      SUM(duration_ms) AS duration_ms,
      (ARRAY_AGG(valid ORDER BY occurred_at DESC)
        FILTER (WHERE endpoint = '/api/validate'))[1] AS last_validate_valid
    FROM api_events
    WHERE session_id = ${sessionId}
    GROUP BY session_id
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const saved = Boolean(row.saved);
  const lastValidateValid = toNullableBoolean(row.last_validate_valid);

  return {
    sessionId: String(row.session_id),
    agent: row.agent ? String(row.agent) : null,
    evalCaseId: row.eval_case_id ? String(row.eval_case_id) : null,
    intent: row.intent ? String(row.intent) : null,
    validateCount: toNumber(row.validate_count),
    outcome: resolveSessionOutcome(saved, lastValidateValid),
    finalSpecId: row.final_spec_id ? String(row.final_spec_id) : null,
    firstActivityAt: toNullableDate(row.first_activity_at),
    lastActivityAt: toNullableDate(row.last_activity_at),
    durationMs: row.duration_ms === null ? null : toNumber(row.duration_ms),
  };
}

export async function getSessionTimeline(sessionId: string): Promise<ApiEventRow[]> {
  const result = await sql`
    SELECT
      id,
      occurred_at,
      endpoint,
      session_id,
      agent,
      eval_case_id,
      intent,
      valid,
      error_codes,
      spec_id,
      duration_ms
    FROM api_events
    WHERE session_id = ${sessionId}
    ORDER BY occurred_at ASC
  `;

  return result.rows.map((row) => ({
    id: String(row.id),
    occurred_at: toDate(row.occurred_at),
    endpoint: String(row.endpoint),
    session_id: row.session_id ? String(row.session_id) : null,
    agent: row.agent ? String(row.agent) : null,
    eval_case_id: row.eval_case_id ? String(row.eval_case_id) : null,
    intent: row.intent ? String(row.intent) : null,
    valid: toNullableBoolean(row.valid),
    error_codes: Array.isArray(row.error_codes)
      ? row.error_codes.map(String)
      : row.error_codes
        ? [String(row.error_codes)]
        : null,
    spec_id: row.spec_id ? String(row.spec_id) : null,
    duration_ms: row.duration_ms === null ? null : toNumber(row.duration_ms),
  }));
}

export async function getEvalTeaser(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<EvalTeaser> {
  const ws = windowStart(windowDays);

  const overallResult = await sql`
    SELECT
      ROUND(100.0 * COUNT(*) FILTER (WHERE passed) / NULLIF(COUNT(*), 0), 1) AS overall_pass_rate,
      COUNT(*) AS total_runs
    FROM eval_runs
    WHERE completed_at >= ${ws}
  `;

  const caseResult = await sql`
    SELECT
      eval_case_id,
      COUNT(*) FILTER (WHERE passed) AS passed,
      COUNT(*) AS total
    FROM eval_runs
    WHERE completed_at >= ${ws}
    GROUP BY eval_case_id
    ORDER BY eval_case_id ASC
  `;

  const overallRow = overallResult.rows[0] ?? {};

  return {
    overallPassRate: toNullableNumber(overallRow.overall_pass_rate),
    totalRuns: toNumber(overallRow.total_runs),
    caseBreakdown: caseResult.rows.map((row) => ({
      evalCaseId: String(row.eval_case_id),
      passed: toNumber(row.passed),
      total: toNumber(row.total),
    })),
  };
}

export async function listDistinctAgents(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<string[]> {
  const ws = windowStart(windowDays);

  const result = await sql`
    SELECT DISTINCT agent
    FROM api_events
    WHERE occurred_at >= ${ws}
      AND agent IS NOT NULL
      AND session_id IS NOT NULL
    ORDER BY agent ASC
  `;

  return result.rows.map((row) => String(row.agent));
}

export async function listDistinctEvalCases(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<string[]> {
  const ws = windowStart(windowDays);

  const result = await sql`
    SELECT DISTINCT eval_case_id
    FROM api_events
    WHERE occurred_at >= ${ws}
      AND eval_case_id IS NOT NULL
      AND session_id IS NOT NULL
    ORDER BY eval_case_id ASC
  `;

  return result.rows.map((row) => String(row.eval_case_id));
}

// --- Agent Observe (Phase 6) ---
// Validate attempts and platform API call counts are authoritative from api_events.

export const AGENT_STALE_SESSION_MS = 30 * 60 * 1000;

export type AgentRunOutcome =
  | "saved"
  | "failed"
  | "abandoned"
  | "abandoned_inferred"
  | "in_progress";

export type AgentObserveFilters = {
  model?: string;
  promptVersion?: string;
  evalCase?: string;
  agent?: string;
  session?: string;
  windowDays?: number;
};

export type AgentObserveSummary = {
  runCount: number;
  savedCount: number;
  failedCount: number;
  abandonedCount: number;
  inProgressCount: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  savedRunsForLatency: number;
  avgTokens: number | null;
  avgValidateAttempts: number | null;
  avgPlatformApiCalls: number | null;
  runsByDay: { date: string; count: number }[];
};

export type AgentRunListRow = {
  sessionId: string;
  startedAt: Date;
  finishedAt: Date | null;
  outcome: AgentRunOutcome;
  model: string | null;
  promptVersion: string | null;
  evalCaseId: string | null;
  intent: string | null;
  totalTokens: number | null;
  latencyMs: number | null;
  validateAttempts: number;
  advisoryValidateAttempts: number | null;
  platformApiCalls: number;
  specId: string | null;
  lastActivityAt: Date;
};

export type AgentTurnRow = {
  turnIndex: number;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  hadValidateCall: boolean;
  hadSave: boolean;
};

export type AgentRunDetail = {
  run: AgentRunListRow & { errorSummary: string | null };
  turns: AgentTurnRow[];
  timeline: ApiEventRow[];
  tokenParityMismatch: boolean;
  validateCountMismatch: boolean;
  transcript: AgentRunTranscriptMeta;
};

export type AgentRunTranscriptMeta = {
  hasTranscript: boolean;
  turnCount: number | null;
  updatedAt: Date | null;
};

function agentFilterValues(filters: AgentObserveFilters) {
  return {
    windowStart: windowStart(filters.windowDays),
    model: filters.model?.trim() || null,
    promptVersion: filters.promptVersion?.trim() || null,
    evalCase: filters.evalCase?.trim() || null,
    agent: filters.agent?.trim() || null,
    session: filters.session?.trim() || null,
  };
}

export function resolveAgentRunOutcome(
  dbOutcome: string | null,
  lastActivityAt: Date,
  hasTranscript = false,
): AgentRunOutcome {
  if (dbOutcome === "saved") {
    return "saved";
  }
  if (dbOutcome === "failed") {
    return "failed";
  }
  if (dbOutcome === "abandoned") {
    return "abandoned";
  }

  if (hasTranscript) {
    return "in_progress";
  }

  const stale = Date.now() - lastActivityAt.getTime() > AGENT_STALE_SESSION_MS;
  return stale ? "abandoned_inferred" : "in_progress";
}

/** Authoritative validate attempt count from api_events. */
export async function countValidateAttempts(sessionId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) AS cnt
    FROM api_events
    WHERE session_id = ${sessionId}
      AND endpoint = '/api/validate'
  `;
  return toNumber(result.rows[0]?.cnt);
}

/** Platform API calls per session — discovery + validate + save. */
export async function countPlatformApiCalls(sessionId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) AS cnt
    FROM api_events
    WHERE session_id = ${sessionId}
  `;
  return toNumber(result.rows[0]?.cnt);
}

function mapAgentRunRow(
  row: Record<string, unknown>,
  validateAttempts: number,
  platformApiCalls: number,
): AgentRunListRow {
  const lastActivityAt = toDate(row.last_activity_at);
  const dbOutcome = row.outcome ? String(row.outcome) : null;
  const hasTranscript = Boolean(row.has_transcript);

  return {
    sessionId: String(row.session_id),
    startedAt: toDate(row.started_at),
    finishedAt: toNullableDate(row.finished_at),
    outcome: resolveAgentRunOutcome(dbOutcome, lastActivityAt, hasTranscript),
    model: row.model ? String(row.model) : null,
    promptVersion: row.prompt_version ? String(row.prompt_version) : null,
    evalCaseId: row.eval_case_id ? String(row.eval_case_id) : null,
    intent: row.intent ? String(row.intent) : null,
    totalTokens: row.total_tokens === null ? null : toNumber(row.total_tokens),
    latencyMs: row.latency_ms === null ? null : toNumber(row.latency_ms),
    validateAttempts,
    advisoryValidateAttempts:
      row.validate_attempts === null ? null : toNumber(row.validate_attempts),
    platformApiCalls,
    specId: row.spec_id ? String(row.spec_id) : null,
    lastActivityAt,
  };
}

export async function getAgentRunExists(sessionId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM agent_runs WHERE session_id = ${sessionId} LIMIT 1
  `;
  return result.rows.length > 0;
}

export async function listDistinctModels(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<string[]> {
  const ws = windowStart(windowDays);
  const result = await sql`
    SELECT DISTINCT model
    FROM agent_runs
    WHERE started_at >= ${ws}
      AND model IS NOT NULL
    ORDER BY model ASC
  `;
  return result.rows.map((row) => String(row.model));
}

export async function listDistinctPromptVersions(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<string[]> {
  const ws = windowStart(windowDays);
  const result = await sql`
    SELECT DISTINCT prompt_version
    FROM agent_runs
    WHERE started_at >= ${ws}
      AND prompt_version IS NOT NULL
    ORDER BY prompt_version ASC
  `;
  return result.rows.map((row) => String(row.prompt_version));
}

export async function listDistinctAgentRunAgents(
  windowDays = OBSERVE_DEFAULT_WINDOW_DAYS,
): Promise<string[]> {
  const ws = windowStart(windowDays);
  const result = await sql`
    SELECT DISTINCT ae.agent
    FROM agent_runs ar
    JOIN api_events ae ON ae.session_id = ar.session_id
    WHERE ar.started_at >= ${ws}
      AND ae.agent IS NOT NULL
    ORDER BY ae.agent ASC
  `;
  return result.rows.map((row) => String(row.agent));
}

export async function getAgentObserveSummary(
  filters: AgentObserveFilters = {},
): Promise<AgentObserveSummary> {
  const { windowStart: ws, model, promptVersion, evalCase, session } =
    agentFilterValues(filters);

  const runsResult = await sql`
    SELECT
      ar.outcome,
      ar.latency_ms,
      ar.total_tokens,
      ar.session_id,
      ar.started_at,
      ar.finished_at,
      COALESCE(
        (SELECT MAX(ae.occurred_at) FROM api_events ae WHERE ae.session_id = ar.session_id),
        ar.finished_at,
        ar.started_at
      ) AS last_activity_at,
      (ar.transcript_jsonb IS NOT NULL) AS has_transcript
    FROM agent_runs ar
    WHERE ar.started_at >= ${ws}
      AND (${model}::text IS NULL OR ar.model = ${model})
      AND (${promptVersion}::text IS NULL OR ar.prompt_version = ${promptVersion})
      AND (${evalCase}::text IS NULL OR ar.eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR ar.session_id = ${session})
  `;

  let savedCount = 0;
  let failedCount = 0;
  let abandonedCount = 0;
  let inProgressCount = 0;
  const savedLatencies: number[] = [];
  const tokenTotals: number[] = [];

  for (const row of runsResult.rows) {
    const lastActivityAt = toDate(row.last_activity_at);
    const outcome = resolveAgentRunOutcome(
      row.outcome ? String(row.outcome) : null,
      lastActivityAt,
      Boolean(row.has_transcript),
    );

    switch (outcome) {
      case "saved":
        savedCount += 1;
        if (row.latency_ms !== null) {
          savedLatencies.push(toNumber(row.latency_ms));
        }
        break;
      case "failed":
        failedCount += 1;
        break;
      case "abandoned":
      case "abandoned_inferred":
        abandonedCount += 1;
        break;
      default:
        inProgressCount += 1;
    }

    if (row.total_tokens !== null) {
      tokenTotals.push(toNumber(row.total_tokens));
    }
  }

  const savedRunsForLatency = savedLatencies.length;
  savedLatencies.sort((a, b) => a - b);

  const p50LatencyMs =
    savedRunsForLatency >= 3
      ? savedLatencies[Math.floor(savedRunsForLatency * 0.5)] ?? null
      : null;
  const p95LatencyMs =
    savedRunsForLatency >= 10
      ? savedLatencies[Math.floor(savedRunsForLatency * 0.95)] ?? null
      : null;

  const sessionIds = runsResult.rows.map((row) => String(row.session_id));

  let avgValidateAttempts: number | null = null;
  let avgPlatformApiCalls: number | null = null;

  if (sessionIds.length > 0) {
    const metricsResult = await sql`
      SELECT
        session_id,
        COUNT(*) FILTER (WHERE endpoint = '/api/validate') AS validate_cnt,
        COUNT(*) AS platform_cnt
      FROM api_events
      WHERE session_id = ANY(${sessionIds})
      GROUP BY session_id
    `;

    const validateCounts: number[] = [];
    const platformCounts: number[] = [];
    for (const row of metricsResult.rows) {
      validateCounts.push(toNumber(row.validate_cnt));
      platformCounts.push(toNumber(row.platform_cnt));
    }

    if (validateCounts.length > 0) {
      avgValidateAttempts =
        validateCounts.reduce((sum, value) => sum + value, 0) / validateCounts.length;
    }
    if (platformCounts.length > 0) {
      avgPlatformApiCalls =
        platformCounts.reduce((sum, value) => sum + value, 0) / platformCounts.length;
    }
  }

  const runsByDayResult = await sql`
    SELECT DATE(started_at AT TIME ZONE 'UTC')::text AS day, COUNT(*) AS runs
    FROM agent_runs
    WHERE started_at >= ${ws}
      AND (${model}::text IS NULL OR model = ${model})
      AND (${promptVersion}::text IS NULL OR prompt_version = ${promptVersion})
      AND (${evalCase}::text IS NULL OR eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR session_id = ${session})
    GROUP BY day
    ORDER BY day DESC
    LIMIT 14
  `;

  return {
    runCount: runsResult.rows.length,
    savedCount,
    failedCount,
    abandonedCount,
    inProgressCount,
    p50LatencyMs,
    p95LatencyMs,
    savedRunsForLatency,
    avgTokens:
      tokenTotals.length > 0
        ? Math.round(tokenTotals.reduce((sum, value) => sum + value, 0) / tokenTotals.length)
        : null,
    avgValidateAttempts:
      avgValidateAttempts === null ? null : Math.round(avgValidateAttempts * 10) / 10,
    avgPlatformApiCalls:
      avgPlatformApiCalls === null ? null : Math.round(avgPlatformApiCalls * 10) / 10,
    runsByDay: runsByDayResult.rows.map((row) => ({
      date: String(row.day),
      count: toNumber(row.runs),
    })),
  };
}

export async function listAgentRuns(
  filters: AgentObserveFilters = {},
  limit = 50,
): Promise<AgentRunListRow[]> {
  const { windowStart: ws, model, promptVersion, evalCase, session, agent } =
    agentFilterValues(filters);

  const result = await sql`
    SELECT
      ar.session_id,
      ar.started_at,
      ar.finished_at,
      ar.outcome,
      ar.model,
      ar.prompt_version,
      ar.eval_case_id,
      ar.intent,
      ar.total_tokens,
      ar.latency_ms,
      ar.validate_attempts,
      ar.spec_id,
      COALESCE(
        (SELECT MAX(ae.occurred_at) FROM api_events ae WHERE ae.session_id = ar.session_id),
        ar.finished_at,
        ar.started_at
      ) AS last_activity_at,
      (ar.transcript_jsonb IS NOT NULL) AS has_transcript
    FROM agent_runs ar
    WHERE ar.started_at >= ${ws}
      AND (${model}::text IS NULL OR ar.model = ${model})
      AND (${promptVersion}::text IS NULL OR ar.prompt_version = ${promptVersion})
      AND (${evalCase}::text IS NULL OR ar.eval_case_id = ${evalCase})
      AND (${session}::text IS NULL OR ar.session_id = ${session})
      AND (
        ${agent}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM api_events ae
          WHERE ae.session_id = ar.session_id AND ae.agent = ${agent}
        )
      )
    ORDER BY ar.started_at DESC
    LIMIT ${limit}
  `;

  const rows: AgentRunListRow[] = [];
  for (const row of result.rows) {
    const sessionId = String(row.session_id);
    const [validateAttempts, platformApiCalls] = await Promise.all([
      countValidateAttempts(sessionId),
      countPlatformApiCalls(sessionId),
    ]);
    rows.push(mapAgentRunRow(row, validateAttempts, platformApiCalls));
  }

  return rows;
}

export async function getAgentRunDetail(sessionId: string): Promise<AgentRunDetail | null> {
  const runResult = await sql`
    SELECT
      ar.id,
      ar.session_id,
      ar.started_at,
      ar.finished_at,
      ar.outcome,
      ar.model,
      ar.prompt_version,
      ar.eval_case_id,
      ar.intent,
      ar.total_tokens,
      ar.latency_ms,
      ar.validate_attempts,
      ar.spec_id,
      ar.error_summary,
      COALESCE(
        (SELECT MAX(ae.occurred_at) FROM api_events ae WHERE ae.session_id = ar.session_id),
        ar.finished_at,
        ar.started_at
      ) AS last_activity_at,
      (ar.transcript_jsonb IS NOT NULL) AS has_transcript,
      ar.transcript_turn_count,
      ar.transcript_updated_at
    FROM agent_runs ar
    WHERE ar.session_id = ${sessionId}
  `;

  const row = runResult.rows[0];
  if (!row) {
    return null;
  }

  const [validateAttempts, platformApiCalls, turnsResult, timeline] = await Promise.all([
    countValidateAttempts(sessionId),
    countPlatformApiCalls(sessionId),
    sql`
      SELECT
        turn_index,
        latency_ms,
        input_tokens,
        output_tokens,
        had_validate_call,
        had_save
      FROM agent_turns
      WHERE run_id = ${String(row.id)}
      ORDER BY turn_index ASC
    `,
    getSessionTimeline(sessionId),
  ]);

  const run = {
    ...mapAgentRunRow(row, validateAttempts, platformApiCalls),
    errorSummary: row.error_summary ? String(row.error_summary) : null,
  };

  const turns: AgentTurnRow[] = turnsResult.rows.map((turnRow) => ({
    turnIndex: toNumber(turnRow.turn_index),
    latencyMs: turnRow.latency_ms === null ? null : toNumber(turnRow.latency_ms),
    inputTokens: turnRow.input_tokens === null ? null : toNumber(turnRow.input_tokens),
    outputTokens: turnRow.output_tokens === null ? null : toNumber(turnRow.output_tokens),
    hadValidateCall: Boolean(turnRow.had_validate_call),
    hadSave: Boolean(turnRow.had_save),
  }));

  const turnTokenSum = turns.reduce(
    (sum, turn) => sum + (turn.inputTokens ?? 0) + (turn.outputTokens ?? 0),
    0,
  );
  const tokenParityMismatch =
    run.totalTokens !== null && turns.length > 0 && turnTokenSum !== run.totalTokens;
  const validateCountMismatch =
    run.advisoryValidateAttempts !== null &&
    run.advisoryValidateAttempts !== validateAttempts;

  return {
    run,
    turns,
    timeline,
    tokenParityMismatch,
    validateCountMismatch,
    transcript: {
      hasTranscript: Boolean(row.has_transcript),
      turnCount:
        row.transcript_turn_count === null || row.transcript_turn_count === undefined
          ? null
          : toNumber(row.transcript_turn_count),
      updatedAt: toNullableDate(row.transcript_updated_at),
    },
  };
}
