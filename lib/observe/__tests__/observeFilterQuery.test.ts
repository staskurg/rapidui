import { describe, expect, it } from "vitest";

import { createObserveFilterQueryModule } from "@/lib/observe/observeFilterQuery";
import { windowRangeForPreset } from "@/lib/observe/queries";

const testModule = createObserveFilterQueryModule({
  filterKeys: ["agent", "session", "from", "to"] as const,
  basePath: "/observe/test",
});

describe("createObserveFilterQueryModule", () => {
  it("omits empty filter values and always includes dates", () => {
    const defaults = windowRangeForPreset(7);
    expect(
      testModule.buildQuery({
        agent: "",
        session: "  ",
      }),
    ).toBe(`?from=${defaults.from}&to=${defaults.to}`);
  });

  it("uses from/to dates instead of days", () => {
    expect(
      testModule.buildQuery({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe("?from=2026-08-10&to=2026-08-10");
  });

  it("adds default dates when none are provided", () => {
    const defaults = windowRangeForPreset(7);
    expect(testModule.buildQuery({})).toBe(`?from=${defaults.from}&to=${defaults.to}`);
  });

  it("detects empty, legacy, and missing date params", () => {
    expect(testModule.shouldCanonicalize({ agent: "" })).toBe(true);
    expect(testModule.shouldCanonicalize({ days: "1" })).toBe(true);
    expect(testModule.shouldCanonicalize({})).toBe(true);

    const defaults = windowRangeForPreset(7);
    expect(
      testModule.shouldCanonicalize({
        from: defaults.from,
        to: defaults.to,
      }),
    ).toBe(false);
  });

  it("strips blank fields and always includes from/to", () => {
    const defaults = windowRangeForPreset(7);

    expect(
      testModule.canonicalInput({
        agent: " smoke-agent ",
        session: "",
      }),
    ).toEqual({
      agent: "smoke-agent",
      from: defaults.from,
      to: defaults.to,
    });
  });

  it("replaces the date range while preserving other filters", () => {
    const oneDay = windowRangeForPreset(1);

    expect(
      testModule.inputWithPreset(
        {
          agent: "smoke-agent",
          from: "2026-08-01",
          to: "2026-08-07",
        },
        1,
      ),
    ).toEqual({
      agent: "smoke-agent",
      from: oneDay.from,
      to: oneDay.to,
    });
  });

  it("ignores date-only input for active filters", () => {
    expect(
      testModule.hasActiveFilters({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe(false);
    expect(testModule.hasActiveFilters({ agent: "smoke-agent" })).toBe(true);
  });
});

describe("createObserveFilterQueryModule inactive keys", () => {
  const moduleWithInactive = createObserveFilterQueryModule({
    filterKeys: ["agent", "notice", "from", "to"] as const,
    basePath: "/observe/test",
    inactiveFilterKeys: ["from", "to", "notice"],
  });

  it("excludes configured inactive keys from active filter detection", () => {
    expect(moduleWithInactive.hasActiveFilters({ notice: "missing-session" })).toBe(false);
    expect(moduleWithInactive.hasActiveFilters({ agent: "smoke-agent" })).toBe(true);
  });
});
