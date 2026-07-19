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
