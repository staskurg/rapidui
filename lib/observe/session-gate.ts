import { formatError } from "@/lib/validate/messages";
import type { TransportFailure } from "@/lib/validate/types";

import { parseTelemetryHeaders, type TelemetryHeaders } from "./headers";

export function missingSessionIdFailure(): TransportFailure {
  const { message, hint } = formatError("MISSING_SESSION_ID");
  return {
    valid: false,
    errors: [{ path: "", code: "MISSING_SESSION_ID", message, hint }],
  };
}

/** Require X-RapidUI-Session-Id on guarded agent API routes (all except GET /llms.txt). */
export function assertSessionId(
  request: Request,
):
  | { ok: true; sessionId: string; headers: TelemetryHeaders }
  | { ok: false; error: TransportFailure } {
  const headers = parseTelemetryHeaders(request);
  if (!headers.sessionId) {
    return { ok: false, error: missingSessionIdFailure() };
  }
  return { ok: true, sessionId: headers.sessionId, headers };
}
