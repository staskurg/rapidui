import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { sql } from "@/lib/db/client";
import { REGISTRY_VERSION } from "@/lib/operations";
import { VALIDATION_VERSION } from "@/lib/validate/version";

import { hashEvalCase } from "./caseHash";

import type { EvalCase } from "../../eval/types";

export const EVAL_AGENT_ID = "rapidui-agent-eval";
export const RUNNER_VERSION = "0.2";

export type GitSnapshot = {
  commit: string | null;
  dirty: boolean | null;
};

export type AgentRunConfig = {
  model: string | null;
  provider: string | null;
  promptVersion: string | null;
};

export type TrialConfigSnapshot = {
  caseHash: string;
  agent: string;
  baseUrl: string;
  model: string | null;
  provider: string | null;
  promptVersion: string | null;
  promptHash: string | null;
  evalMode: "guided" | "single-shot";
  gitCommit: string | null;
  gitDirty: boolean | null;
  runnerVersion: string;
  validationVersion: string;
  registryVersion: string;
};

export function collectGitSnapshot(): GitSnapshot {
  try {
    const commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    const status = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    return { commit, dirty: status.length > 0 };
  } catch {
    return { commit: null, dirty: null };
  }
}

export function hashPromptVersion(promptVersion: string): string | null {
  const promptPath = path.join(
    process.cwd(),
    "agent/prompts",
    `${promptVersion}.txt`,
  );
  if (!existsSync(promptPath)) {
    return null;
  }

  const content = readFileSync(promptPath, "utf8");
  const hex = createHash("sha256").update(content).digest("hex");
  return `sha256:${hex}`;
}

export async function getAgentRunConfig(
  sessionId: string,
): Promise<AgentRunConfig | null> {
  const result = await sql`
    SELECT model, provider, prompt_version
    FROM agent_runs
    WHERE session_id = ${sessionId}
    LIMIT 1
  `;

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    model: row.model ? String(row.model) : null,
    provider: row.provider ? String(row.provider) : null,
    promptVersion: row.prompt_version ? String(row.prompt_version) : null,
  };
}

export async function collectTrialConfigSnapshot(input: {
  evalCase: EvalCase;
  sessionId: string;
  platformBaseUrl: string;
}): Promise<TrialConfigSnapshot> {
  const caseHash = hashEvalCase(input.evalCase);
  const git = collectGitSnapshot();
  const agentRun = await getAgentRunConfig(input.sessionId);
  const promptVersion = agentRun?.promptVersion ?? null;
  const promptHash = promptVersion ? hashPromptVersion(promptVersion) : null;

  return {
    caseHash,
    agent: EVAL_AGENT_ID,
    baseUrl: input.platformBaseUrl.replace(/\/$/, ""),
    model: agentRun?.model ?? null,
    provider: agentRun?.provider ?? null,
    promptVersion,
    promptHash,
    evalMode: input.evalCase.mode ?? "guided",
    gitCommit: git.commit,
    gitDirty: git.dirty,
    runnerVersion: RUNNER_VERSION,
    validationVersion: VALIDATION_VERSION,
    registryVersion: REGISTRY_VERSION,
  };
}
