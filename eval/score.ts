import { parseCliArgs, parseOptionalInt, requireArg } from "../lib/eval/parseCliArgs";
import { scoreRun } from "../lib/eval/scoreRun";

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv);
  const specId = requireArg(args, "specId");
  const caseId = requireArg(args, "case");
  const validateCount = parseOptionalInt(
    typeof args["validate-count"] === "string" ? args["validate-count"] : undefined,
  );

  const result = await scoreRun({ specId, caseId, validateCount });

  console.log(JSON.stringify(result, null, 2));

  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("eval:score failed:", error);
  process.exit(1);
});
