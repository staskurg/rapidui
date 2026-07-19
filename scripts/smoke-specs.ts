import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import uc3Golden from "../lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json";
import {
  computeContentHash,
  getSpecById,
  insertSpec,
  isValidSpecId,
} from "../lib/db";
import { validateSpec } from "../lib/validate";

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

async function runSmokeSpecs(): Promise<void> {
  const goldenResult = validateSpec(uc3Golden);
  assert(goldenResult.valid, "UC3 golden RUI should validate");

  const saved = await insertSpec(goldenResult.normalizedRui, {
    validationVersion: goldenResult.validationVersion,
    registryVersion: goldenResult.registryVersion,
  });

  assert(saved.specId, "SavedSpec should include specId");
  assert(saved.url.includes(saved.specId), "SavedSpec url should include specId");
  assert(saved.viewUrl.includes(saved.specId), "SavedSpec viewUrl should include specId");
  assert(saved.viewUrl.includes("/specs/"), "SavedSpec viewUrl should use /specs/ path");
  assert(saved.createdAt.endsWith("Z"), "createdAt should be ISO 8601 UTC");
  assert(
    saved.contentHash.startsWith("sha256:"),
    "contentHash should have sha256: prefix",
  );
  assert(
    saved.contentHash === computeContentHash(goldenResult.normalizedRui),
    "contentHash should match computeContentHash(normalizedRui)",
  );
  assert(saved.validationVersion === "0.2", "validationVersion should be 0.2");
  assert(saved.registryVersion === "0.2", "registryVersion should be 0.2");
  assert(saved.normalizedRui, "SavedSpec should include normalizedRui");

  const fetched = await getSpecById(saved.specId);
  assert(fetched, "GET by specId should return saved spec");
  assert(
    JSON.stringify(fetched.normalizedRui) ===
      JSON.stringify(saved.normalizedRui),
    "Fetched normalizedRui should match POST response",
  );

  const invalidResult = validateSpec(loadFixture("wrong-version.json"));
  assert(!invalidResult.valid, "Invalid fixture should fail validation");

  assert(!isValidSpecId("not-a-uuid"), "Bogus id should fail isValidSpecId");
  assert(isValidSpecId(saved.specId), "Valid specId should pass isValidSpecId");

  const unknownId = randomUUID();
  const missing = await getSpecById(unknownId);
  assert(missing === null, "Unknown specId should return null");

  console.log("Specs smoke test passed:");
  console.log("- POST UC3 golden RUI → SavedSpec with sha256: contentHash");
  console.log("- GET by specId → matching normalizedRui");
  console.log("- v0.1 fixture → valid: false (no insert)");
  console.log(`- saved specId: ${saved.specId}`);
}

runSmokeSpecs().catch((error: unknown) => {
  console.error("Specs smoke test failed:", error);
  process.exit(1);
});
