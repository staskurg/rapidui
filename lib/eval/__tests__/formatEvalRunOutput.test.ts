import { describe, expect, it } from "vitest";

import { formatTrialSummary } from "@/lib/eval/formatEvalRunOutput";
import type { TrialResult } from "@/lib/eval/runnerTypes";

function minimalTrial(overrides: Partial<TrialResult>): TrialResult {
  return {
    id: "trial-1",
    experimentId: "exp-1",
    trialIndex: 0,
    sessionId: "session-abcdef12",
    evalCaseId: "static-browse-v0.2",
    passed: true,
    runState: "complete",
    failureOwner: null,
    failureStage: null,
    failureDetail: null,
    finalSpecId: "spec-12345678",
    assertionResults: [],
    process: {
      validateAttempts: 1,
      platformApiCalls: 2,
      latencyMs: 1000,
      agentOutcome: "saved",
      infraFailureCount: 0,
    },
    userTurns: 3,
    mustValidateMet: true,
    driverStatus: "saved",
    transcript: [],
    startedAt: "2026-08-12T00:00:00.000Z",
    completedAt: "2026-08-12T00:01:00.000Z",
    ...overrides,
  };
}

describe("formatTrialSummary", () => {
  it("formats a passing trial without dumping transcript", () => {
    const line = formatTrialSummary(minimalTrial({}));
    expect(line).toContain("PASS");
    expect(line).toContain("static-browse-v0.2");
    expect(line).toContain("turns=3");
    expect(line).not.toContain("transcript");
  });

  it("reports no save as FAIL", () => {
    const line = formatTrialSummary(
      minimalTrial({
        passed: false,
        runState: "complete",
        failureOwner: "model",
        failureStage: "no_save",
        failureDetail: "conversationScript exhausted without save",
        driverStatus: "abandoned",
        finalSpecId: null,
        mustValidateMet: false,
      }),
    );
    expect(line).toContain("FAIL");
    expect(line).toContain("reason=no_save");
  });

  it("lists failed assertion ids", () => {
    const line = formatTrialSummary(
      minimalTrial({
        passed: false,
        assertionResults: [
          {
            id: "uc1-browse-count",
            passed: false,
            expected: { minCount: 2 },
            actual: 1,
          },
        ],
      }),
    );
    expect(line).toContain("FAIL");
    expect(line).toContain("failed=uc1-browse-count");
  });
});
