import fs from "node:fs";
import path from "node:path";

import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import { validateSpec } from "../lib/validate";
import { parseTransportBody } from "../lib/validate/transport";

const fixturesDir = path.join(process.cwd(), "lib/validate/fixtures");
const goldensDir = path.join(process.cwd(), "lib/operations/golden");

function loadFixture(name: string): unknown {
  const filePath = path.join(fixturesDir, name);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function loadGolden(name: string): unknown {
  const filePath = path.join(goldensDir, name);
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
  assert(
    match,
    `${label}: expected code ${expectedCode}, got ${result.errors.map((e) => e.code).join(", ")}`,
  );

  if (expectedPath !== undefined) {
    assert(
      match?.path === expectedPath,
      `${label}: expected path ${expectedPath}, got ${match?.path}`,
    );
  }
}

for (const goldenName of [
  "UC1-static-browse-v0.2.rui.json",
  "UC2-crud-admin-v0.2.rui.json",
  "UC3-ai-review-queue-v0.2.rui.json",
  "UC4-hr-ops-seed-v0.2.rui.json",
]) {
  const golden = loadGolden(goldenName);
  const result = validateSpec(golden);
  assert(result.valid, `${goldenName} should validate`);
}

const uc1Result = validateSpec(uc1Golden);
assert(uc1Result.valid, "UC1 golden should validate");
assert("normalizedRui" in uc1Result, "UC1 result should include normalizedRui");

const permuted = structuredClone(uc1Golden) as typeof uc1Golden;
permuted.entities.reverse();
const permutedResult = validateSpec(permuted);
assert(permutedResult.valid, "Permuted UC1 golden should validate");
assert(
  JSON.stringify(uc1Result.normalizedRui) ===
    JSON.stringify(permutedResult.normalizedRui),
  "normalizedRui should be stable across entity order",
);

assertInvalid("wrong-version", loadFixture("wrong-version.json"), "VERSION_MISMATCH", "version");
assertInvalid("duplicate-id", loadFixture("duplicate-id.json"), "DUPLICATE_ID");
assertInvalid(
  "missing-cta-transition",
  loadFixture("missing-cta-transition.json"),
  "MISSING_CTA_TRANSITION",
);
assertInvalid(
  "invalid-transition-map",
  loadFixture("invalid-transition-map.json"),
  "INVALID_TRANSITION_MAP",
);

const invalidJson = parseTransportBody("application/json", "{ not json");
assert(!("ok" in invalidJson) && invalidJson.valid === false, "Invalid JSON should fail transport");
assert(
  invalidJson.errors[0]?.code === "INVALID_JSON",
  "Invalid JSON should return INVALID_JSON",
);

console.log("Validation smoke test passed:");
console.log("- all UC goldens validate with normalizedRui");
console.log("- UC1 normalization stable across entity order");
console.log("- wrong-version → VERSION_MISMATCH");
console.log("- duplicate-id → DUPLICATE_ID");
console.log("- missing-cta-transition → MISSING_CTA_TRANSITION");
console.log("- invalid-transition-map → INVALID_TRANSITION_MAP");
console.log("- transport rejects invalid JSON");
