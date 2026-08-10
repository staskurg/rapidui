import { describe, expect, it } from "vitest";

import { AGENT_STALE_SESSION_MS, resolveAgentSessionState } from "@/lib/observe/queries";

const now = Date.now();
const recentAt = new Date(now - 5 * 60 * 1000);
const staleAt = new Date(now - AGENT_STALE_SESSION_MS - 60_000);

function resolve(
  overrides: Partial<Parameters<typeof resolveAgentSessionState>[0]> = {},
) {
  return resolveAgentSessionState({
    dbOutcome: null,
    lastActivityAt: recentAt,
    hasSave: false,
    hasPassValidate: false,
    now,
    ...overrides,
  });
}

describe("resolveAgentSessionState", () => {
  it("returns saved when api_events has a save", () => {
    expect(resolve({ hasSave: true, hasPassValidate: true })).toBe("saved");
  });

  it("returns failed when db outcome is failed, even after a passing validate", () => {
    expect(resolve({ dbOutcome: "failed", hasPassValidate: true })).toBe("failed");
  });

  it("returns draft when validate passed and no save", () => {
    expect(resolve({ hasPassValidate: true })).toBe("draft");
  });

  it("returns abandoned when db outcome is abandoned without validate, even when recent", () => {
    expect(resolve({ dbOutcome: "abandoned", lastActivityAt: recentAt })).toBe("abandoned");
  });

  it("returns active when recent with no validate or terminal outcome", () => {
    expect(resolve({ lastActivityAt: recentAt })).toBe("active");
  });

  it("returns abandoned when stale with no validate", () => {
    expect(resolve({ lastActivityAt: staleAt })).toBe("abandoned");
  });

  it("returns draft after New chat when a passing validate exists", () => {
    expect(
      resolve({
        dbOutcome: "abandoned",
        hasPassValidate: true,
        lastActivityAt: staleAt,
      }),
    ).toBe("draft");
  });
});
