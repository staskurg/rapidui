import { z } from "zod";

const assertionBase = z.object({
  id: z.string().min(1),
});

export const OperationCountAssertionSchema = assertionBase.extend({
  kind: z.literal("operationCount"),
  type: z.string().min(1),
  minCount: z.number().int().min(0),
  maxCount: z.number().int().min(0).optional(),
});

export const OperationRouteAssertionSchema = assertionBase.extend({
  kind: z.literal("operationRoute"),
  type: z.string().min(1),
  route: z.string().min(1),
});

export const DataModeAssertionSchema = assertionBase.extend({
  kind: z.literal("dataMode"),
  type: z.string().min(1),
  mode: z.enum(["static", "api"]),
});

export const EmbeddedActionAssertionSchema = assertionBase.extend({
  kind: z.literal("embeddedAction"),
  type: z.string().min(1),
  hostOperationType: z.string().min(1),
  minCount: z.number().int().min(1),
});

export const ForbiddenEmbeddedActionAssertionSchema = assertionBase.extend({
  kind: z.literal("forbiddenEmbeddedAction"),
  type: z.string().min(1),
  hostOperationType: z.string().min(1),
});

export const TransitionTriggersAssertionSchema = assertionBase.extend({
  kind: z.literal("transitionTriggers"),
  triggers: z.array(z.string().min(1)).min(1),
});

export const DataPathAssertionSchema = assertionBase.extend({
  kind: z.literal("dataPath"),
  method: z.string().min(1),
  path: z.string().min(1),
});

export const AssertionSchema = z.discriminatedUnion("kind", [
  OperationCountAssertionSchema,
  OperationRouteAssertionSchema,
  DataModeAssertionSchema,
  EmbeddedActionAssertionSchema,
  ForbiddenEmbeddedActionAssertionSchema,
  TransitionTriggersAssertionSchema,
  DataPathAssertionSchema,
]);

export type Assertion = z.infer<typeof AssertionSchema>;

export const SuccessCriteriaSchema = z.object({
  mustValidate: z.boolean().optional(),
  maxRetries: z.number().int().min(0).optional(),
  maxUserTurns: z.number().int().min(0).optional(),
  maxLatencyMs: z.number().int().min(0).optional(),
  assertions: z.array(AssertionSchema).min(1),
});

export type SuccessCriteria = z.infer<typeof SuccessCriteriaSchema>;

export const EvalCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  mode: z.enum(["guided", "single-shot"]).optional(),
  prompt: z.string().min(1),
  conversationScript: z
    .array(
      z.object({
        trigger: z.literal("after_agent_reply"),
        content: z.string().min(1),
      }),
    )
    .optional(),
  mockApi: z
    .object({
      endpoints: z.array(
        z.object({
          method: z.string().min(1),
          path: z.string().min(1),
          description: z.string().min(1),
        }),
      ),
    })
    .optional(),
  seedGolden: z.string().min(1).optional(),
  successCriteria: SuccessCriteriaSchema,
});

/** Machine-readable eval case — source of truth for prompt + scoring criteria. */
export type EvalCase = z.infer<typeof EvalCaseSchema>;

export type AssertionResult = {
  id: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  evidence?: string;
};

/** Deterministic score breakdown — stored in eval_runs.score_details. */
export type ScoreDetails = {
  assertions: AssertionResult[];
  specNotFound?: boolean;
};

export type ScoreResult = {
  passed: boolean;
  assertions: AssertionResult[];
  /** Teaser summary for blocks_found — not used for pass/fail. */
  operationsFound: string[];
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
  operationsFound: string[];
};

export type AgentKind = "cursor" | "claude" | "codex";

export type EvalEnv = "prod" | "local";

export const EVAL_BASE_URLS: Record<EvalEnv, string> = {
  prod: "https://rapidui.dev",
  local: "http://localhost:3000",
};

export const AGENT_KINDS: readonly AgentKind[] = ["cursor", "claude", "codex"];
