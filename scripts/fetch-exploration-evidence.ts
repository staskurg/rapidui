/**
 * Pull exploration run evidence and print a pre-filled run-entry skeleton.
 *
 * Usage:
 *   npm run fetch:exploration-evidence -- <sessionId> [runId]
 *   npm run fetch:exploration-evidence -- abc-123 UC1-S1.1
 *
 * Requires DATABASE_URL (.env.local). Dev server base URL optional (RAPIDUI_BASE_URL).
 */
import { getChatTranscript } from "../lib/chat/transcriptWrites";
import type { UIMessageWire } from "../lib/chat/transcriptSchema";
import { getAgentRunDetail } from "../lib/observe/queries";

const BASE_URL = (process.env.RAPIDUI_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type ToolEvent = {
  toolName: "validate_rui" | "save_rui";
  userTurnIndex: number;
  specId?: string;
  valid?: boolean;
};

function parseArgs(): { sessionId: string; runId: string } {
  const sessionId = process.argv[2]?.trim();
  const runId = process.argv[3]?.trim() ?? "<scenario>.<n>";

  if (!sessionId) {
    console.error("Usage: npm run fetch:exploration-evidence -- <sessionId> [runId]");
    console.error("Example: npm run fetch:exploration-evidence -- abc-123-def UC1-S1.1");
    process.exit(1);
  }

  return { sessionId, runId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToolPart(part: unknown, toolName: string): boolean {
  if (!isRecord(part)) {
    return false;
  }
  if (part.type === `tool-${toolName}`) {
    return true;
  }
  return part.type === "dynamic-tool" && part.toolName === toolName;
}

function userTurnIndexAt(messages: UIMessageWire[], messageIndex: number): number {
  let count = 0;
  for (let index = 0; index <= messageIndex; index += 1) {
    if (messages[index]?.role === "user") {
      count += 1;
    }
  }
  return count;
}

function extractToolEvents(messages: UIMessageWire[]): ToolEvent[] {
  const events: ToolEvent[] = [];

  for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
    const message = messages[messageIndex];
    if (message.role !== "assistant") {
      continue;
    }

    const turn = userTurnIndexAt(messages, messageIndex);

    for (const part of message.parts) {
      if (isToolPart(part, "validate_rui")) {
        const output = isRecord(part) ? part.output : undefined;
        events.push({
          toolName: "validate_rui",
          userTurnIndex: turn,
          valid: isRecord(output) && output.valid === true ? true : isRecord(output) ? false : undefined,
        });
      }
      if (isToolPart(part, "save_rui")) {
        const output = isRecord(part) ? part.output : undefined;
        const specId =
          isRecord(output) && typeof output.specId === "string" ? output.specId : undefined;
        events.push({
          toolName: "save_rui",
          userTurnIndex: turn,
          specId,
        });
      }
    }
  }

  return events;
}

function uniqueErrorCodes(
  timeline: { endpoint: string; valid: boolean | null; error_codes: string[] | null }[],
): string[] {
  const codes = new Set<string>();
  for (const event of timeline) {
    if (event.endpoint !== "/api/validate" || event.valid !== false) {
      continue;
    }
    for (const code of event.error_codes ?? []) {
      codes.add(code);
    }
  }
  return [...codes];
}

function formatOutcomeHint(
  outcome: "saved" | "failed" | "abandoned" | null,
  saveCount: number,
): string {
  if (saveCount === 0) {
    return "no-save (no save_rui in transcript; run.outcome may still be null until New chat)";
  }
  if (outcome === "saved") {
    return "? saved-clean | saved-off-target | saved-negotiated — check artifact vs watch-fors";
  }
  return `? outcome=${outcome ?? "null"}, but save_rui present — verify`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const { sessionId, runId } = parseArgs();

  const [transcript, observe] = await Promise.all([
    getChatTranscript(sessionId),
    getAgentRunDetail(sessionId),
  ]);

  if (!transcript) {
    console.error(`No agent_runs row for session ${sessionId}`);
    process.exit(1);
  }

  const toolEvents = extractToolEvents(transcript.messages);
  const validateEvents = toolEvents.filter((event) => event.toolName === "validate_rui");
  const saveEvents = toolEvents.filter((event) => event.toolName === "save_rui");
  const saveSpecIds = saveEvents
    .map((event) => event.specId)
    .filter((id): id is string => Boolean(id));

  const errorCodes = observe ? uniqueErrorCodes(observe.timeline) : [];
  const validateAttempts = observe?.run.validateAttempts ?? "?";
  const firstValidateTurn = validateEvents[0]?.userTurnIndex ?? "—";
  const latestSpecId =
    saveSpecIds.at(-1) ?? transcript.run.specId ?? "?";
  const parentSpecId = saveSpecIds.length > 1 ? saveSpecIds[0] : null;

  console.log("--- exploration evidence ---");
  console.log(`sessionId:     ${sessionId}`);
  console.log(`chat:          ${BASE_URL}/chat/${sessionId}`);
  console.log(`observe:       ${BASE_URL}/observe/agent/sessions/${sessionId}`);
  console.log(`transcript:    ${BASE_URL}/api/chat/sessions/${sessionId}/transcript`);
  console.log(`turnCount:     ${transcript.turnCount}`);
  console.log(`run.outcome:   ${transcript.run.outcome ?? "null"}`);
  console.log(`run.specId:    ${transcript.run.specId ?? "null"} (latest save in agent_runs)`);
  if (saveSpecIds.length > 0) {
    console.log(`save specIds:  ${saveSpecIds.join(" → ")} (from transcript tool parts)`);
  }
  if (parentSpecId) {
    console.log(`parent spec:   ${parentSpecId} (first save — use for pre-S+1 parent entry)`);
  }
  console.log(`validates:     ${validateAttempts}${observe?.validateCountMismatch ? " (agent count mismatch)" : ""}`);
  console.log(`error codes:   ${errorCodes.length > 0 ? errorCodes.join(", ") : "none"}`);
  console.log(`first validate: user turn ${firstValidateTurn}`);
  console.log(`spec JSON:     curl -s -H "X-RapidUI-Session-Id: ${sessionId}" ${BASE_URL}/api/specs/${latestSpecId}`);
  console.log("  (GET /api/specs writes no api_events — safe to use the run's session id)");
  console.log("");

  const errorsField = errorCodes.length > 0 ? errorCodes.join(", ") : "none";
  const specField =
    saveSpecIds.length > 1
      ? `${latestSpecId} (S+1/latest; parent was ${parentSpecId})`
      : String(latestSpecId);

  console.log("--- run entry skeleton (fill judgment fields) ---");
  console.log("");
  console.log(`#### ${runId} — ${todayIsoDate()}`);
  console.log(`- **Result:** ${formatOutcomeHint(transcript.run.outcome, saveEvents.length)}`);
  console.log(
    `- **Session / spec:** ${sessionId} / ${specField} · **Chat:** \`/chat/${sessionId}\``,
  );
  console.log(
    `- **Turns / validates / errors:** ${transcript.turnCount} / ${validateAttempts} / ${errorsField}`,
  );
  console.log("- **Interview:** ?");
  console.log("- **Inventions:** ?");
  console.log("- **Artifact vs target:** ?");
  console.log("- **Feed-forward:** ?");
}

main().catch((error: unknown) => {
  console.error("fetch:exploration-evidence failed:", error);
  process.exit(1);
});
