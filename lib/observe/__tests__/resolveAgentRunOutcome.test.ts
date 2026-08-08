import { describe, expect, it } from "vitest";

import { AGENT_STALE_SESSION_MS, resolveAgentRunOutcome } from "@/lib/observe/queries";

describe("resolveAgentRunOutcome", () => {
  it("returns terminal outcomes unchanged", () => {
    const now = new Date();
    expect(resolveAgentRunOutcome("saved", now)).toBe("saved");
    expect(resolveAgentRunOutcome("failed", now)).toBe("failed");
    expect(resolveAgentRunOutcome("abandoned", now)).toBe("abandoned");
  });

  it("infers abandoned when stale and no transcript", () => {
    const staleAt = new Date(Date.now() - AGENT_STALE_SESSION_MS - 60_000);
    expect(resolveAgentRunOutcome(null, staleAt, false)).toBe("abandoned_inferred");
  });

  it("stays in progress when stale but has transcript", () => {
    const staleAt = new Date(Date.now() - AGENT_STALE_SESSION_MS - 60_000);
    expect(resolveAgentRunOutcome(null, staleAt, true)).toBe("in_progress");
  });

  it("stays in progress when recent and no transcript", () => {
    expect(resolveAgentRunOutcome(null, new Date(), false)).toBe("in_progress");
  });
});
