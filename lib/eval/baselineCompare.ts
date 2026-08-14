/**
 * Baseline regression rules for eval trials (Phase 7.4).
 *
 * Pass-rate or assertion deltas are only meaningful when every config dimension
 * matches — otherwise the UI should show a config diff, not a regression badge.
 */

export type TrialConfigDimensions = {
  evalCaseId: string;
  caseHash: string;
  model: string | null;
  promptVersion: string | null;
  evalMode: string;
  validationVersion: string | null;
  registryVersion: string | null;
};

/** True when two trials are comparable for baseline pass-rate / assertion regression. */
export function areTrialConfigsCompatible(
  a: TrialConfigDimensions,
  b: TrialConfigDimensions,
): boolean {
  return (
    a.evalCaseId === b.evalCaseId &&
    a.caseHash === b.caseHash &&
    a.model === b.model &&
    a.promptVersion === b.promptVersion &&
    a.evalMode === b.evalMode &&
    a.validationVersion === b.validationVersion &&
    a.registryVersion === b.registryVersion
  );
}
