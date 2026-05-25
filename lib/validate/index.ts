export { ERROR_CATALOG, formatError } from "./messages";
export type { ErrorContext, ErrorTemplate } from "./messages";
export { normalizeRui } from "./normalize";
export { validateSpec } from "./pipeline";
export {
  MAX_BODY_BYTES,
  parseTransportBody,
  parseTransportRequest,
} from "./transport";
export type {
  TransportFailure,
  ValidationError,
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
} from "./types";
export { VALIDATION_VERSION } from "./version";

import { validateSpec } from "./pipeline";
import { parseTransportRequest } from "./transport";
import type { ValidationResult } from "./types";

/** Phase 1 transport + phases 2–5 validation. */
export async function validateFromRequest(
  request: Request,
): Promise<ValidationResult> {
  const transport = await parseTransportRequest(request);
  if (!("ok" in transport)) {
    return transport;
  }

  return validateSpec(transport.body);
}
