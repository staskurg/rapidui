import { getBaseUrl } from "@/lib/base-url";
import { readDoc } from "./load";

/** Builds the Markdown body for GET /llms.txt. */
export function getLlmsTxt(): string {
  const baseUrl = getBaseUrl();
  const instructions = readDoc("instructions").trim();

  return `# RapidUI

> Agent-first platform for generating, validating, and storing RUIs — JSON documents that describe operational UI workflows (entities, operations, transitions). Not React code.

RapidUI v0.2 helps agents produce **valid operations-first RUIs** via a discover → plan → map → validate → save loop. Fetch the schema, author JSON with \`version: "0.2"\`, validate until \`valid: true\`, then persist with \`POST /api/specs\`.

## Instructions

${instructions}

## Documentation

- [Agent documentation (JSON)](${baseUrl}/api/docs)
- [Vocabulary / schema](${baseUrl}/api/schema)

## API

- [POST /api/validate](${baseUrl}/api/validate) — validate a RUI; retry on \`errors[]\` until \`valid: true\`
- [POST /api/specs](${baseUrl}/api/specs) — persist validated RUI; returns **201** flat SavedSpec (\`specId\`, \`url\`, \`viewUrl\`, \`normalizedRui\`)
- [GET /api/specs/:id](${baseUrl}/api/specs/{specId}) — retrieve saved spec by \`specId\` (JSON)
- [GET /specs/:id](${baseUrl}/specs/{specId}) — human RUI inspector (operations summary + JSON)
`;
}
