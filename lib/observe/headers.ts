export const TELEMETRY_HEADERS = {
  sessionId: "X-RapidUI-Session-Id",
  agent: "X-RapidUI-Agent",
  evalCaseId: "X-RapidUI-Eval-Case",
  intent: "X-RapidUI-Intent",
} as const;

export type TelemetryHeaders = {
  sessionId: string | null;
  agent: string | null;
  evalCaseId: string | null;
  intent: string | null;
};

function trimHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Parse optional RapidUI telemetry headers from an API request. */
export function parseTelemetryHeaders(request: Request): TelemetryHeaders {
  return {
    sessionId: trimHeader(request.headers.get(TELEMETRY_HEADERS.sessionId)),
    agent: trimHeader(request.headers.get(TELEMETRY_HEADERS.agent)),
    evalCaseId: trimHeader(request.headers.get(TELEMETRY_HEADERS.evalCaseId)),
    intent: trimHeader(request.headers.get(TELEMETRY_HEADERS.intent)),
  };
}
