import goldenRui from "../lib/registry/golden/support-dashboard.rui.json";
import { insertSpec } from "../lib/db/specs";
import { scoreRun } from "../lib/eval/scoreRun";
import { validateSpec } from "../lib/validate";

const PRIMARY_CASE = "support-dashboard-v0.1";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeEval(): Promise<void> {
  const goldenResult = validateSpec(goldenRui);
  assert(goldenResult.valid, "Golden RUI should validate");

  const saved = await insertSpec(goldenResult.normalizedRui, {
    validationVersion: goldenResult.validationVersion,
    registryVersion: goldenResult.registryVersion,
  });

  const score = await scoreRun({
    specId: saved.specId,
    caseId: PRIMARY_CASE,
    validateCount: 1,
  });

  assert(score.passed, `Golden spec should pass ${PRIMARY_CASE}: ${JSON.stringify(score.scoreDetails)}`);
  assert(score.blocksFound.includes("Table"), "Golden spec should include Table block");
  assert(score.blocksFound.includes("Metric"), "Golden spec should include Metric block");
  assert(
    score.bindingsFound.some((binding) => binding === "GET /api/tickets"),
    "Golden spec should bind GET /api/tickets",
  );

  console.log("Eval smoke test passed:");
  console.log(`- Golden RUI scored against ${PRIMARY_CASE}`);
  console.log(`- blocks_found: ${score.blocksFound.join(", ")}`);
  console.log(`- bindings_found: ${score.bindingsFound.join(", ")}`);
  console.log(`- saved specId: ${saved.specId}`);
}

runSmokeEval().catch((error: unknown) => {
  console.error("Eval smoke test failed:", error);
  process.exit(1);
});
