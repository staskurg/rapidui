import fs from "node:fs";
import path from "node:path";

import { getSpecById } from "../lib/db/specs";
import { insertEvalRun } from "../lib/db/evalRuns";
import { buildViewUrl } from "../lib/db/urls";
import { parseEvalResult } from "../lib/eval/parseEvalResult";
import {
  parseCliArgs,
  parseCommaList,
  parseOptionalInt,
  requireArg,
} from "../lib/eval/parseCliArgs";
import { scoreRun } from "../lib/eval/scoreRun";
import type { AgentKind } from "../eval/types";
import { AGENT_KINDS, EVAL_BASE_URLS } from "../eval/types";

function parseAgent(raw: string): AgentKind {
  const agent = raw.trim().toLowerCase();
  if (!AGENT_KINDS.includes(agent as AgentKind)) {
    throw new Error(
      `Invalid --agent "${raw}" — expected one of: ${AGENT_KINDS.join(", ")}`,
    );
  }
  return agent as AgentKind;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv);

  let specId: string;
  let caseId: string;
  let agent: AgentKind;
  let validateCount: number;
  let errorCodes: string[];
  let baseUrl: string;
  let viewUrl: string | null;
  let notes: string | undefined;

  if (args.stdin) {
    const pasted = await readStdin();
    const parsed = parseEvalResult(pasted);
    if (!parsed.finalSpecId) {
      throw new Error("EVAL_RESULT block missing final_spec_id — cannot log run");
    }

    specId = parsed.finalSpecId;
    caseId = parsed.evalCaseId;
    agent = parsed.agent;
    validateCount = parsed.validateCount;
    errorCodes = parsed.errorCodes;
    baseUrl = parsed.baseUrl;
    viewUrl = parsed.viewUrl;
  } else {
    specId = requireArg(args, "specId");
    caseId = requireArg(args, "case");
    agent = parseAgent(requireArg(args, "agent"));
    const validateCountRaw = requireArg(args, "validate-count");
    validateCount = parseOptionalInt(validateCountRaw)!;
    errorCodes = parseCommaList(
      typeof args["error-codes"] === "string" ? args["error-codes"] : undefined,
    );
    baseUrl =
      typeof args["base-url"] === "string"
        ? args["base-url"]
        : EVAL_BASE_URLS.prod;
    notes = typeof args.notes === "string" ? args.notes : undefined;

    const spec = await getSpecById(specId);
    viewUrl = spec?.viewUrl ?? buildViewUrl(specId);
  }

  const score = await scoreRun({ specId, caseId, validateCount });

  console.log("Score result:");
  console.log(JSON.stringify(score, null, 2));

  const record = await insertEvalRun({
    evalCaseId: caseId,
    agent,
    baseUrl,
    passed: score.passed,
    validateCount,
    errorCodes,
    finalSpecId: specId,
    viewUrl,
    blocksFound: score.blocksFound,
    scoreDetails: score.scoreDetails,
    notes: notes ?? null,
  });

  console.log("\nLogged eval run:");
  console.log(JSON.stringify(record, null, 2));

  if (!score.passed) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("eval:log failed:", error);
  process.exit(1);
});
