import { describe, expect, it } from "vitest";

import {
  agentFilterInputWithPreset,
  buildAgentFilterQuery,
  canonicalAgentFilterInput,
  hasActiveAgentFilters,
  shouldCanonicalizeAgentFilterUrl,
} from "@/lib/observe/agentFilterQuery";
import { windowRangeForPreset } from "@/lib/observe/queries";

describe("buildAgentFilterQuery", () => {
  it("includes non-date agent filters", () => {
    const defaults = windowRangeForPreset(7);
    expect(
      buildAgentFilterQuery({
        model: "",
        promptVersion: "v1.2",
        state: "",
        session: "  ",
      }),
    ).toBe(`?promptVersion=v1.2&from=${defaults.from}&to=${defaults.to}`);
  });

  it("converts legacy days param when building query", () => {
    const oneDay = windowRangeForPreset(1);
    expect(buildAgentFilterQuery({ days: "1" })).toBe(
      `?from=${oneDay.from}&to=${oneDay.to}`,
    );
  });
});

describe("shouldCanonicalizeAgentFilterUrl", () => {
  it("accepts canonical non-default date ranges", () => {
    expect(
      shouldCanonicalizeAgentFilterUrl({
        from: "2026-08-10",
        to: "2026-08-10",
      }),
    ).toBe(false);
  });
});

describe("canonicalAgentFilterInput", () => {
  it("resolves legacy days", () => {
    const oneDay = windowRangeForPreset(1);

    expect(
      canonicalAgentFilterInput({
        model: " gpt-5.6-terra ",
        agent: "",
        days: "1",
      }),
    ).toEqual({
      model: "gpt-5.6-terra",
      from: oneDay.from,
      to: oneDay.to,
    });
  });
});

describe("hasActiveAgentFilters", () => {
  it("is false for default window with no filters", () => {
    expect(hasActiveAgentFilters({})).toBe(false);
  });

  it("ignores notice params", () => {
    expect(hasActiveAgentFilters({ notice: "missing-session" })).toBe(false);
  });
});

describe("agentFilterInputWithPreset", () => {
  it("preserves agent-specific filters", () => {
    const oneDay = windowRangeForPreset(1);

    expect(
      agentFilterInputWithPreset(
        {
          model: "gpt-5.6-terra",
          from: "2026-08-01",
          to: "2026-08-07",
        },
        1,
      ),
    ).toEqual({
      model: "gpt-5.6-terra",
      from: oneDay.from,
      to: oneDay.to,
    });
  });
});
