import { describe, expect, it } from "vitest";

import type { Rui } from "@/lib/operations";
import { CRUD_ILLUSTRATION_SPEC } from "@/lib/operations";
import { validateSpec } from "@/lib/validate";
import { checkBindingPathPlaceholders } from "@/lib/validate/semantic/bindingPaths";

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

const scopedEntityWithCompanySelector = {
  ...scopedPathsWithoutSelector.entities[0],
  scope: {
    selectors: [
      {
        id: "companyId",
        label: "Company",
        type: "select" as const,
        required: true,
        binding: {
          read: {
            method: "GET" as const,
            path: "/api/companies",
            valuePath: "items",
            labelKey: "name",
            valueKey: "id",
          },
        },
      },
    ],
  },
};

/** UC2-S4.2 class — update write.path used `{scope.params.userId}` instead of `{userId}`. */
const s42MalformedUpdateBinding: Rui = {
  version: "0.2",
  app: { title: "Users Admin" },
  entities: [scopedEntityWithCompanySelector],
  operations: [
    {
      id: "op-update-user",
      entityId: "ent-users",
      type: "update",
      title: "Edit User",
      route: "/users/{userId}/edit",
      params: ["userId"],
      presentation: {
        layout: "form",
        fields: [{ name: "name", label: "Name", type: "text" }],
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/users/{userId}?companyId={scope.companyId}",
        },
        write: {
          method: "PATCH",
          path: "/api/users/{scope.params.userId}?companyId={scope.companyId}",
        },
      },
      outcomes: {
        success: { navigate: "op-update-user" },
        error: { stay: true },
        cancel: { navigate: "op-update-user" },
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
    const scopeErrors = result.errors.filter(
      (error) => error.code === "SCOPE_SELECTOR_MISSING",
    );
    expect(scopeErrors).toHaveLength(1);
  });

  it("accepts scope placeholders when selector is declared", () => {
    const spec: Rui = {
      ...scopedPathsWithoutSelector,
      entities: [scopedEntityWithCompanySelector],
    };

    const result = validateSpec(spec);
    expect(result.valid).toBe(true);
  });
});

describe("checkBindingPathPlaceholders", () => {
  it("rejects malformed scope tokens like {scope.params.userId} (UC2-S4.2 class)", () => {
    const errors = checkBindingPathPlaceholders(s42MalformedUpdateBinding);
    expect(errors.some((error) => error.code === "INVALID_BINDING_PLACEHOLDER")).toBe(true);
  });

  it("accepts declared route params and scope selectors in binding paths", () => {
    const errors = checkBindingPathPlaceholders({
      ...s42MalformedUpdateBinding,
      operations: [
        {
          ...s42MalformedUpdateBinding.operations[0],
          data: {
            mode: "api",
            read: {
              method: "GET",
              path: "/api/users/{userId}?companyId={scope.companyId}",
            },
            write: {
              method: "PATCH",
              path: "/api/users/{userId}?companyId={scope.companyId}",
            },
          },
        },
      ],
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects invented route placeholders on invoke bindings", () => {
    const errors = checkBindingPathPlaceholders({
      version: "0.2",
      app: { title: "Review Queue" },
      entities: [
        {
          id: "ent-drafts",
          label: "Drafts",
          entrypoints: ["op-read-draft"],
          operationIds: ["op-read-draft"],
        },
      ],
      operations: [
        {
          id: "op-read-draft",
          entityId: "ent-drafts",
          type: "read",
          title: "Draft",
          route: "/drafts/{draftId}",
          params: ["draftId"],
          presentation: {
            layout: "detail",
            sections: [{ title: "Draft", fields: [{ key: "title", label: "Title" }] }],
            actions: [
              {
                id: "act-approve",
                label: "Approve",
                type: "act",
                invoke: {
                  method: "POST",
                  path: "/api/drafts/{scope.params.draftId}/approve",
                },
                outcomes: {
                  success: { navigate: "op-read-draft" },
                  error: { stay: true },
                },
              },
            ],
          },
          data: {
            mode: "api",
            read: {
              method: "GET",
              path: "/api/drafts/{draftId}",
            },
          },
        },
      ],
      transitions: [],
    });
    expect(errors.some((error) => error.code === "INVALID_BINDING_PLACEHOLDER")).toBe(true);
  });

  it("surfaces UC2-S4.2 class errors through validateSpec on a valid CRUD illustration", () => {
    const spec = structuredClone(CRUD_ILLUSTRATION_SPEC) as Rui;
    const update = spec.operations.find((operation) => operation.id === "op-update-project");
    expect(update?.type).toBe("update");
    if (!update || update.type !== "update" || update.data.mode !== "api" || !update.data.write) {
      return;
    }
    update.data.write.path = "/api/projects/{scope.params.projectId}?departmentId={scope.departmentId}";

    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    if (result.valid) {
      return;
    }
    expect(result.errors.some((error) => error.code === "INVALID_BINDING_PLACEHOLDER")).toBe(
      true,
    );
  });
});
