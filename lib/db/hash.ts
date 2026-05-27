import crypto from "node:crypto";

import type { Rui } from "@/lib/registry";

/** SHA-256 fingerprint of canonical normalized RUI JSON. */
export function computeContentHash(rui: Rui): string {
  const json = JSON.stringify(rui);
  const hex = crypto.createHash("sha256").update(json).digest("hex");
  return `sha256:${hex}`;
}
