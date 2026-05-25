import { formatError } from "./messages";
import type { TransportFailure, ValidationError } from "./types";

export const MAX_BODY_BYTES = 256 * 1024;

function transportError(): ValidationError {
  const { message, hint } = formatError("INVALID_JSON");
  return { path: "", code: "INVALID_JSON", message, hint };
}

export function parseTransportBody(
  contentType: string | null,
  rawBody: string,
): { ok: true; body: unknown } | TransportFailure {
  if (!contentType?.includes("application/json")) {
    return { valid: false, errors: [transportError()] };
  }

  if (rawBody.length === 0) {
    return { valid: false, errors: [transportError()] };
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return { valid: false, errors: [transportError()] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { valid: false, errors: [transportError()] };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { valid: false, errors: [transportError()] };
  }

  return { ok: true, body: parsed };
}

export async function parseTransportRequest(
  request: Request,
): Promise<{ ok: true; body: unknown } | TransportFailure> {
  const rawBody = await request.text();
  return parseTransportBody(request.headers.get("content-type"), rawBody);
}
