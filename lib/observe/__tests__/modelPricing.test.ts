import { describe, expect, it } from "vitest";

import {
  estimateSessionCostUsd,
  formatEstCostUsd,
  formatTokenCount,
  resolveTokensForCost,
} from "@/lib/observe/modelPricing";

describe("estimateSessionCostUsd", () => {
  it("returns null when model is unknown or tokens are zero", () => {
    expect(estimateSessionCostUsd(null, 1000, 500)).toBeNull();
    expect(estimateSessionCostUsd("gpt-5.6-terra", 0, 0)).toBeNull();
    expect(estimateSessionCostUsd("unknown-model", 1000, 500)).toBeNull();
  });

  it("computes gpt-5.6-terra list price when cache data is unavailable", () => {
    const cost = estimateSessionCostUsd("gpt-5.6-terra", 1_000_000, 500_000);
    expect(cost?.basis).toBe("list");
    expect(cost?.usd).toBeCloseTo(2.0 + 12.0 * 0.5, 6);
  });

  it("resolves model id with provider prefix", () => {
    const cost = estimateSessionCostUsd("openai:gpt-5.6-terra", 1_000_000, 0);
    expect(cost?.usd).toBeCloseTo(2.0, 6);
  });

  it("applies cached input rate when cache_read_tokens are recorded", () => {
    const cost = estimateSessionCostUsd("gpt-5.6-terra", 1_000_000, 0, 800_000, true);
    expect(cost?.basis).toBe("cached");
    expect(cost?.usd).toBeCloseTo(0.56, 6);
  });

  it("caps cached tokens at input total", () => {
    const cost = estimateSessionCostUsd("gpt-5.6-terra", 100_000, 0, 500_000, true);
    expect(cost).toEqual({ usd: 100_000 * 0.2 / 1e6, basis: "cached" });
  });
});

describe("resolveTokensForCost", () => {
  it("prefers turn-level input/output split", () => {
    expect(
      resolveTokensForCost(
        {
          inputTokens: 800,
          outputTokens: 200,
          cacheReadTokens: 0,
          hasCacheData: false,
        },
        50_000,
      ),
    ).toEqual({
      inputTokens: 800,
      outputTokens: 200,
      cacheReadTokens: 0,
      hasCacheData: false,
    });
  });

  it("falls back to run total when turn split is missing", () => {
    const result = resolveTokensForCost(
      {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        hasCacheData: false,
      },
      10_000,
    );
    expect(result.inputTokens + result.outputTokens).toBe(10_000);
    expect(result.inputTokens).toBeGreaterThan(0);
  });
});

describe("formatTokenCount", () => {
  it("formats large counts with grouping", () => {
    expect(formatTokenCount(62609)).toBe("62,609");
    expect(formatTokenCount(null)).toBe("—");
  });
});

describe("formatEstCostUsd", () => {
  it("formats small and larger USD amounts", () => {
    expect(formatEstCostUsd(null)).toBe("—");
    expect(formatEstCostUsd(0.0123)).toBe("$0.01");
    expect(formatEstCostUsd(0.00456)).toBe("$0.005");
    expect(formatEstCostUsd(0.00012)).toBe("$0.0001");
  });

  it("prefixes list-price estimates with ~", () => {
    expect(formatEstCostUsd(0.09, "list")).toBe("~$0.09");
    expect(formatEstCostUsd(0.09, "cached")).toBe("$0.09");
  });
});
