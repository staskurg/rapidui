import { describe, expect, it } from "vitest";

import { parseDriverResult } from "@/lib/eval/parseDriverResult";

describe("parseDriverResult", () => {
  it("parses trailing driver result block", () => {
    const stdout = `running turn 1...
---EVAL_DRIVER_RESULT---
{
  "sessionId": "abc",
  "caseId": "static-browse-v0.2",
  "status": "saved",
  "specId": "spec-1",
  "userTurns": 3,
  "error": null,
  "messages": []
}`;

    const result = parseDriverResult(stdout);
    expect(result.status).toBe("saved");
    expect(result.specId).toBe("spec-1");
    expect(result.userTurns).toBe(3);
  });

  it("throws when marker is missing", () => {
    expect(() => parseDriverResult("{}")).toThrow(/EVAL_DRIVER_RESULT/);
  });
});

describe("eval:run case guards", () => {
  it("loads UC1–UC3 without seedGolden", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    for (const caseId of [
      "static-browse-v0.2",
      "crud-admin-v0.2",
      "ai-review-queue-v0.2",
    ]) {
      const evalCase = loadCase(caseId);
      expect(evalCase.conversationScript?.length).toBeGreaterThan(0);
      expect(evalCase.seedGolden).toBeUndefined();
    }
  });

  it("UC4 has seedGolden and is optional stretch", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    const uc4 = loadCase("spec-update-v0.2");
    expect(uc4.seedGolden).toBe("UC4-hr-ops-seed-v0.2");
  });
});
