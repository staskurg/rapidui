import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import { getSchemaPayload } from "../lib/operations";
import { getDocsPayload } from "../lib/docs";
import { getLlmsTxt } from "../lib/docs/llms";
import { ERROR_CATALOG } from "../lib/validate/messages";
import { validateSpec } from "../lib/validate";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const schema = getSchemaPayload();
assert(schema.version === "0.2", "Schema version should be 0.2");
assert(Array.isArray(schema.transitionTriggers), "Schema should include transitionTriggers");
assert(schema.operationTypes.browse, "Schema should include browse operation type");

const docs = getDocsPayload();
assert(docs.docsVersion === "0.2", "Docs version should be 0.2");
assert(docs.baseUrl.length > 0, "Docs should include baseUrl");
assert(docs.sections.length === 6, "Docs should include six case-agnostic sections");

const sectionIds = docs.sections.map((s) => s.id);
assert(sectionIds.includes("operations"), "Docs should include operations section");
assert(!sectionIds.includes("nesting"), "Docs should not include v0.1 nesting section");
assert(
  !JSON.stringify(docs).includes("/api/tickets"),
  "Public docs must not embed eval-case API paths",
);

const errorsSection = docs.sections.find((s) => s.id === "errors");
assert(errorsSection?.format === "json", "Errors section should be JSON");
assert(
  Array.isArray(errorsSection.content) &&
    errorsSection.content.length === Object.keys(ERROR_CATALOG).length,
  "Errors section should mirror ERROR_CATALOG",
);

const llms = getLlmsTxt();
assert(llms.includes("# RapidUI"), "llms.txt should include title");
assert(llms.includes("0.2"), "llms.txt should mention v0.2");
assert(llms.includes("/api/docs"), "llms.txt should link to /api/docs");
assert(llms.includes("operations"), "llms.txt should mention operations");

const goldenResult = validateSpec(uc1Golden);
assert(goldenResult.valid, "UC1 golden should validate");

console.log("Docs smoke test passed:");
console.log("- getSchemaPayload: version 0.2, operations vocabulary");
console.log("- getDocsPayload: operations-first sections");
console.log("- getLlmsTxt: v0.2 discovery text");
console.log("- UC1 golden validates (repo fixture only)");
