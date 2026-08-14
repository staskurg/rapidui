import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import type { EvalCase } from "../eval/types";
import { ingestAgentTelemetry } from "../lib/observe/writes";
import { getAgentRunExists } from "../lib/observe/queries";
import { loadCase } from "../lib/eval/loadCase";
import {
  optionalArg,
  parseCliArgs,
  parseCommaList,
  parseOptionalInt,
} from "../lib/eval/parseCliArgs";
import { collectProcessMetrics } from "../lib/eval/processMetrics";
import { parseDriverResult } from "../lib/eval/parseDriverResult";
import { printEvalRunSummary, printTrialResult } from "../lib/eval/formatEvalRunOutput";
import { resolveRunState } from "../lib/eval/resolveRunState";
import {
  EVAL_RUN_CASES,
  type DriverResult,
  type EvalRunCaseId,
  type EvalRunSummary,
  type TrialResult,
} from "../lib/eval/runnerTypes";
import { scoreRun } from "../lib/eval/scoreRun";
import { evaluateAssertionsSpecNotFound } from "../lib/eval/assertions";
import type { AssertionResult } from "../eval/types";
import { persistEvalTrial } from "../lib/eval/persistTrial";

const DRIVER_PATH = path.join(process.cwd(), "agent/scripts/eval_driver.py");
const PYTHON_PATH = path.join(process.cwd(), "agent/.venv/bin/python");
const UC4_CASE_ID = "spec-update-v0.2";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolvePythonExecutable(): string {
  if (process.env.EVAL_PYTHON) {
    return process.env.EVAL_PYTHON;
  }
  try {
    if (existsSync(PYTHON_PATH)) {
      return PYTHON_PATH;
    }
  } catch {
    // fall through
  }
  return "python3";
}

async function waitForAgentRun(
  sessionId: string,
  timeoutMs = 15_000,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await getAgentRunExists(sessionId)) {
      return true;
    }
    await sleep(500);
  }
  return false;
}

async function spawnEvalDriver(config: {
  sessionId: string;
  caseId: string;
  prompt: string;
  conversationScript: EvalCase["conversationScript"];
  agentUrl: string;
  maxUserTurns?: number;
  timeoutS: number;
  quiet?: boolean;
}): Promise<DriverResult> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "rapidui-eval-"));
  const configPath = path.join(tempDir, "driver-config.json");

  try {
    await writeFile(
      configPath,
      JSON.stringify(
        {
          session_id: config.sessionId,
          case_id: config.caseId,
          prompt: config.prompt,
          conversation_script: config.conversationScript ?? [],
          agent_url: config.agentUrl,
          max_user_turns: config.maxUserTurns,
          timeout_s: config.timeoutS,
        },
        null,
        2,
      ),
      "utf8",
    );

    const python = resolvePythonExecutable();
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(python, [DRIVER_PATH, "--config", configPath], {
        cwd: process.cwd(),
        env: process.env,
      });

      let out = "";
      let err = "";

      child.stdout.on("data", (chunk: Buffer) => {
        out += chunk.toString("utf8");
      });
      child.stderr.on("data", (chunk: Buffer) => {
        err += chunk.toString("utf8");
        if (!config.quiet) {
          process.stderr.write(chunk);
        }
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0 || code === 1 || code === 2) {
          resolve(out);
          return;
        }
        reject(
          new Error(
            `eval driver exited with code ${code ?? "unknown"}${err ? `: ${err}` : ""}`,
          ),
        );
      });
    });

    return parseDriverResult(stdout);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function assertRunnableCase(evalCase: EvalCase): void {
  if (evalCase.id === UC4_CASE_ID || evalCase.seedGolden) {
    throw new Error(
      `${evalCase.id} requires load_spec — excluded from automated eval:run until stretch O1`,
    );
  }

  if (evalCase.mode === "single-shot") {
    throw new Error(`${evalCase.id} is single-shot — eval:run supports guided mode only`);
  }

  if (!EVAL_RUN_CASES.includes(evalCase.id as EvalRunCaseId)) {
    throw new Error(
      `${evalCase.id} is not in the automated eval suite (${EVAL_RUN_CASES.join(", ")})`,
    );
  }
}

async function postTerminalOutcome(
  sessionId: string,
  caseId: string,
  outcome: "failed" | "abandoned",
  errorSummary?: string,
): Promise<void> {
  await ingestAgentTelemetry({
    session_id: sessionId,
    run: {
      outcome,
      eval_case_id: caseId,
      ...(errorSummary ? { error_summary: errorSummary } : {}),
    },
  });
}

async function runTrial(input: {
  evalCaseId: EvalRunCaseId;
  experimentId: string;
  trialIndex: number;
  agentUrl: string;
  platformBaseUrl: string;
  baselineExperimentId?: string | null;
  timeoutS: number;
  persist: boolean;
}): Promise<TrialResult> {
  const startedAt = new Date().toISOString();
  const evalCase = loadCase(input.evalCaseId);
  assertRunnableCase(evalCase);

  const sessionId = randomUUID();
  const trialId = randomUUID();
  const criteria = evalCase.successCriteria;

  const driver = await spawnEvalDriver({
    sessionId,
    caseId: evalCase.id,
    prompt: evalCase.prompt,
    conversationScript: evalCase.conversationScript,
    agentUrl: input.agentUrl,
    maxUserTurns: criteria.maxUserTurns,
    timeoutS: input.timeoutS,
    quiet: true,
  });

  await waitForAgentRun(sessionId);
  const process = await collectProcessMetrics(sessionId);

  let passed: boolean | null = null;
  let assertionResults: AssertionResult[] = [];
  let finalSpecId = driver.specId;

  if (driver.status === "saved" && driver.specId) {
    const score = await scoreRun({
      specId: driver.specId,
      caseId: evalCase.id,
      validateCount: process.validateAttempts,
      userTurns: driver.userTurns,
    });
    passed = score.passed;
    assertionResults = score.assertions;
    finalSpecId = driver.specId;
  } else {
    if (driver.status !== "saved") {
      const outcome =
        driver.status === "failed" || driver.status === "error" ? "failed" : "abandoned";
      await postTerminalOutcome(sessionId, evalCase.id, outcome, driver.error ?? undefined);
    }
    passed = false;
    assertionResults = evaluateAssertionsSpecNotFound(criteria.assertions);
  }

  const mustValidateMet =
    criteria.mustValidate === true ? process.validateAttempts >= 1 : null;

  const { runState, failureOwner, failureStage } = resolveRunState(
    driver,
    process,
    passed,
  );

  const trial: TrialResult = {
    id: trialId,
    experimentId: input.experimentId,
    trialIndex: input.trialIndex,
    sessionId,
    evalCaseId: evalCase.id,
    passed,
    runState,
    failureOwner,
    failureStage,
    failureDetail: driver.error,
    finalSpecId,
    assertionResults,
    process,
    userTurns: driver.userTurns,
    mustValidateMet,
    driverStatus: driver.status,
    transcript: driver.messages,
    startedAt,
    completedAt: new Date().toISOString(),
  };

  if (input.persist) {
    await persistEvalTrial(trial, evalCase, {
      platformBaseUrl: input.platformBaseUrl,
      baselineExperimentId: input.baselineExperimentId,
    });
  }

  return trial;
}

function summarizeTrials(
  experimentId: string,
  trials: TrialResult[],
): EvalRunSummary {
  let passed = 0;
  let failed = 0;
  let incomplete = 0;
  let errors = 0;

  for (const trial of trials) {
    if (trial.runState === "error") {
      errors += 1;
    } else if (trial.runState === "incomplete") {
      incomplete += 1;
    } else if (trial.passed) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  return {
    experimentId,
    trials,
    passed,
    failed,
    incomplete,
    errors,
  };
}

function trialSucceeded(trial: TrialResult): boolean {
  return trial.runState === "complete" && trial.passed === true;
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv);

  if (args.help) {
    console.log(`Usage:
  npm run eval:run
  npm run eval:run -- --case static-browse-v0.2

Options:
  --case=<id>         Run one case (comma-separated ok); default: all eval cases
  --agent-url=<url>   Agent base URL (default http://localhost:8000)
  --platform-url=<url> Platform base URL for telemetry (default RAPIDUI_BASE_URL or http://localhost:3000)
  --baseline-experiment=<uuid> Optional baseline experiment id for comparison (7.6)
  --timeout=<sec>     Per-turn chat timeout (default 300)
  --json              Print full trial JSON (includes transcript; very verbose)
  --no-persist        Skip writing trials to eval_trials (debug only)
  --dry-run           Validate cases without calling the agent`);
    return;
  }

  const dryRun = args["dry-run"] === true;
  const jsonOutput = args.json === true;
  const persist = args["no-persist"] !== true;
  const agentUrl =
    optionalArg(args, "agent-url") ??
    process.env.AGENT_URL ??
    "http://localhost:8000";
  const platformBaseUrl =
    optionalArg(args, "platform-url") ??
    process.env.RAPIDUI_BASE_URL ??
    "http://localhost:3000";
  const baselineExperimentId = optionalArg(args, "baseline-experiment") ?? null;
  const timeoutS = parseOptionalInt(optionalArg(args, "timeout")) ?? 300;

  let caseIds: EvalRunCaseId[];
  const caseArg = optionalArg(args, "case");
  if (caseArg) {
    caseIds = parseCommaList(caseArg) as EvalRunCaseId[];
  } else {
    caseIds = [...EVAL_RUN_CASES];
  }

  for (const caseId of caseIds) {
    const evalCase = loadCase(caseId);
    assertRunnableCase(evalCase);
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          agentUrl,
          timeoutS,
          cases: caseIds,
        },
        null,
        2,
      ),
    );
    return;
  }

  const experimentId = randomUUID();
  const trials: TrialResult[] = [];

  if (!jsonOutput) {
    console.log(`\neval:run experiment ${experimentId}`);
    if (!persist) {
      console.log("(no-persist — trials not written to eval_trials)\n");
    } else {
      console.log("");
    }
  }

  for (const [index, caseId] of caseIds.entries()) {
    console.log(`Running ${caseId} (${index + 1}/${caseIds.length})…`);
    const trial = await runTrial({
      evalCaseId: caseId,
      experimentId,
      trialIndex: index,
      agentUrl,
      platformBaseUrl,
      baselineExperimentId,
      timeoutS,
      persist,
    });
    trials.push(trial);
    if (jsonOutput) {
      console.log(JSON.stringify(trial, null, 2));
    } else {
      printTrialResult(trial);
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify(summarizeTrials(experimentId, trials), null, 2));
  } else {
    printEvalRunSummary(trials);
  }

  const allSucceeded = trials.every(trialSucceeded);
  if (!allSucceeded) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("eval:run failed:", error);
  process.exit(1);
});
