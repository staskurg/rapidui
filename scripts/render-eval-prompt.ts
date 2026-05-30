import { loadCase } from "../lib/eval/loadCase";
import { renderPrompt } from "../lib/eval/renderPrompt";
import type { EvalEnv } from "../eval/types";
import { parseCliArgs, requireArg } from "../lib/eval/parseCliArgs";

function parseEnv(raw: string): EvalEnv {
  if (raw === "prod" || raw === "local") {
    return raw;
  }
  throw new Error(`Invalid --env "${raw}" — expected prod or local`);
}

function main(): void {
  const args = parseCliArgs(process.argv);
  const caseId = requireArg(args, "case");
  const env = parseEnv(requireArg(args, "env"));

  const evalCase = loadCase(caseId);
  const prompt = renderPrompt(evalCase, env);

  process.stdout.write(prompt);
  if (!prompt.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

main();
