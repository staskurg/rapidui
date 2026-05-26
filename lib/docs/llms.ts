import { getBaseUrl } from "./base";
import { readDoc } from "./load";

/** Builds the Markdown body for GET /llms.txt (§3). */
export function getLlmsTxt(): string {
  const baseUrl = getBaseUrl();
  const instructions = readDoc("instructions").trim();

  return `# RapidUI

> Agent-first platform for generating, validating, and storing RUIs — JSON documents that describe app screens, blocks, and data bindings. Not React code.

RapidUI v0.1 helps external agents produce **valid RUIs** via a validate → correct → save loop. Fetch the schema, author JSON, validate until \`valid: true\`. Persistence (\`POST /api/specs\`) is planned for §4.

## Instructions

${instructions}

## Documentation

- [Agent documentation (JSON)](${baseUrl}/api/docs)
- [Vocabulary / schema](${baseUrl}/api/schema)

## API

- [POST /api/validate](${baseUrl}/api/validate) — validate a RUI; retry on \`errors[]\` until \`valid: true\`
- [POST /api/specs](${baseUrl}/api/specs) — **planned** (501 until §4); keep \`normalizedRui\` locally after validation
`;
}
