import type { SavedSpec } from "@/lib/db/types";
import type { Rui } from "@/lib/operations";
import { SCHEMA_VERSION } from "@/lib/operations";

/** Synthetic SavedSpec for the draft panel after validate_rui succeeds. */
export function buildDraftSavedSpec(normalizedRui: Rui): SavedSpec {
  return {
    specId: "draft",
    url: "",
    viewUrl: "",
    createdAt: new Date().toISOString(),
    contentHash: "draft",
    validationVersion: SCHEMA_VERSION,
    registryVersion: SCHEMA_VERSION,
    normalizedRui,
  };
}
