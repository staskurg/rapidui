import { RUI_FILE_EXTENSION } from "@/lib/operations";
import { ERROR_CATALOG } from "@/lib/validate/messages";
import { VALIDATION_VERSION } from "@/lib/validate/version";

import { getBaseUrl } from "@/lib/base-url";
import { TELEMETRY_HEADERS } from "@/lib/observe/headers";
import { readDoc } from "./load";

export const DOCS_VERSION = "0.2";

const OPTIONAL_TELEMETRY_HEADERS = [
  {
    name: TELEMETRY_HEADERS.sessionId,
    required: false,
    description:
      "Stable id for one agent session — correlates validate/save events in Observe.",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  {
    name: TELEMETRY_HEADERS.agent,
    required: false,
    description:
      "Agent identifier for analytics (e.g. claude, cursor, codex, rapidui-agent).",
    example: "claude",
  },
  {
    name: TELEMETRY_HEADERS.evalCaseId,
    required: false,
    description: "Eval case id when running a controlled eval.",
    example: "crud-admin-v0.2",
  },
  {
    name: TELEMETRY_HEADERS.intent,
    required: false,
    description: "Optional short label for the user goal or use case.",
    example: "UC2 users admin",
  },
] as const;

function getTelemetrySection(baseUrl: string) {
  return {
    description:
      "Optional HTTP headers on POST /api/validate and POST /api/specs. Platform records api_events for Observe — agents do not need Observe URLs.",
    headers: OPTIONAL_TELEMETRY_HEADERS,
    exampleCurl: `curl -X POST ${baseUrl}/api/validate \\
  -H "Content-Type: application/json" \\
  -H "${TELEMETRY_HEADERS.sessionId}: <session-uuid>" \\
  -H "${TELEMETRY_HEADERS.agent}: claude" \\
  -d @my-spec.rui.json`,
    ingestNote:
      "RapidUI Agent (FastAPI) posts run/turn summaries to POST /api/observe/ingest/agent — see lib/observe/INGEST.md in the repo.",
  };
}

function getApiSection(baseUrl: string) {
  return {
    validate: {
      method: "POST",
      path: "/api/validate",
      url: `${baseUrl}/api/validate`,
      contentType: "application/json",
      body: "Raw RUI JSON (version 0.2)",
      maxBodyBytes: 262144,
      optionalHeaders: OPTIONAL_TELEMETRY_HEADERS,
      responses: {
        success: {
          httpStatus: 200,
          shape: {
            valid: true,
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.2",
            normalizedRui: "<canonical RUI object>",
          },
        },
        validationFailed: {
          httpStatus: 200,
          shape: {
            valid: false,
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.2",
            errors: [
              {
                path: "operations[op-browse-users].data.read",
                code: "MISSING_DATA_BINDING",
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
      method: "POST",
      path: "/api/specs",
      url: `${baseUrl}/api/specs`,
      contentType: "application/json",
      body: "Raw RUI JSON (version 0.2) — same shape as POST /api/validate",
      maxBodyBytes: 262144,
      optionalHeaders: OPTIONAL_TELEMETRY_HEADERS,
      responses: {
        success: {
          httpStatus: 201,
          shape: {
            specId: "UUID",
            url: `${baseUrl}/api/specs/{specId}`,
            viewUrl: `${baseUrl}/specs/{specId}`,
            createdAt: "ISO 8601 UTC",
            contentHash: "sha256:…",
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.2",
            normalizedRui: "<canonical RUI object>",
          },
          notes:
            "Flat SavedSpec — re-validates inline. Share viewUrl for human review.",
        },
        validationFailed: {
          httpStatus: 200,
          shape: {
            valid: false,
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.2",
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
          notes: "Same as POST /api/validate — fix errors[] and retry.",
        },
        transportFailure: {
          httpStatus: 400,
          shape: {
            valid: false,
            errors: [{ path: "", code: "INVALID_JSON", message: "...", hint: "..." }],
          },
        },
        storageUnavailable: {
          httpStatus: 503,
          shape: {
            error: "STORAGE_UNAVAILABLE",
            message: "RUI store is temporarily unavailable.",
          },
        },
      },
      notes:
        "A spec is a stored RUI. url is the API retrieve link; viewUrl is the human inspector.",
    },
    specById: {
      method: "GET",
      path: "/api/specs/:id",
      url: `${baseUrl}/api/specs/{specId}`,
      responses: {
        success: {
          httpStatus: 200,
          shape: {
            specId: "UUID",
            url: `${baseUrl}/api/specs/{specId}`,
            viewUrl: `${baseUrl}/specs/{specId}`,
            createdAt: "ISO 8601 UTC",
            contentHash: "sha256:…",
            validationVersion: VALIDATION_VERSION,
            registryVersion: "0.2",
            normalizedRui: "<canonical RUI object>",
          },
        },
        notFound: {
          httpStatus: 404,
          shape: { error: "NOT_FOUND", specId: "UUID" },
        },
        invalidSpecId: {
          httpStatus: 400,
          shape: {
            error: "INVALID_SPEC_ID",
            message: "specId must be a UUID.",
          },
        },
        storageUnavailable: {
          httpStatus: 503,
          shape: {
            error: "STORAGE_UNAVAILABLE",
            message: "RUI store is temporarily unavailable.",
          },
        },
      },
    },
    inspector: {
      method: "GET",
      path: "/specs/:id",
      url: `${baseUrl}/specs/{specId}`,
      notes:
        "Human RUI inspector — operations summary + raw JSON for v0.2 specs. Public; no auth.",
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

/** Builds the JSON payload for GET /api/docs. */
export function getDocsPayload() {
  const baseUrl = getBaseUrl();

  return {
    docsVersion: DOCS_VERSION,
    baseUrl,
    telemetry: getTelemetrySection(baseUrl),
    rui: {
      fileExtension: RUI_FILE_EXTENSION,
      description:
        "A RUI is an operations-first JSON workflow document — entities, operations, transitions, and data bindings. Not React code.",
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
      { id: "operations", format: "markdown" as const, content: readDoc("operations") },
      { id: "api", format: "json" as const, content: getApiSection(baseUrl) },
      { id: "errors", format: "json" as const, content: getErrorsSection() },
      {
        id: "gettingStarted",
        format: "markdown" as const,
        content: readDoc("getting-started"),
      },
    ],
  };
}

export type DocsPayload = ReturnType<typeof getDocsPayload>;
