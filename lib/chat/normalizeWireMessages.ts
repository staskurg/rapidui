import type { UIMessageWire } from "./transcriptSchema";

type WirePart = UIMessageWire["parts"][number];

/** Strip assistant-ui-only fields and map error-tool `rawInput` → `input` for POST /chat. */
function normalizeToolPart(part: WirePart): WirePart {
  const type = part.type;
  if (typeof type !== "string" || !type.startsWith("tool-")) {
    return part;
  }

  const normalized: Record<string, unknown> = { ...part };

  if (normalized.rawInput !== undefined && normalized.input === undefined) {
    normalized.input = normalized.rawInput;
    delete normalized.rawInput;
  }

  delete normalized.callProviderMetadata;
  delete normalized.resultProviderMetadata;

  return normalized as WirePart;
}

/**
 * Normalize Vercel AI wire messages before agent POST /chat or transcript restore.
 * Failed tool calls from assistant-ui use `rawInput`; pydantic_ai expects `input`.
 */
export function normalizeWireMessages(messages: UIMessageWire[]): UIMessageWire[] {
  return messages.map((message) => {
    if (message.role !== "assistant") {
      return message;
    }
    return {
      ...message,
      parts: message.parts.map(normalizeToolPart),
    };
  });
}
