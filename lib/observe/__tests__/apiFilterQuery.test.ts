import { describe, expect, it } from "vitest";

import {
  apiFilterInputWithPreset,
  buildApiFilterQuery,
  canonicalApiFilterInput,
  hasActiveApiFilters,
  shouldCanonicalizeApiFilterUrl,
} from "@/lib/observe/apiFilterQuery";
import { windowRangeForPreset } from "@/lib/observe/queries";

describe("buildApiFilterQuery", () => {
  it("includes non-date api filters", () => {
    const defaults = windowRangeForPreset(7);
    expect(
      buildApiFilterQuery({
        agent: "",
        evalCase: "case-a",
        session: "  ",
      }),
    ).toBe(`?evalCase=case-a&from=${defaults.from}&to=${defaults.to}`);
  });
});

describe("shouldCanonicalizeApiFilterUrl", () => {
  it("accepts canonical default date ranges", () => {
    const defaults = windowRangeForPreset(7);
    expect(
      shouldCanonicalizeApiFilterUrl({
        from: defaults.from,
        to: defaults.to,
      }),
    ).toBe(false);
  });
});

describe("canonicalApiFilterInput", () => {
  it("strips blank fields", () => {
    const defaults = windowRangeForPreset(7);

    expect(
      canonicalApiFilterInput({
        agent: " smoke-agent ",
        session: "",
      }),
    ).toEqual({
      agent: "smoke-agent",
      from: defaults.from,
      to: defaults.to,
    });
  });
});

describe("hasActiveApiFilters", () => {
  it("is true when a non-date filter is active", () => {
    expect(hasActiveApiFilters({ agent: "smoke-agent" })).toBe(true);
  });
});

describe("apiFilterInputWithPreset", () => {
  it("preserves api-specific filters", () => {
    const oneDay = windowRangeForPreset(1);

    expect(
      apiFilterInputWithPreset(
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
});
