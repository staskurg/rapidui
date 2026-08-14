import crypto from "node:crypto";

import type { EvalCase } from "../../eval/types";

/** Stable SHA-256 fingerprint of an eval case definition (prompt, script, assertions). */
export function hashEvalCase(evalCase: EvalCase): string {
  const canonical = JSON.stringify(evalCase);
  const hex = crypto.createHash("sha256").update(canonical).digest("hex");
  return `sha256:${hex}`;
}

/** SHA-256 fingerprint of arbitrary JSON-serializable config (e.g. prompt file body). */
export function hashJsonValue(value: unknown): string {
  const canonical = JSON.stringify(value);
  const hex = crypto.createHash("sha256").update(canonical).digest("hex");
  return `sha256:${hex}`;
}
