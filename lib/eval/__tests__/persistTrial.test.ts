import { describe, expect, it } from "vitest";

import { loadCase } from "@/lib/eval/loadCase";
import { buildEvalTrialInsert } from "@/lib/eval/persistTrial";
import { RUNNER_VERSION } from "@/lib/eval/collectTrialConfig";
import type { ExtendedProcessMetrics } from "@/lib/eval/processMetrics";
import type { TrialResult } from "@/lib/eval/runnerTypes";

describe("buildEvalTrialInsert", () => {
  it("maps trial envelope fields including transcript and config snapshot", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const trial: TrialResult = {
      id: "trial-1",
      experimentId: "exp-1",
      trialIndex: 0,
      sessionId: "session-1",
      evalCaseId: evalCase.id,
      passed: false,
      runState: "complete",
      failureOwner: "model",
      failureStage: "artifact",
      failureDetail: null,
      finalSpecId: null,
      assertionResults: [
        {
          id: "uc1-browse-count",
          passed: false,
          expected: { minCount: 2 },
          actual: { count: 1 },
        },
      ],
      process: {
        validateAttempts: 2,
        platformApiCalls: 5,
        latencyMs: 1200,
        agentOutcome: "saved",
        infraFailureCount: 0,
      },
      userTurns: 3,
      mustValidateMet: true,
      driverStatus: "saved",
      transcript: [
        { role: "user", parts: [{ type: "text", text: "hello" }] },
        {
          role: "assistant",
          parts: [{ type: "tool-validate_rui", toolCallId: "t1", input: {} }],
        },
      ],
      startedAt: "2026-08-13T00:00:00.000Z",
      completedAt: "2026-08-13T00:01:00.000Z",
    };

    const process: ExtendedProcessMetrics = {
      ...trial.process,
      validationFailures: 1,
      tokensIn: 100,
      tokensOut: 50,
    };

    const input = buildEvalTrialInsert(
      trial,
      {
        caseHash: "sha256:case",
        agent: "rapidui-agent-eval",
        baseUrl: "http://localhost:3000",
        model: "gpt-5.6-terra",
        provider: "openai",
        promptVersion: "v1.2",
        promptHash: "sha256:prompt",
        evalMode: "guided",
        gitCommit: "abc123",
        gitDirty: false,
        runnerVersion: RUNNER_VERSION,
        validationVersion: "0.2",
        registryVersion: "0.2",
      },
      process,
      null,
      { platformBaseUrl: "http://localhost:3000" },
    );

    expect(input.id).toBe("trial-1");
    expect(input.caseHash).toBe("sha256:case");
    expect(input.failureCode).toBe("artifact");
    expect(input.validationFailures).toBe(1);
    expect(input.tokensIn).toBe(100);
    expect(input.transcript).toHaveLength(2);
    expect(input.assertionResults).toHaveLength(1);
  });
});
