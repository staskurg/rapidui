import goldenRui from "@/lib/registry/golden/support-dashboard.rui.json";
import { RUI_FILE_EXTENSION } from "@/lib/registry";
import { ERROR_CATALOG } from "@/lib/validate/messages";
import { VALIDATION_VERSION } from "@/lib/validate/version";

import { getBaseUrl } from "./base";
import { readDoc } from "./load";
import { getSupportDashboardMockApi } from "./mock-api";

export const DOCS_VERSION = "0.1";

const SUPPORT_DASHBOARD_PROMPT =
  "Generate a RUI for an internal support dashboard. Bind to GET /api/tickets (ticket list) and GET /api/tickets/stats (open and urgent counts).";

function getApiSection(baseUrl: string) {
  return {
    validate: {
      method: "POST",
      path: "/api/validate",
      url: `${baseUrl}/api/validate`,
      contentType: "application/json",
      body: "Raw RUI JSON (version 0.1)",
      maxBodyBytes: 262144,
      responses: {
        success: {
          httpStatus: 200,
          shape: {
            valid: true,
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.1",
            normalizedRui: "<canonical RUI object>",
          },
        },
        validationFailed: {
          httpStatus: 200,
          shape: {
            valid: false,
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.1",
            errors: [
              {
                path: "string",
                code: "string",
                message: "string",
                hint: "string",
              },
            ],
            truncated: false,
          },
          notes:
            "Semantic failures return HTTP 200 with valid: false. Fix errors[] and retry.",
        },
        transportFailure: {
          httpStatus: 400,
          shape: {
            valid: false,
            errors: [{ path: "", code: "INVALID_JSON", message: "...", hint: "..." }],
          },
          notes: "Invalid JSON, wrong Content-Type, empty body, or body > 256 KB.",
        },
      },
    },
    specs: {
      status: "planned",
      implementedIn: "§4",
      method: "POST",
      path: "/api/specs",
      url: `${baseUrl}/api/specs`,
      httpStatus: 501,
      message:
        "RUI persistence is not available yet. Use POST /api/validate and keep normalizedRui locally until §4 ships.",
      stubResponse: {
        status: "planned",
        message:
          "RUI persistence is not available yet. Use POST /api/validate and keep normalizedRui locally until §4 ships.",
        implementedIn: "§4",
        docs: `${baseUrl}/api/docs`,
        validate: `${baseUrl}/api/validate`,
      },
      notes: "A spec is a stored RUI. Full store + receipt ships in §4.",
    },
  };
}

function getErrorsSection() {
  return Object.entries(ERROR_CATALOG).map(([code, template]) => ({
    code,
    message: template.message,
    hint: template.hint,
  }));
}

function getExamplesSection() {
  return {
    supportDashboard: {
      prompt: SUPPORT_DASHBOARD_PROMPT,
      mockApi: getSupportDashboardMockApi(),
      goldenRui,
    },
  };
}

/** Builds the JSON payload for GET /api/docs (§3). */
export function getDocsPayload() {
  const baseUrl = getBaseUrl();

  return {
    docsVersion: DOCS_VERSION,
    baseUrl,
    rui: {
      fileExtension: RUI_FILE_EXTENSION,
      description:
        "A RUI is a JSON document describing an app — its screens, blocks, and data bindings. Not React code.",
    },
    links: {
      llmsTxt: "/llms.txt",
      schema: "/api/schema",
      validate: "/api/validate",
      specs: "/api/specs",
    },
    sections: [
      { id: "overview", format: "markdown" as const, content: readDoc("overview") },
      { id: "workflow", format: "markdown" as const, content: readDoc("workflow") },
      { id: "nesting", format: "markdown" as const, content: readDoc("nesting") },
      { id: "api", format: "json" as const, content: getApiSection(baseUrl) },
      { id: "errors", format: "json" as const, content: getErrorsSection() },
      { id: "examples", format: "json" as const, content: getExamplesSection() },
      {
        id: "gettingStarted",
        format: "markdown" as const,
        content: readDoc("getting-started"),
      },
    ],
  };
}

export type DocsPayload = ReturnType<typeof getDocsPayload>;
