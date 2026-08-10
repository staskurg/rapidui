import { describe, expect, it } from "vitest";

import {
  buildAgentFilterQuery,
  canonicalAgentFilterInput,
  hasActiveAgentFilters,
  shouldCanonicalizeAgentFilterUrl,
} from "@/lib/observe/agentFilterQuery";
import { windowRangeForPreset } from "@/lib/observe/queries";

describe("buildAgentFilterQuery", () => {
  it("omits empty filter values", () => {
    expect(
      buildAgentFilterQuery({
        model: "",
        promptVersion: "v1.2",
        state: "",
        session: "  ",
      }),
    ).toBe("?promptVersion=v1.2");
  });

  it("uses from/to dates instead of days", () => {
    expect(
      buildAgentFilterQuery({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe("?from=2026-08-10&to=2026-08-10");
  });

  it("omits default 7-day range from the URL", () => {
    const defaults = windowRangeForPreset(7);
    expect(
      buildAgentFilterQuery({
        from: defaults.from,
        to: defaults.to,
      }),
    ).toBe("");
  });

  it("converts legacy days param when building query", () => {
    const oneDay = windowRangeForPreset(1);
    expect(buildAgentFilterQuery({ days: "1" })).toBe(
      `?from=${oneDay.from}&to=${oneDay.to}`,
    );
  });
});

describe("shouldCanonicalizeAgentFilterUrl", () => {
  it("detects empty, legacy, and default-range params", () => {
    expect(shouldCanonicalizeAgentFilterUrl({ model: "" })).toBe(true);
    expect(shouldCanonicalizeAgentFilterUrl({ days: "1" })).toBe(true);
    expect(shouldCanonicalizeAgentFilterUrl({ from: "2026-08-10" })).toBe(true);

    const defaults = windowRangeForPreset(7);
    expect(
      shouldCanonicalizeAgentFilterUrl({
        from: defaults.from,
        to: defaults.to,
      }),
    ).toBe(true);

    expect(shouldCanonicalizeAgentFilterUrl({ model: "o4-mini" })).toBe(false);
    expect(
      shouldCanonicalizeAgentFilterUrl({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe(false);
  });
});

describe("canonicalAgentFilterInput", () => {
  it("strips blank fields and legacy days", () => {
    expect(
      canonicalAgentFilterInput({
        model: " o4-mini ",
        agent: "",
        days: "1",
      }),
    ).toEqual({
      model: "o4-mini",
      from: windowRangeForPreset(1).from,
      to: windowRangeForPreset(1).to,
    });
  });
});

describe("hasActiveAgentFilters", () => {
  it("is false for default window with no filters", () => {
    expect(hasActiveAgentFilters({})).toBe(false);
  });

  it("is true when a non-default date range is active", () => {
    expect(
      hasActiveAgentFilters({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe(true);
  });
});
