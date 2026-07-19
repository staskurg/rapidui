import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import uc2Golden from "../lib/operations/golden/UC2-crud-admin-v0.2.rui.json";
import uc3Golden from "../lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json";
import { insertSpec } from "../lib/db/specs";
import { scoreRun } from "../lib/eval/scoreRun";
import { validateSpec } from "../lib/validate";

const EVAL_SMOKE_CASES = [
  { label: "UC1", golden: uc1Golden, caseId: "static-browse-v0.2" },
  { label: "UC2", golden: uc2Golden, caseId: "crud-admin-v0.2" },
  { label: "UC3", golden: uc3Golden, caseId: "ai-review-queue-v0.2" },
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function runSmokeEval(): Promise<void> {
  console.log("Eval smoke test passed:");

  for (const { label, golden, caseId } of EVAL_SMOKE_CASES) {
    const goldenResult = validateSpec(golden);
    assert(goldenResult.valid, `${label} golden RUI should validate`);
    assert("normalizedRui" in goldenResult, `${label} result should include normalizedRui`);

    const saved = await insertSpec(goldenResult.normalizedRui, {
      validationVersion: goldenResult.validationVersion,
      registryVersion: goldenResult.registryVersion,
    });

    const score = await scoreRun({
      specId: saved.specId,
      caseId,
      validateCount: 1,
    });

    assert(
      score.passed,
      `${label} golden spec should pass ${caseId}: ${JSON.stringify(score.scoreDetails)}`,
    );

    console.log(`- ${label} golden scored against ${caseId} (specId: ${saved.specId})`);
    console.log(`  operations_found: ${score.operationsFound.join(", ")}`);
    if (score.embeddedActionsFound.length > 0) {
      console.log(`  embedded_actions_found: ${score.embeddedActionsFound.join(", ")}`);
    }
    if (score.dataPathsFound.length > 0) {
      console.log(`  data_paths_found: ${score.dataPathsFound.join(", ")}`);
    }
  }
}

runSmokeEval().catch((error: unknown) => {
  console.error("Eval smoke test failed:", error);
  process.exit(1);
});
