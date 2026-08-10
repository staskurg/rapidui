import { describe, expect, it } from "vitest";

import {
  estimateSessionCostUsd,
  formatEstCostUsd,
  formatTokenCount,
} from "@/lib/observe/modelPricing";

describe("estimateSessionCostUsd", () => {
  it("returns null when model is unknown or tokens are zero", () => {
    expect(estimateSessionCostUsd(null, 1000, 500)).toBeNull();
    expect(estimateSessionCostUsd("o4-mini", 0, 0)).toBeNull();
    expect(estimateSessionCostUsd("unknown-model", 1000, 500)).toBeNull();
  });

  it("computes o4-mini list price when cache data is unavailable", () => {
    const cost = estimateSessionCostUsd("o4-mini", 1_000_000, 500_000);
    expect(cost?.basis).toBe("list");
    expect(cost?.usd).toBeCloseTo(1.1 + 4.4 * 0.5, 6);
  });

  it("applies cached input rate when cache_read_tokens are recorded", () => {
    const cost = estimateSessionCostUsd("o4-mini", 1_000_000, 0, 800_000, true);
    expect(cost?.basis).toBe("cached");
    expect(cost?.usd).toBeCloseTo(0.44, 6);
  });

  it("caps cached tokens at input total", () => {
    const cost = estimateSessionCostUsd("o4-mini", 100_000, 0, 500_000, true);
    expect(cost).toEqual({ usd: 100_000 * 0.275 / 1e6, basis: "cached" });
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
