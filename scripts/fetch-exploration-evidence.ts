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

/** Keep in sync with .cursor/chat-exploration-scenarios.md#save-intent-classification-v12 */
type SaveIntentShape = "one-shot (escape hatch)" | "draft → confirm";

type SaveIntentEntry = {
  saveIntentTurnMin: number;
  saveIntentTurnMax: number;
  shape: SaveIntentShape;
  savePhrasing: string;
};

function parseScenarioIdFromRunId(runId: string): string | null {
  const match = runId.trim().match(/^(UC[123]-S\d+|D[123]|S\+1)(?:\.|r|$)/);
  return match?.[1] ?? null;
}

function isSaveBeforeSaveIntent(firstSaveTurn: number, entry: SaveIntentEntry): boolean {
  return firstSaveTurn < entry.saveIntentTurnMin;
}

const SAVE_INTENT: Record<string, SaveIntentEntry> = {
  "UC1-S1": { saveIntentTurnMin: 3, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "yep, that works. save it." },
  "UC1-S2": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "looks right, go ahead and save." },
  "UC1-S3": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "…then save it." },
  "UC1-S4": { saveIntentTurnMin: 2, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "good, save it." },
  "UC1-S5": { saveIntentTurnMin: 4, saveIntentTurnMax: 4, shape: "draft → confirm", savePhrasing: "looks good, save it." },
  "UC1-S6": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "yep, exactly. save it." },
  "UC2-S1": { saveIntentTurnMin: 3, saveIntentTurnMax: 4, shape: "draft → confirm", savePhrasing: "looks good, save it." },
  "UC2-S2": { saveIntentTurnMin: 1, saveIntentTurnMax: 1, shape: "one-shot (escape hatch)", savePhrasing: "Validate and save when it passes (opener)" },
  "UC2-S3": { saveIntentTurnMin: 3, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "looks good, save it." },
  "UC2-S4": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "build and save" },
  "UC2-S5": { saveIntentTurnMin: 3, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "save it." },
  "UC2-S6": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "build and save" },
  "UC3-S1": { saveIntentTurnMin: 3, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "looks good, save it." },
  "UC3-S2": { saveIntentTurnMin: 1, saveIntentTurnMax: 1, shape: "one-shot (escape hatch)", savePhrasing: "validate and save (opener)" },
  "UC3-S3": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "do it that way and save" },
  "UC3-S4": { saveIntentTurnMin: 4, saveIntentTurnMax: 4, shape: "draft → confirm", savePhrasing: "that plan works, save it." },
  "UC3-S5": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "build and save" },
  "UC3-S6": { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "save it when it's good" },
  D1: { saveIntentTurnMin: 1, saveIntentTurnMax: 1, shape: "one-shot (escape hatch)", savePhrasing: "Validate and save when it passes (opener)" },
  D2: { saveIntentTurnMin: 2, saveIntentTurnMax: 2, shape: "draft → confirm", savePhrasing: "looks good, save it" },
  D3: { saveIntentTurnMin: 3, saveIntentTurnMax: 3, shape: "draft → confirm", savePhrasing: "looks good, save it" },
  "S+1": { saveIntentTurnMin: 1, saveIntentTurnMax: 99, shape: "draft → confirm", savePhrasing: "save it again" },
};

type ToolEvent = {
  toolName: "validate_rui" | "save_rui";
  userTurnIndex: number;
  valid?: boolean;
  specId?: string;
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

function firstPassingValidateTurn(validateEvents: ToolEvent[]): number | undefined {
  return validateEvents.find((event) => event.valid === true)?.userTurnIndex;
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

function formatSaveIntentExpected(runId: string): string {
  const scenarioId = parseScenarioIdFromRunId(runId);
  if (!scenarioId) {
    return "? — unknown run id; see save-intent table in chat-exploration-scenarios.md";
  }
  const entry = SAVE_INTENT[scenarioId];
  if (!entry) {
    return `? — no map entry for ${scenarioId}`;
  }
  const turnRange =
    entry.saveIntentTurnMin === entry.saveIntentTurnMax
      ? String(entry.saveIntentTurnMin)
      : `${entry.saveIntentTurnMin}–${entry.saveIntentTurnMax}`;
  return `${turnRange} (${entry.shape}; e.g. "${entry.savePhrasing}")`;
}

function formatSaveRuiAudit(
  saveEvents: ToolEvent[],
  runId: string,
): string {
  const count = saveEvents.length;
  const firstSaveTurn = saveEvents[0]?.userTurnIndex;
  const firstPart =
    firstSaveTurn !== undefined ? `first save on user turn ${firstSaveTurn}` : "no save_rui";

  const scenarioId = parseScenarioIdFromRunId(runId);
  const entry = scenarioId ? SAVE_INTENT[scenarioId] : undefined;
  if (!entry || firstSaveTurn === undefined) {
    return `${count} total; ${firstPart}`;
  }

  const premature = isSaveBeforeSaveIntent(firstSaveTurn, entry);
  const onIntent =
    firstSaveTurn >= entry.saveIntentTurnMin && firstSaveTurn <= entry.saveIntentTurnMax;
  const timing =
    premature === true
      ? " **PREMATURE (saved-unconfirmed)**"
      : onIntent
        ? " on save-intent turn ✓"
        : firstSaveTurn > entry.saveIntentTurnMax
          ? " after expected save-intent turn"
          : "";

  const singleSave =
    count === 1 ? "exactly one save ✓" : count === 0 ? "no save" : `${count} saves — expect 1`;

  return `${count} total; ${firstPart}; ${singleSave}${timing}`;
}

function formatDraftTurn(
  draftTurn: number | undefined,
  saveIntentEntry: SaveIntentEntry | undefined,
): string {
  if (!saveIntentEntry) {
    return draftTurn !== undefined ? `after user turn ${draftTurn} — confirm ask?` : "?";
  }
  if (saveIntentEntry.shape === "one-shot (escape hatch)") {
    return "n/a (escape hatch — no draft detour expected)";
  }
  if (draftTurn === undefined) {
    return "? — no passing validate yet";
  }
  return `after user turn ${draftTurn} — confirm summary + panel note + one ask?`;
}

function formatResultHint(
  state: "saved" | "draft" | "active" | "failed" | "abandoned",
  saveEvents: ToolEvent[],
  runId: string,
): string {
  const scenarioId = parseScenarioIdFromRunId(runId);
  const entry = scenarioId ? SAVE_INTENT[scenarioId] : undefined;
  const firstSaveTurn = saveEvents[0]?.userTurnIndex;

  if (
    saveEvents.length > 0 &&
    entry &&
    firstSaveTurn !== undefined &&
    isSaveBeforeSaveIntent(firstSaveTurn, entry)
  ) {
    return "saved-unconfirmed";
  }

  if (saveEvents.length === 0 && state === "draft") {
    return "no-save (draft in panel; session state=draft)";
  }
  if (saveEvents.length === 0) {
    return `no-save (session state=${state})`;
  }
  if (state === "saved") {
    return "? saved-clean | saved-off-target | saved-negotiated — check artifact";
  }
  return `? state=${state} with save_rui — verify`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const { sessionId, runId } = parseArgs();
  const scenarioId = parseScenarioIdFromRunId(runId);
  const saveIntentEntry = scenarioId ? SAVE_INTENT[scenarioId] : undefined;

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
  const draftTurn = firstPassingValidateTurn(validateEvents);
  const latestSpecId = saveSpecIds.at(-1) ?? transcript.run.specId ?? "?";
  const parentSpecId = saveSpecIds.length > 1 ? saveSpecIds[0] : null;
  const sessionState = observe?.run.state ?? "unknown";
  const promptVersion = observe?.run.promptVersion ?? "?";

  console.log("--- exploration evidence ---");
  console.log(`sessionId:       ${sessionId}`);
  console.log(`runId:             ${runId}${scenarioId ? ` → ${scenarioId}` : ""}`);
  console.log(`chat:              ${BASE_URL}/chat/${sessionId}`);
  console.log(`observe:           ${BASE_URL}/observe/agent/sessions/${sessionId}`);
  console.log(`transcript:        ${BASE_URL}/api/chat/sessions/${sessionId}/transcript`);
  console.log(`prompt_version:    ${promptVersion}`);
  console.log(`env:               ${observe?.run.env ?? "—"}`);
  console.log(`turnCount:         ${transcript.turnCount}`);
  console.log(`run.outcome:       ${transcript.run.outcome ?? "null"} (ingest terminal hint)`);
  console.log(`session state:     ${sessionState} (Observe display)`);
  console.log(`save-intent turn:  ${formatSaveIntentExpected(runId)}`);
  console.log(`draft turn:        ${formatDraftTurn(draftTurn, saveIntentEntry)}`);
  console.log(`save_rui audit:    ${formatSaveRuiAudit(saveEvents, runId)}`);
  console.log(`run.specId:        ${transcript.run.specId ?? "null"} (latest save in agent_runs)`);
  if (saveSpecIds.length > 0) {
    console.log(`save specIds:      ${saveSpecIds.join(" → ")} (from transcript tool parts)`);
  }
  if (parentSpecId) {
    console.log(`parent spec:       ${parentSpecId} (first save — use for pre-S+1 parent entry)`);
  }
  console.log(`validates:         ${validateAttempts}${observe?.validateCountMismatch ? " (agent count mismatch)" : ""}`);
  console.log(`error codes:       ${errorCodes.length > 0 ? errorCodes.join(", ") : "none"}`);
  console.log(`first validate:    user turn ${firstValidateTurn}`);
  console.log(
    `spec JSON:         curl -s -H "X-RapidUI-Session-Id: ${sessionId}" ${BASE_URL}/api/specs/${latestSpecId}`,
  );
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
  console.log("- **Platform:** post-fix (prompt v1.2 draft-first)");
  console.log(
    `- **Result:** ${formatResultHint(sessionState as "saved" | "draft" | "active" | "failed" | "abandoned", saveEvents, runId)}`,
  );
  console.log(
    `- **Session / spec:** ${sessionId} / ${specField} · **Chat:** \`/chat/${sessionId}\``,
  );
  console.log(`- **Observe state:** ${sessionState}`);
  console.log(`- **Save-intent turn:** ${formatSaveIntentExpected(runId)}`);
  console.log(
    `- **Turns / validates / errors:** ${transcript.turnCount} / ${validateAttempts} / ${errorsField}`,
  );
  console.log(`- **Draft turn:** ${formatDraftTurn(draftTurn, saveIntentEntry)}`);
  console.log(`- **save_rui audit:** ${formatSaveRuiAudit(saveEvents, runId)}`);
  console.log("- **Interview:** ?");
  console.log("- **Inventions:** ?");
  console.log("- **Artifact vs target:** ?");
  console.log("- **Feed-forward:** ?");
}

main().catch((error: unknown) => {
  console.error("fetch:exploration-evidence failed:", error);
  process.exit(1);
});
