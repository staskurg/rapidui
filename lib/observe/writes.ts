export {
  agentIngestPayloadSchema,
  type AgentIngestPayload,
  type AgentRunPayload,
  type AgentTurnPayload,
} from "./schemas";

import type { AgentIngestPayload, AgentRunPayload, AgentTurnPayload } from "./schemas";

/** Phase 1 — persist agent run summary rows to Neon. */
export async function insertAgentRun(
  sessionId: string,
  run: AgentRunPayload,
): Promise<{ id: string }> {
  void sessionId;
  void run;
  throw new Error("insertAgentRun is not implemented until Phase 1");
}

/** Phase 1 — persist per-turn agent telemetry rows to Neon. */
export async function insertAgentTurn(
  runId: string,
  turn: AgentTurnPayload,
): Promise<{ id: string }> {
  void runId;
  void turn;
  throw new Error("insertAgentTurn is not implemented until Phase 1");
}

/** Phase 0 — validate ingest shape only; no DB writes yet. */
export function validateAgentIngestPayload(payload: AgentIngestPayload): void {
  if (!payload.session_id.trim()) {
    throw new Error("session_id is required");
  }
}
