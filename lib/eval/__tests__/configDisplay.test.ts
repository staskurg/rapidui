import { describe, expect, it } from "vitest";

import {
  configSnapshotFields,
  formatTrialModelLabel,
  resolveTrialPlatformEnv,
} from "@/lib/eval/configDisplay";
import type { EvalTrialRecord } from "@/lib/db/evalTrials";

function mockTrial(overrides: Partial<EvalTrialRecord> = {}): EvalTrialRecord {
  return {
    id: "trial-1",
    experiment_id: "exp-1",
    trial_index: 0,
    session_id: "session-1",
    eval_case_id: "static-browse-v0.2",
    case_hash: "sha256:abc",
    agent: "rapidui-agent-eval",
    base_url: "http://localhost:3000",
    model: "gpt-5.6-terra",
    provider: "openai",
    prompt_version: "v1.2",
    prompt_hash: "sha256:prompt",
    eval_mode: "guided",
    git_commit: "abc123",
    git_dirty: true,
    runner_version: "0.2",
    validation_version: "0.2",
    registry_version: "0.2",
    passed: true,
    run_state: "complete",
    failure_owner: null,
    failure_stage: null,
    failure_code: null,
    failure_detail: null,
    final_spec_id: null,
    content_hash: null,
    assertion_results: [],
    user_turns: 3,
    validate_attempts: 2,
    validation_failures: 0,
    tokens_in: null,
    tokens_out: null,
    latency_ms: 1000,
    must_validate_met: null,
    transcript_jsonb: null,
    conversation_scores: null,
    baseline_experiment_id: null,
    started_at: new Date("2026-08-13T12:00:00Z"),
    completed_at: new Date("2026-08-13T12:01:00Z"),
    ...overrides,
  };
}

describe("formatTrialModelLabel", () => {
  it("combines model and provider", () => {
    expect(formatTrialModelLabel("gpt-5.6-terra", "openai")).toBe(
      "gpt-5.6-terra · openai",
    );
  });
});

describe("resolveTrialPlatformEnv", () => {
  it("maps known base urls to local and prod", () => {
    expect(resolveTrialPlatformEnv("http://localhost:3000")).toBe("local");
    expect(resolveTrialPlatformEnv("https://rapidui.dev")).toBe("prod");
  });
});

describe("configSnapshotFields", () => {
  it("includes case-specific and shared config fields", () => {
    const fields = configSnapshotFields(mockTrial());
    const labels = fields.map((field) => field.label);

    expect(labels).toEqual([
      "Case",
      "Case hash",
      "Model",
      "Prompt",
      "Eval mode",
      "Environment",
      "Validation version",
      "Registry version",
    ]);
    expect(fields.find((field) => field.label === "Environment")?.value).toBe("local");
  });
});
