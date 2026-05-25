import fs from "node:fs";
import path from "node:path";

import goldenRui from "../lib/registry/golden/support-dashboard.rui.json";
import { validateSpec } from "../lib/validate";
import { parseTransportBody } from "../lib/validate/transport";

const fixturesDir = path.join(process.cwd(), "lib/validate/fixtures");

function loadFixture(name: string): unknown {
  const filePath = path.join(fixturesDir, name);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertInvalid(
  label: string,
  body: unknown,
  expectedCode: string,
  expectedPath?: string,
): void {
  const result = validateSpec(body);
  assert(!result.valid, `${label}: expected invalid result`);
  if (result.valid) {
    return;
  }

  const match = result.errors.find((error) => error.code === expectedCode);
  assert(match, `${label}: expected code ${expectedCode}, got ${result.errors.map((e) => e.code).join(", ")}`);

  if (expectedPath !== undefined) {
    assert(
      match?.path === expectedPath,
      `${label}: expected path ${expectedPath}, got ${match?.path}`,
    );
  }
}

// Golden pass
const goldenResult = validateSpec(goldenRui);
assert(goldenResult.valid, "Golden RUI should validate");
assert("normalizedRui" in goldenResult, "Golden result should include normalizedRui");

// Stable normalization across sibling order permutations
const permuted = structuredClone(goldenRui) as typeof goldenRui;
permuted.pages[0].children.reverse();
permuted.pages[0].children[0].children.reverse();
const permutedResult = validateSpec(permuted);
assert(permutedResult.valid, "Permuted golden RUI should validate");
assert(
  JSON.stringify(goldenResult.normalizedRui) ===
    JSON.stringify(permutedResult.normalizedRui),
  "normalizedRui should be stable across sibling order",
);

// Minimal invalid fixtures
assertInvalid(
  "wrong-version",
  loadFixture("wrong-version.json"),
  "VERSION_MISMATCH",
  "version",
);
assertInvalid(
  "duplicate-id",
  loadFixture("duplicate-id.json"),
  "DUPLICATE_ID",
);
assertInvalid(
  "planned-form",
  loadFixture("planned-form.json"),
  "PLANNED_NOT_SUPPORTED",
);

// Transport failures
const invalidJson = parseTransportBody("application/json", "{ not json");
assert(!("ok" in invalidJson) && invalidJson.valid === false, "Invalid JSON should fail transport");
assert(
  invalidJson.errors[0]?.code === "INVALID_JSON",
  "Invalid JSON should return INVALID_JSON",
);

console.log("Validation smoke test passed:");
console.log("- golden RUI validates with normalizedRui");
console.log("- normalization stable across sibling permutations");
console.log("- wrong-version → VERSION_MISMATCH");
console.log("- duplicate-id → DUPLICATE_ID");
console.log("- planned-form → PLANNED_NOT_SUPPORTED");
console.log("- transport rejects invalid JSON");
