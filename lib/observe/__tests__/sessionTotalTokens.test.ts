import { describe, expect, it } from "vitest";

import { resolveSessionTotalTokens } from "@/lib/observe/queries";

describe("resolveSessionTotalTokens", () => {
  it("uses turn sum when agent_runs total is unset", () => {
    expect(
      resolveSessionTotalTokens(null, {
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadTokens: 0,
        hasCacheData: false,
      }),
    ).toBe(1500);
  });

  it("prefers turn sum over stale db total when turns exist", () => {
    expect(
      resolveSessionTotalTokens(100, {
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadTokens: 0,
        hasCacheData: false,
      }),
    ).toBe(1500);
  });

  it("falls back to db total when no turn tokens recorded", () => {
    expect(
      resolveSessionTotalTokens(68776, {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        hasCacheData: false,
      }),
    ).toBe(68776);
  });
});
