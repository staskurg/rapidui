import uc1Golden from "../lib/operations/golden/UC1-static-browse-v0.2.rui.json";
import uc2Golden from "../lib/operations/golden/UC2-crud-admin-v0.2.rui.json";
import uc3Golden from "../lib/operations/golden/UC3-ai-review-queue-v0.2.rui.json";
import { insertSpec } from "../lib/db/specs";
import { evaluateAssertions } from "../lib/eval/assertions";
import { scoreRun } from "../lib/eval/scoreRun";
import { loadCase } from "../lib/eval/loadCase";
import { validateSpec } from "../lib/validate";
import type { Rui } from "../lib/operations";

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

/** Mutation helper — browse table schema has no actions; grader still must detect them. */
function injectBrowseActions(
  rui: Rui,
  actions: Array<Record<string, unknown>>,
): Rui {
  const mutated = structuredClone(rui);
  const browseOp = mutated.operations.find((op) => op.type === "browse");
  if (browseOp?.type === "browse") {
    Object.assign(browseOp.presentation, { actions });
  }
  return mutated;
}

function runMutationChecks(): void {
  const uc1Case = loadCase("static-browse-v0.2");
  const uc1OneBrowse = structuredClone(uc1Golden) as Rui;
  uc1OneBrowse.operations = uc1OneBrowse.operations.filter(
    (op) => op.route === "/incidents",
  );
  const uc1Mutation = evaluateAssertions(
    uc1OneBrowse,
    uc1Case.successCriteria.assertions,
  );
  const uc1BrowseCount = uc1Mutation.find(
    (result) => result.id === "uc1-browse-count",
  );
  assert(
    uc1BrowseCount && !uc1BrowseCount.passed,
    "UC1 one-browse mutation should fail uc1-browse-count",
  );

  const uc3Case = loadCase("ai-review-queue-v0.2");
  const uc3SingleAct = structuredClone(uc3Golden) as Rui;
  const readOp = uc3SingleAct.operations.find((op) => op.type === "read");
  if (readOp?.type === "read" && readOp.presentation.actions) {
    readOp.presentation.actions = readOp.presentation.actions.slice(0, 1);
  }
  const uc3Mutation = evaluateAssertions(
    uc3SingleAct,
    uc3Case.successCriteria.assertions,
  );
  const uc3ActCount = uc3Mutation.find(
    (result) => result.id === "uc3-act-on-detail",
  );
  assert(
    uc3ActCount && !uc3ActCount.passed,
    "UC3 single-act mutation should fail uc3-act-on-detail",
  );

  const negotiationCase = loadCase("ai-review-queue-negotiation-v0.2");
  const uc3RowAct = injectBrowseActions(uc3Golden as Rui, [
    {
      id: "op-row-approve",
      type: "act",
      label: "Approve",
      variant: "primary",
      invoke: {
        method: "POST",
        path: "/api/drafts/{draftId}/approve",
      },
      outcomes: {
        success: { stay: true },
        error: { stay: true },
      },
    },
  ]);
  const negotiationMutation = evaluateAssertions(
    uc3RowAct,
    negotiationCase.successCriteria.assertions,
  );
  const noRowAct = negotiationMutation.find(
    (result) => result.id === "uc3-no-row-act",
  );
  assert(
    noRowAct && !noRowAct.passed,
    "UC3 row-act mutation should fail uc3-no-row-act",
  );

  console.log("- Mutation UC1 one-browse fails uc1-browse-count");
  console.log("- Mutation UC3 single-act fails uc3-act-on-detail");
  console.log("- Mutation UC3 row-act fails uc3-no-row-act");
}

async function runSmokeEval(): Promise<void> {
  console.log("Eval smoke test passed:");

  runMutationChecks();

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
      `${label} golden spec should pass ${caseId}: ${JSON.stringify(score.assertions.filter((a) => !a.passed))}`,
    );

    console.log(`- ${label} golden scored against ${caseId} (specId: ${saved.specId})`);
    console.log(`  operations_found: ${score.operationsFound.join(", ")}`);
    const failed = score.assertions.filter((assertion) => !assertion.passed);
    if (failed.length > 0) {
      console.log(`  failed_assertions: ${failed.map((a) => a.id).join(", ")}`);
    }
  }
}

runSmokeEval().catch((error: unknown) => {
  console.error("Eval smoke test failed:", error);
  process.exit(1);
});
