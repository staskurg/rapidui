import { HTTP_METHODS } from "./data";
import {
  ACTION_VARIANTS,
  COLUMN_FORMATS,
  DETAIL_FIELD_FORMATS,
  FORM_FIELD_TYPES,
} from "./operations";
import { TRANSITION_TRIGGERS } from "./transitions";
import type { Rui } from "./rui";
import { SCHEMA_VERSION } from "./version";

const ILLUSTRATION_NOTE =
  "Examples use a neutral domain (projects / document submissions) to show JSON shapes only. Derive entity names, field keys, API paths, and labels from the user's request — do not copy example content into saved specs.";

/** Property-level contracts for RUI v0.2 — mirrors Zod schemas in lib/operations/*.ts */
export function getSchemaShapes() {
  return {
    illustrationNote: ILLUSTRATION_NOTE,
    formPresentation: {
      useOn: ["create", "update"],
      layout: "form",
      fields: "presentation.fields[] — not presentation.form or presentation.sections",
      field: {
        name: "string (required) — use in data.write.bodyMap values",
        label: "string (required)",
        type: FORM_FIELD_TYPES,
        required: "boolean (optional)",
        default: "any (optional)",
        options:
          "array of { value, label } (required when type is select; min 1 option)",
      },
      antiPatterns: [
        "presentation.form",
        "fields[].key on form layouts",
        'type "string", "boolean", or "toggle"',
      ],
    },
    detailPresentation: {
      useOn: ["read"],
      layout: "detail",
      sections: {
        description: "presentation.sections[] — fields only; no actions inside sections",
        section: {
          title: "string (required)",
          fields: "array of { key, label, format? }",
        },
        field: {
          key: "string (required) — not name",
          label: "string (required)",
          format: DETAIL_FIELD_FORMATS,
        },
      },
      actions: {
        description:
          "presentation.actions[] at the same level as sections — embedded act/delete only on read",
        act: {
          id: "string",
          type: "act",
          label: "string",
          variant: ACTION_VARIANTS,
          invoke: { method: "POST", path: "string" },
          outcomes: {
            success: { navigate: "operation id" },
            error: { stay: true },
          },
        },
        delete: {
          id: "string",
          type: "delete",
          label: "string",
          variant: ACTION_VARIANTS,
          confirm: { message: "string" },
          write: { method: "DELETE", path: "string" },
          outcomes: {
            success: { navigate: "operation id" },
            error: { stay: true },
          },
        },
      },
      antiPatterns: ["presentation.detail", "sections[].actions[]", "fields[].name on detail"],
    },
    tablePresentation: {
      useOn: ["browse"],
      layout: "table",
      columns: {
        item: { key: "string", label: "string", format: COLUMN_FORMATS },
        rule: "unique column keys",
      },
      filter: {
        optional: true,
        shape: "optional { field: column key, label: string, options: [{ value, label }] }",
        antiPatterns: ["filters", "filterBar"],
      },
      header: {
        optional: true,
        metrics: [{ key: "string", label: "string", value: "number or string" }],
        antiPatterns: ["presentation.metrics at operation root"],
      },
    },
    scopeSelector: {
      location: "entities[].scope.selectors[]",
      item: {
        id: "string — referenced as {scope.<id>} in API paths",
        label: "string",
        type: "select (literal)",
        required: "boolean",
        binding: {
          read: {
            method: "GET",
            path: "string",
            valuePath: "string (optional) — e.g. items when API returns an envelope",
            labelKey: "string (optional)",
            valueKey: "string (optional)",
          },
        },
      },
      antiPatterns: ["recordsPath", "flat binding without binding.read"],
    },
    apiBindings: {
      read: {
        method: "GET",
        path: "string — may include {param} and {scope.selectorId}",
        valuePath: "string (optional) — unwrap list envelope, e.g. items",
        labelKey: "string (optional)",
        valueKey: "string (optional)",
      },
      write: {
        method: HTTP_METHODS.filter((m) => m !== "GET"),
        path: "string",
        bodyMap:
          "optional record — API body key to form field name; values must match presentation.fields[].name",
      },
      invoke: { method: "POST", path: "string" },
    },
    mutatingOutcomes: {
      createUpdateDelete: {
        success: { navigate: "operation id" },
        error: { stay: true },
        cancel: '{ navigate: "operation id" } or { stay: true }',
      },
      embeddedAction: {
        success: { navigate: "operation id" },
        error: { stay: true },
      },
    },
    transitions: {
      triggers: TRANSITION_TRIGGERS,
      row: { from: "browse", map: "target param to browse column key" },
      cta: "required when browse and create share an entity",
      link: "detail to update or delete confirm",
      cancel: "form back navigation",
    },
  };
}

/**
 * Neutral-domain CRUD illustration — projects scoped by department.
 * Not used in eval cases or exploration scenarios.
 */
export const CRUD_ILLUSTRATION_SPEC = {
  version: SCHEMA_VERSION,
  app: { title: "Projects Console" },
  entities: [
    {
      id: "ent-projects",
      label: "Projects",
      entrypoints: ["op-browse-projects"],
      operationIds: [
        "op-browse-projects",
        "op-read-project",
        "op-create-project",
        "op-update-project",
      ],
      scope: {
        selectors: [
          {
            id: "departmentId",
            label: "Department",
            type: "select",
            required: true,
            binding: {
              read: {
                method: "GET",
                path: "/api/departments",
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
  operations: [
    {
      id: "op-browse-projects",
      entityId: "ent-projects",
      type: "browse",
      title: "Projects",
      route: "/projects",
      presentation: {
        layout: "table",
        columns: [
          { key: "id", label: "ID", format: "string" },
          { key: "title", label: "Title", format: "string" },
          { key: "status", label: "Status", format: "badge" },
        ],
        filter: {
          field: "status",
          label: "Status",
          options: [
            { value: "draft", label: "Draft" },
            { value: "active", label: "Active" },
          ],
        },
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/projects?departmentId={scope.departmentId}",
          valuePath: "items",
        },
      },
    },
    {
      id: "op-read-project",
      entityId: "ent-projects",
      type: "read",
      title: "Project",
      route: "/projects/{projectId}",
      params: ["projectId"],
      presentation: {
        layout: "detail",
        sections: [
          {
            title: "Overview",
            fields: [
              { key: "title", label: "Title", format: "string" },
              { key: "status", label: "Status", format: "string" },
              { key: "priority", label: "Priority", format: "number" },
              { key: "summary", label: "Summary", format: "text" },
            ],
          },
        ],
        actions: [
          {
            id: "act-delete-project",
            type: "delete",
            label: "Delete",
            variant: "danger",
            confirm: { message: "Delete this project?" },
            write: {
              method: "DELETE",
              path: "/api/projects/{projectId}?departmentId={scope.departmentId}",
            },
            outcomes: {
              success: { navigate: "op-browse-projects" },
              error: { stay: true },
            },
          },
        ],
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/projects/{projectId}?departmentId={scope.departmentId}",
        },
      },
    },
    {
      id: "op-create-project",
      entityId: "ent-projects",
      type: "create",
      title: "New project",
      route: "/projects/new",
      presentation: {
        layout: "form",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "draft", label: "Draft" },
              { value: "active", label: "Active" },
            ],
          },
          { name: "priority", label: "Priority", type: "number" },
          { name: "summary", label: "Summary", type: "textarea" },
        ],
      },
      data: {
        mode: "api",
        write: {
          method: "POST",
          path: "/api/projects?departmentId={scope.departmentId}",
          bodyMap: {
            title: "title",
            status: "status",
            priority: "priority",
            summary: "summary",
          },
        },
      },
      outcomes: {
        success: { navigate: "op-browse-projects" },
        error: { stay: true },
        cancel: { navigate: "op-browse-projects" },
      },
    },
    {
      id: "op-update-project",
      entityId: "ent-projects",
      type: "update",
      title: "Edit project",
      route: "/projects/{projectId}/edit",
      params: ["projectId"],
      presentation: {
        layout: "form",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: [
              { value: "draft", label: "Draft" },
              { value: "active", label: "Active" },
            ],
          },
          { name: "priority", label: "Priority", type: "number" },
          { name: "summary", label: "Summary", type: "textarea" },
        ],
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/projects/{projectId}?departmentId={scope.departmentId}",
        },
        write: {
          method: "PATCH",
          path: "/api/projects/{projectId}?departmentId={scope.departmentId}",
          bodyMap: {
            title: "title",
            status: "status",
            priority: "priority",
            summary: "summary",
          },
        },
      },
      outcomes: {
        success: { navigate: "op-read-project" },
        error: { stay: true },
        cancel: { navigate: "op-read-project" },
      },
    },
  ],
  transitions: [
    {
      from: "op-browse-projects",
      to: "op-read-project",
      trigger: "row",
      map: { projectId: "id" },
    },
    {
      from: "op-browse-projects",
      to: "op-create-project",
      trigger: "cta",
      label: "New project",
      placement: "toolbar",
    },
    {
      from: "op-read-project",
      to: "op-update-project",
      trigger: "link",
      label: "Edit",
    },
    {
      from: "op-create-project",
      to: "op-browse-projects",
      trigger: "cancel",
    },
    {
      from: "op-update-project",
      to: "op-read-project",
      trigger: "cancel",
    },
  ],
} satisfies Rui;

/**
 * Neutral-domain HITL illustration — document submission review queue.
 * Not used in eval cases or exploration scenarios.
 */
export const HITL_ILLUSTRATION_SPEC = {
  version: SCHEMA_VERSION,
  app: { title: "Submission Review" },
  entities: [
    {
      id: "ent-submissions",
      label: "Submissions",
      entrypoints: ["op-browse-submissions"],
      operationIds: ["op-browse-submissions", "op-read-submission"],
    },
  ],
  operations: [
    {
      id: "op-browse-submissions",
      entityId: "ent-submissions",
      type: "browse",
      title: "Queue",
      route: "/submissions",
      presentation: {
        layout: "table",
        columns: [
          { key: "id", label: "ID", format: "string" },
          { key: "reference", label: "Reference", format: "string" },
          { key: "category", label: "Category", format: "string" },
          { key: "score", label: "Score", format: "number" },
          { key: "status", label: "Status", format: "badge" },
        ],
        filter: {
          field: "status",
          label: "Status",
          options: [
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "declined", label: "Declined" },
          ],
        },
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/submissions",
          valuePath: "items",
        },
      },
    },
    {
      id: "op-read-submission",
      entityId: "ent-submissions",
      type: "read",
      title: "Review submission",
      route: "/submissions/{submissionId}",
      params: ["submissionId"],
      presentation: {
        layout: "detail",
        sections: [
          {
            title: "Summary",
            fields: [
              { key: "reference", label: "Reference", format: "string" },
              { key: "category", label: "Category", format: "string" },
              { key: "score", label: "Score", format: "number" },
              { key: "status", label: "Status", format: "string" },
            ],
          },
          {
            title: "Content",
            fields: [{ key: "body", label: "Body", format: "text" }],
          },
        ],
        actions: [
          {
            id: "act-accept",
            type: "act",
            label: "Accept",
            variant: "primary",
            invoke: {
              method: "POST",
              path: "/api/submissions/{submissionId}/accept",
            },
            outcomes: {
              success: { navigate: "op-browse-submissions" },
              error: { stay: true },
            },
          },
          {
            id: "act-decline",
            type: "act",
            label: "Decline",
            variant: "danger",
            invoke: {
              method: "POST",
              path: "/api/submissions/{submissionId}/decline",
            },
            outcomes: {
              success: { navigate: "op-browse-submissions" },
              error: { stay: true },
            },
          },
        ],
      },
      data: {
        mode: "api",
        read: {
          method: "GET",
          path: "/api/submissions/{submissionId}",
        },
      },
    },
  ],
  transitions: [
    {
      from: "op-browse-submissions",
      to: "op-read-submission",
      trigger: "row",
      map: { submissionId: "id" },
    },
  ],
} satisfies Rui;

/** Static browse table with filter and header metrics — UC1-relevant shapes. */
export const STATIC_BROWSE_ILLUSTRATION_SPEC = {
  version: SCHEMA_VERSION,
  app: { title: "Ops Snapshot" },
  entities: [
    {
      id: "ent-events",
      label: "Events",
      entrypoints: ["op-browse-events"],
      operationIds: ["op-browse-events"],
    },
  ],
  operations: [
    {
      id: "op-browse-events",
      entityId: "ent-events",
      type: "browse",
      title: "Events",
      route: "/events",
      presentation: {
        layout: "table",
        columns: [
          { key: "id", label: "ID", format: "string" },
          { key: "name", label: "Name", format: "string" },
          { key: "severity", label: "Severity", format: "badge" },
        ],
        filter: {
          field: "severity",
          label: "Severity",
          options: [
            { value: "low", label: "Low" },
            { value: "high", label: "High" },
          ],
        },
        header: {
          metrics: [
            { key: "open", label: "Open", value: 2 },
            { key: "closed", label: "Closed today", value: 1 },
          ],
        },
      },
      data: {
        mode: "static",
        records: [
          { id: "E-1", name: "Example A", severity: "high" },
          { id: "E-2", name: "Example B", severity: "low" },
        ],
      },
    },
  ],
  transitions: [],
} satisfies Rui;

export function getSchemaExamples() {
  return {
    illustrationNote: ILLUSTRATION_NOTE,
    minimalStaticBrowse: {
      version: SCHEMA_VERSION,
      app: { title: "Example" },
      entities: [
        {
          id: "ent-items",
          label: "Items",
          entrypoints: ["op-browse-items"],
          operationIds: ["op-browse-items"],
        },
      ],
      operations: [
        {
          id: "op-browse-items",
          entityId: "ent-items",
          type: "browse",
          title: "Items",
          route: "/items",
          presentation: {
            layout: "table",
            columns: [{ key: "id", label: "ID" }],
          },
          data: {
            mode: "static",
            records: [{ id: "1" }],
          },
        },
      ],
      transitions: [],
    },
    staticBrowseWithFilterAndMetrics: STATIC_BROWSE_ILLUSTRATION_SPEC,
    crudApiScoped: CRUD_ILLUSTRATION_SPEC,
    hitlReviewQueue: HITL_ILLUSTRATION_SPEC,
  };
}
