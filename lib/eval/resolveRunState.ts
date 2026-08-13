import type { DriverResult, FailureOwner, ProcessMetrics, RunState } from "./runnerTypes";

export function resolveRunState(
  driver: DriverResult,
  process: Pick<ProcessMetrics, "infraFailureCount">,
  passed: boolean | null,
): { runState: RunState; failureOwner: FailureOwner; failureStage: string | null } {
  if (driver.status === "saved" && passed === true) {
    return { runState: "complete", failureOwner: null, failureStage: null };
  }

  if (process.infraFailureCount > 0) {
    return {
      runState: "error",
      failureOwner: "infra",
      failureStage: "platform_api",
    };
  }

  if (driver.status === "error") {
    return {
      runState: "error",
      failureOwner: "runner",
      failureStage: "driver",
    };
  }

  if (driver.status === "failed") {
    return {
      runState: "error",
      failureOwner: "runner",
      failureStage: "agent_chat",
    };
  }

  if (driver.status === "saved" && passed === false) {
    return { runState: "complete", failureOwner: "model", failureStage: "artifact" };
  }

  if (driver.status === "abandoned") {
    return { runState: "complete", failureOwner: "model", failureStage: "no_save" };
  }

  return { runState: "incomplete", failureOwner: null, failureStage: null };
}
