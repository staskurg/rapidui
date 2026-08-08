import { describe, expect, it } from "vitest";

import type { Rui } from "@/lib/operations";
import { validateSpec } from "@/lib/validate";

const scopedPathsWithoutSelector: Rui = {
  version: "0.2",
  app: { title: "Users Admin" },
  entities: [
    {
      id: "ent-users",
      label: "Users",
      entrypoints: ["op-browse-users"],
      operationIds: ["op-browse-users"],
    },
  ],
  operations: [
    {
      id: "op-browse-users",
      entityId: "ent-users",
      type: "browse",
      title: "Users",
      route: "/users",
      presentation: {
        layout: "table",
        columns: [{ key: "id", label: "ID" }],
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/users?companyId={scope.companyId}",
        },
      },
    },
  ],
  transitions: [],
};

describe("checkScope", () => {
  it("rejects scope placeholders when entity has no matching selectors (UC2-S1.3 class)", () => {
    const result = validateSpec(scopedPathsWithoutSelector);
    expect(result.valid).toBe(false);
    if (result.valid) {
      return;
    }
    expect(result.errors.some((error) => error.code === "SCOPE_SELECTOR_MISSING")).toBe(true);
  });

  it("accepts scope placeholders when selector is declared", () => {
    const spec: Rui = {
      ...scopedPathsWithoutSelector,
      entities: [
        {
          ...scopedPathsWithoutSelector.entities[0],
          scope: {
            selectors: [
              {
                id: "companyId",
                label: "Company",
                type: "select",
                required: true,
                binding: {
                  read: {
                    method: "GET",
                    path: "/api/companies",
                    valuePath: "items",
                    labelKey: "name",
                    valueKey: "id",
                  },
                },
              },
            ],
          },
        },
      ],
    };

    const result = validateSpec(spec);
    expect(result.valid).toBe(true);
  });
});
