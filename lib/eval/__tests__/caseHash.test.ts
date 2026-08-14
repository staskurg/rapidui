import { describe, expect, it } from "vitest";

import { loadCase } from "@/lib/eval/loadCase";
import { hashEvalCase } from "@/lib/eval/caseHash";

describe("hashEvalCase", () => {
  it("returns a stable sha256 prefix for the same case", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const first = hashEvalCase(evalCase);
    const second = hashEvalCase(evalCase);

    expect(first).toBe(second);
    expect(first.startsWith("sha256:")).toBe(true);
  });

  it("changes when assertions change", () => {
    const evalCase = loadCase("static-browse-v0.2");
    const baseline = hashEvalCase(evalCase);

    const mutated = {
      ...evalCase,
      successCriteria: {
        ...evalCase.successCriteria,
        assertions: evalCase.successCriteria.assertions.slice(0, -1),
      },
    };

    expect(hashEvalCase(mutated)).not.toBe(baseline);
  });
});
