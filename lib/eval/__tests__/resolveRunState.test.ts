import { describe, expect, it } from "vitest";

import { resolveRunState } from "@/lib/eval/resolveRunState";
import type { DriverResult } from "@/lib/eval/runnerTypes";

function driver(status: DriverResult["status"]): DriverResult {
  return {
    sessionId: "s1",
    caseId: "crud-admin-v0.2",
    status,
    specId: status === "saved" ? "spec-1" : null,
    userTurns: 3,
    error: null,
    messages: [],
  };
}

describe("resolveRunState", () => {
  it("treats saved + passed as complete even when infra events exist", () => {
    const result = resolveRunState(driver("saved"), { infraFailureCount: 2 }, true);
    expect(result).toEqual({
      runState: "complete",
      failureOwner: null,
      failureStage: null,
    });
  });

  it("flags infra when not saved and infra failures exist", () => {
    const result = resolveRunState(driver("abandoned"), { infraFailureCount: 1 }, false);
    expect(result.failureOwner).toBe("infra");
    expect(result.runState).toBe("error");
  });

  it("treats abandoned without save as model failure", () => {
    const result = resolveRunState(driver("abandoned"), { infraFailureCount: 0 }, false);
    expect(result).toEqual({
      runState: "complete",
      failureOwner: "model",
      failureStage: "no_save",
    });
  });

  it("marks saved + failed assertions as model artifact failure", () => {
    const result = resolveRunState(driver("saved"), { infraFailureCount: 0 }, false);
    expect(result).toEqual({
      runState: "complete",
      failureOwner: "model",
      failureStage: "artifact",
    });
  });

  it("treats driver error as runner failure", () => {
    const result = resolveRunState(driver("error"), { infraFailureCount: 0 }, false);
    expect(result).toEqual({
      runState: "error",
      failureOwner: "runner",
      failureStage: "driver",
    });
  });
});
