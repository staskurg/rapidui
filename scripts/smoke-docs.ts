import goldenRui from "../lib/registry/golden/support-dashboard.rui.json";
import { getSchemaPayload } from "../lib/registry";
import { getDocsPayload } from "../lib/docs";
import { getLlmsTxt } from "../lib/docs/llms";
import { ERROR_CATALOG } from "../lib/validate/messages";
import { validateSpec } from "../lib/validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Schema payload
const schema = getSchemaPayload();
assert(schema.version === "0.1", "Schema version should be 0.1");
const blockTypes = schema.blocks.map((b) => b.type);
assert(blockTypes.includes("Metric"), "Schema should include Metric");
assert(blockTypes.includes("Table"), "Schema should include Table");
assert(blockTypes.includes("Text"), "Schema should include Text");

// Docs payload
const docs = getDocsPayload();
assert(docs.docsVersion === "0.1", "Docs version should be 0.1");
assert(docs.baseUrl.length > 0, "Docs should include baseUrl");
assert(docs.sections.length >= 7, "Docs should include all sections");

const errorsSection = docs.sections.find((s) => s.id === "errors");
assert(errorsSection?.format === "json", "Errors section should be JSON");
assert(
  Array.isArray(errorsSection.content) &&
    errorsSection.content.length === Object.keys(ERROR_CATALOG).length,
  "Errors section should mirror ERROR_CATALOG",
);

const examplesSection = docs.sections.find((s) => s.id === "examples");
assert(examplesSection?.format === "json", "Examples section should be JSON");
const examples = examplesSection?.content as {
  supportDashboard?: { goldenRui?: unknown; mockApi?: unknown };
};
assert(examples?.supportDashboard?.goldenRui, "Examples should include golden RUI");
assert(examples?.supportDashboard?.mockApi, "Examples should include mockApi");

const apiSection = docs.sections.find((s) => s.id === "api");
const api = apiSection?.content as { specs?: { status?: string } };
assert(api?.specs?.status === "planned", "API section should document specs as planned");

// llms.txt
const llms = getLlmsTxt();
assert(llms.includes("# RapidUI"), "llms.txt should include title");
assert(llms.includes("## Instructions"), "llms.txt should include Instructions");
assert(llms.includes("## Documentation"), "llms.txt should include Documentation");
assert(llms.includes("## API"), "llms.txt should include API");
assert(llms.includes("/api/docs"), "llms.txt should link to /api/docs");
assert(llms.includes("/api/schema"), "llms.txt should link to /api/schema");

// Golden RUI still validates
const goldenResult = validateSpec(goldenRui);
assert(goldenResult.valid, "Golden RUI should validate");

console.log("Docs smoke test passed:");
console.log("- getSchemaPayload: version 0.1, Metric/Table/Text blocks");
console.log("- getDocsPayload: sections, errors catalog, examples, api.specs planned");
console.log("- getLlmsTxt: required llmstxt.org sections");
console.log("- golden RUI validates");
