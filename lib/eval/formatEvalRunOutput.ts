import type { TrialResult } from "./runnerTypes";

function statusLabel(trial: TrialResult): string {
  if (trial.runState === "error") {
    return "ERROR";
  }
  if (trial.runState === "incomplete") {
    return "INCOMPLETE";
  }
  if (trial.passed) {
    return "PASS";
  }
  return "FAIL";
}

function failedAssertionIds(trial: TrialResult): string[] {
  return trial.assertionResults.filter((result) => !result.passed).map((result) => result.id);
}

/** One-line human summary per trial — no transcript dump. */
export function formatTrialSummary(trial: TrialResult): string {
  const status = statusLabel(trial);
  const parts = [
    status,
    trial.evalCaseId,
    `turns=${trial.userTurns}`,
    `validates=${trial.process.validateAttempts}`,
  ];

  if (trial.finalSpecId) {
    parts.push(`spec=${trial.finalSpecId.slice(0, 8)}…`);
  }

  if (trial.sessionId) {
    parts.push(`session=${trial.sessionId.slice(0, 8)}…`);
  }

  if (status === "ERROR") {
    parts.push(`owner=${trial.failureOwner ?? "?"}`);
    if (trial.failureStage) {
      parts.push(`stage=${trial.failureStage}`);
    }
    if (trial.failureDetail) {
      parts.push(`detail=${trial.failureDetail}`);
    }
  } else if (status === "INCOMPLETE") {
    parts.push(`driver=${trial.driverStatus}`);
    if (trial.failureDetail) {
      parts.push(`detail=${trial.failureDetail}`);
    } else if (trial.driverStatus === "abandoned") {
      parts.push("detail=script exhausted without save");
    }
  } else if (status === "FAIL") {
    if (trial.failureStage === "no_save") {
      parts.push("reason=no_save");
      if (trial.failureDetail) {
        parts.push(`detail=${trial.failureDetail}`);
      }
    }
    const failed = failedAssertionIds(trial);
    if (failed.length > 0 && trial.failureStage !== "no_save") {
      parts.push(`failed=${failed.join(",")}`);
    }
  }

  if (trial.mustValidateMet === false) {
    parts.push("mustValidate=false");
  }

  return parts.join(" · ");
}

function trialStatusIcon(trial: TrialResult): string {
  const status = statusLabel(trial);
  if (status === "PASS") {
    return "✓";
  }
  if (status === "FAIL") {
    return "✗";
  }
  return "!";
}

/** Print one trial result — call immediately when a case finishes. */
export function printTrialResult(trial: TrialResult): void {
  console.log(`  ${trialStatusIcon(trial)} ${formatTrialSummary(trial)}`);
  if (statusLabel(trial) === "FAIL" && trial.failureStage === "no_save") {
    console.log("      - agent did not save before script or turn cap");
  } else if (statusLabel(trial) === "FAIL") {
    for (const result of trial.assertionResults.filter((entry) => !entry.passed)) {
      console.log(
        `      - ${result.id}: expected ${JSON.stringify(result.expected)} got ${JSON.stringify(result.actual)}`,
      );
    }
  }
}

export function printEvalRunSummary(trials: TrialResult[]): void {
  const passed = trials.filter((trial) => trial.runState === "complete" && trial.passed).length;
  const failed = trials.filter((trial) => trial.runState === "complete" && trial.passed === false).length;
  const incomplete = trials.filter((trial) => trial.runState === "incomplete").length;
  const errors = trials.filter((trial) => trial.runState === "error").length;

  console.log(
    `\nSummary: ${passed} passed, ${failed} failed, ${incomplete} incomplete, ${errors} errors (${trials.length} total)`,
  );

  if (passed === trials.length) {
    console.log("Result: OK — all cases passed");
  } else {
    console.log("Result: NOT OK — see lines above");
  }
}

export function printEvalRunReport(trials: TrialResult[], experimentId: string): void {
  console.log(`\neval:run experiment ${experimentId}\n`);

  for (const trial of trials) {
    printTrialResult(trial);
  }

  printEvalRunSummary(trials);
}
