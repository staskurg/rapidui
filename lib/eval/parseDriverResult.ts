import type { DriverResult } from "./runnerTypes";

const DRIVER_MARKER = "---EVAL_DRIVER_RESULT---";

/** Parse eval_driver.py stdout — expects trailing ---EVAL_DRIVER_RESULT--- block. */
export function parseDriverResult(stdout: string): DriverResult {
  const markerIndex = stdout.lastIndexOf(DRIVER_MARKER);
  if (markerIndex === -1) {
    throw new Error("eval driver output missing ---EVAL_DRIVER_RESULT--- block");
  }

  const jsonText = stdout.slice(markerIndex + DRIVER_MARKER.length).trim();
  const parsed = JSON.parse(jsonText) as DriverResult;

  if (
    !parsed.sessionId ||
    !parsed.caseId ||
    !parsed.status ||
    typeof parsed.userTurns !== "number"
  ) {
    throw new Error("eval driver result missing required fields");
  }

  return parsed;
}

export { DRIVER_MARKER };
