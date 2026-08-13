import { describe, expect, it } from "vitest";

import { loadCase } from "@/lib/eval/loadCase";
import { renderPrompt } from "@/lib/eval/renderPrompt";

describe("renderPrompt", () => {
  it("includes conversation script in TASK for Path B when mockApi is absent", () => {
    const evalCase = loadCase("crud-admin-v0.2");
    expect(evalCase.mockApi).toBeUndefined();

    const rendered = renderPrompt(evalCase, "local");
    expect(rendered).toContain("GET /api/users");
    expect(rendered).toContain("Planned conversation (eval script)");
    expect(rendered).toContain("Looks good — save it.");
  });
});
