import { parseTelemetryHeaders } from "./headers";
import type { ApiEndpoint } from "./schemas";
import { insertApiEvent } from "./writes";
import type { ValidationResult } from "@/lib/validate";

type RecordApiEventOptions = {
  request: Request;
  endpoint: ApiEndpoint;
  result: ValidationResult;
  httpStatus: number;
  specId?: string | null;
  startedAt: number;
};

function mapValidationResult(result: ValidationResult, specId?: string | null) {
  if (!("validationVersion" in result)) {
    const codes = result.errors.map((error) => error.code);
    return {
      valid: null as boolean | null,
      error_codes: codes.length > 0 ? codes : (["INVALID_JSON"] as string[]),
      spec_id: null as string | null,
    };
  }

  if (!result.valid) {
    return {
      valid: false as boolean | null,
      error_codes: result.errors.map((error) => error.code),
      spec_id: null as string | null,
    };
  }

  return {
    valid: true as boolean | null,
    error_codes: null as string[] | null,
    spec_id: specId ?? null,
  };
}

/** Record api_events row — failures are logged, never thrown to callers. */
export async function recordApiEvent(options: RecordApiEventOptions): Promise<void> {
  const { request, endpoint, result, specId, startedAt } = options;
  const headers = parseTelemetryHeaders(request);
  const mapped = mapValidationResult(result, specId);

  try {
    await insertApiEvent({
      endpoint,
      session_id: headers.sessionId,
      agent: headers.agent,
      eval_case_id: headers.evalCaseId,
      intent: headers.intent,
      valid: mapped.valid,
      error_codes: mapped.error_codes,
      spec_id: mapped.spec_id,
      duration_ms: Math.max(0, Date.now() - startedAt),
    });
  } catch (error) {
    console.error("[observe] Failed to insert api_event:", error);
  }
}
