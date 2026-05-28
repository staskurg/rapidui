import { getBaseUrl } from "@/lib/base-url";
import { readDoc } from "./load";

/** Builds the Markdown body for GET /llms.txt (§3). */
export function getLlmsTxt(): string {
  const baseUrl = getBaseUrl();
  const instructions = readDoc("instructions").trim();

  return `# RapidUI

> Agent-first platform for generating, validating, and storing RUIs — JSON documents that describe app screens, blocks, and data bindings. Not React code.

RapidUI v0.1 helps external agents produce **valid RUIs** via a validate → correct → save loop. Fetch the schema, author JSON, validate until \`valid: true\`, then persist with \`POST /api/specs\`.

## Instructions

${instructions}

## Documentation

- [Agent documentation (JSON)](${baseUrl}/api/docs)
- [Vocabulary / schema](${baseUrl}/api/schema)

## API

- [POST /api/validate](${baseUrl}/api/validate) — validate a RUI; retry on \`errors[]\` until \`valid: true\`
- [POST /api/specs](${baseUrl}/api/specs) — persist validated RUI; returns **201** flat SavedSpec (\`specId\`, \`url\`, \`viewUrl\`, \`normalizedRui\`)
- [GET /api/specs/:id](${baseUrl}/api/specs/{specId}) — retrieve saved spec by \`specId\` (JSON)
- [GET /specs/:id](${baseUrl}/specs/{specId}) — human RUI inspector (type-colored block tree)
`;
}
