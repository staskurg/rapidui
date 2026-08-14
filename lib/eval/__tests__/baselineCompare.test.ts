import { describe, expect, it } from "vitest";

import {
  areTrialConfigsCompatible,
  type TrialConfigDimensions,
} from "@/lib/eval/baselineCompare";

const base: TrialConfigDimensions = {
  evalCaseId: "static-browse-v0.2",
  caseHash: "sha256:abc",
  model: "gpt-5.6-terra",
  promptVersion: "v1.2",
  evalMode: "guided",
  validationVersion: "0.2",
  registryVersion: "0.2",
};

describe("areTrialConfigsCompatible", () => {
  it("returns true for identical config dimensions", () => {
    expect(areTrialConfigsCompatible(base, { ...base })).toBe(true);
  });

  it("returns false when case hash differs", () => {
    expect(
      areTrialConfigsCompatible(base, {
        ...base,
        caseHash: "sha256:other",
      }),
    ).toBe(false);
  });

  it("returns false when model or prompt differs", () => {
    expect(
      areTrialConfigsCompatible(base, {
        ...base,
        model: "gpt-other",
      }),
    ).toBe(false);

    expect(
      areTrialConfigsCompatible(base, {
        ...base,
        promptVersion: "v2",
      }),
    ).toBe(false);
  });
});
