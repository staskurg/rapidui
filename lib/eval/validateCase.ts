import { EvalCaseSchema, type EvalCase } from "../../eval/types";

/** Runtime validate an eval case object — throws ZodError on malformed input. */
export function validateCase(raw: unknown, caseId?: string): EvalCase {
  const parsed = EvalCaseSchema.parse(raw);

  if (caseId !== undefined && parsed.id !== caseId) {
    throw new Error(
      `Eval case id mismatch: expected "${caseId}" but JSON id is "${parsed.id}"`,
    );
  }

  return parsed;
}
