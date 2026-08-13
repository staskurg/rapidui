import { describe, expect, it } from "vitest";

import { STARTER_PROMPTS } from "@/lib/demo/starter-prompts";

describe("STARTER_PROMPTS", () => {
  it("includes UC1–UC3 with eval case ids", () => {
    expect(STARTER_PROMPTS.map((prompt) => prompt.id)).toEqual([
      "static-browse-v0.2",
      "crud-admin-v0.2",
      "ai-review-queue-v0.2",
    ]);
  });

  it("UC1 prompt describes both static browse screens", () => {
    const uc1 = STARTER_PROMPTS.find((prompt) => prompt.id === "static-browse-v0.2");
    expect(uc1?.prompt).toMatch(/Incidents/i);
    expect(uc1?.prompt).toMatch(/Teams/i);
    expect(uc1?.prompt).toMatch(/static/i);
  });

  it("UC2 demo prompt carries the API contract in-band", () => {
    const uc2 = STARTER_PROMPTS.find((prompt) => prompt.id === "crud-admin-v0.2");
    expect(uc2?.prompt).toContain("/api/users");
    expect(uc2?.prompt).toContain("{items:");
    expect(uc2?.prompt).toContain("{scope.companyId}");
    expect(uc2?.prompt).not.toBe("I need an admin UI for our Users API.");
  });

  it("UC3 demo prompt carries endpoints, filter, and detail actions", () => {
    const uc3 = STARTER_PROMPTS.find((prompt) => prompt.id === "ai-review-queue-v0.2");
    expect(uc3?.prompt).toContain("/api/drafts");
    expect(uc3?.prompt).toMatch(/status filter/i);
    expect(uc3?.prompt).toMatch(/detail screen/i);
    expect(uc3?.prompt).toContain("{items:");
  });
});
