import type { AgentKind, EvalResultBlock } from "../../eval/types";
import { AGENT_KINDS } from "../../eval/types";

const BLOCK_START = "---EVAL_RESULT---";
const BLOCK_END = "---END---";

function parseListValue(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return trimmed ? [trimmed] : [];
  }

  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }

  return inner.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseAgent(raw: string): AgentKind {
  const agent = raw.trim().toLowerCase();
  if (!AGENT_KINDS.includes(agent as AgentKind)) {
    throw new Error(
      `Invalid agent "${raw}" — expected one of: ${AGENT_KINDS.join(", ")}`,
    );
  }
  return agent as AgentKind;
}

function parseNullableString(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.toLowerCase() === "null") {
    return null;
  }
  return value;
}

/** Parse a ---EVAL_RESULT--- block from pasted agent output. */
export function parseEvalResult(text: string): EvalResultBlock {
  const start = text.indexOf(BLOCK_START);
  const end = text.indexOf(BLOCK_END);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `Missing ${BLOCK_START} … ${BLOCK_END} block in input`,
    );
  }

  const body = text.slice(start + BLOCK_START.length, end).trim();
  const fields = new Map<string, string>();

  for (const line of body.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    fields.set(key, value);
  }

  const evalCaseId = fields.get("eval_case_id");
  const agentRaw = fields.get("agent");
  const baseUrl = fields.get("base_url");
  const validateCountRaw = fields.get("validate_count");

  if (!evalCaseId || !agentRaw || !baseUrl || validateCountRaw === undefined) {
    throw new Error(
      "EVAL_RESULT block missing required fields: eval_case_id, agent, base_url, validate_count",
    );
  }

  const validateCount = Number.parseInt(validateCountRaw, 10);
  if (Number.isNaN(validateCount)) {
    throw new Error(`Invalid validate_count: "${validateCountRaw}"`);
  }

  return {
    evalCaseId,
    agent: parseAgent(agentRaw),
    baseUrl,
    validateCount,
    errorCodes: parseListValue(fields.get("error_codes") ?? "[]"),
    finalSpecId: parseNullableString(fields.get("final_spec_id") ?? "null"),
    viewUrl: parseNullableString(fields.get("view_url") ?? "null"),
    operationsFound: parseListValue(
      fields.get("operations_found") ?? fields.get("blocks_found") ?? "[]",
    ),
    sessionId: parseNullableString(fields.get("session_id") ?? "null"),
  };
}
