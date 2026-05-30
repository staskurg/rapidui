/** Machine-readable eval case — source of truth for prompt + scoring criteria. */
export type EvalCase = {
  id: string;
  title: string;
  prompt: string;
  mockApi?: {
    endpoints: Array<{
      method: string;
      path: string;
      description: string;
    }>;
  };
  successCriteria: SuccessCriteria;
};

export type SuccessCriteria = {
  mustValidate?: boolean;
  maxRetries?: number;
  requiredBlocks?: string[];
  requiredBindings?: string[];
};

/** Deterministic score breakdown — stored in eval_runs.score_details. */
export type ScoreDetails = {
  missingBlocks?: string[];
  missingBindings?: string[];
  retryExceeded?: boolean;
  specNotFound?: boolean;
};

export type ScoreResult = {
  passed: boolean;
  scoreDetails: ScoreDetails;
  blocksFound: string[];
  bindingsFound: string[];
};

/** Parsed ---EVAL_RESULT--- block (local runs). Field names match eval_runs columns. */
export type EvalResultBlock = {
  evalCaseId: string;
  agent: AgentKind;
  baseUrl: string;
  validateCount: number;
  errorCodes: string[];
  finalSpecId: string | null;
  viewUrl: string | null;
  blocksFound: string[];
};

export type AgentKind = "cursor" | "claude" | "codex";

export type EvalEnv = "prod" | "local";

export const EVAL_BASE_URLS: Record<EvalEnv, string> = {
  prod: "https://rapidui.dev",
  local: "http://localhost:3000",
};

export const AGENT_KINDS: readonly AgentKind[] = ["cursor", "claude", "codex"];
