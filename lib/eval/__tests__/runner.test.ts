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
  it("all eval cases load with runnable scripts", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    const { EVAL_RUN_CASES } = await import("@/lib/eval/runnerTypes");

    for (const caseId of EVAL_RUN_CASES) {
      const evalCase = loadCase(caseId);
      const scriptLen = evalCase.conversationScript?.length ?? 0;
      expect(evalCase.conversationScript?.length).toBeGreaterThan(0);
      expect(evalCase.successCriteria.maxUserTurns).toBeGreaterThanOrEqual(scriptLen + 1);
      expect(evalCase.seedGolden).toBeUndefined();
    }

    const uc3Cases = [
      "ai-review-queue-v0.2",
      "ai-review-queue-clarification-v0.2",
      "ai-review-queue-negotiation-v0.2",
    ] as const;
    for (const caseId of uc3Cases) {
      const evalCase = loadCase(caseId);
      expect(
        evalCase.successCriteria.assertions.some(
          (assertion) => assertion.kind === "browseFilter",
        ),
      ).toBe(true);
    }

    const negotiation = loadCase("ai-review-queue-negotiation-v0.2");
    expect(
      negotiation.successCriteria.assertions.some(
        (assertion) => assertion.kind === "forbiddenEmbeddedAction",
      ),
    ).toBe(true);
  });

  it("each case has distinct script turns and exactly one save intent", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    const { EVAL_RUN_CASES } = await import("@/lib/eval/runnerTypes");

    for (const caseId of EVAL_RUN_CASES) {
      const evalCase = loadCase(caseId);
      const script = evalCase.conversationScript ?? [];
      const contents = script.map((entry) => entry.content);
      expect(new Set(contents).size).toBe(contents.length);

      const conversation = [evalCase.prompt, ...contents].join("\n");
      const saveMatches = conversation.match(/\bsave\b/gi) ?? [];
      expect(saveMatches).toHaveLength(1);
    }
  });

  it("UC2/UC3 cases deliver API contract in-band (no mockApi block)", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    const crud = loadCase("crud-admin-v0.2");
    const review = loadCase("ai-review-queue-v0.2");

    expect(crud.mockApi).toBeUndefined();
    expect(review.mockApi).toBeUndefined();
    expect(crud.conversationScript?.[0]?.content).toContain("/api/users");
    expect(crud.conversationScript?.[0]?.content).toContain("{items:");
    expect(review.prompt).toContain("/api/drafts");
    expect(crud.conversationScript?.at(-1)?.content).toMatch(/save it/i);
    expect(review.conversationScript?.at(-1)?.content).toMatch(/save it/i);
  });

  it("UC4 has seedGolden and is optional stretch", async () => {
    const { loadCase } = await import("@/lib/eval/loadCase");
    const uc4 = loadCase("spec-update-v0.2");
    expect(uc4.seedGolden).toBe("UC4-hr-ops-seed-v0.2");
  });
});
