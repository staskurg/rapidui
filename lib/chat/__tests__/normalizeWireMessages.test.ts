import { describe, expect, it } from "vitest";

import { normalizeWireMessages } from "@/lib/chat/normalizeWireMessages";
import type { UIMessageWire } from "@/lib/chat/transcriptSchema";

describe("normalizeWireMessages", () => {
  it("maps rawInput to input on failed tool parts", () => {
    const messages: UIMessageWire[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-validate_rui",
            toolCallId: "tc-fail",
            state: "output-error",
            rawInput: { rui: { version: "0.2" } },
            errorText: "invalid JSON",
            callProviderMetadata: { openai: {} },
          },
        ],
      },
    ];

    const normalized = normalizeWireMessages(messages)[0]?.parts[0] as Record<
      string,
      unknown
    >;

    expect(normalized.input).toEqual({ rui: { version: "0.2" } });
    expect(normalized.rawInput).toBeUndefined();
    expect(normalized.callProviderMetadata).toBeUndefined();
    expect(normalized.errorText).toBe("invalid JSON");
  });

  it("leaves successful tool parts unchanged except metadata stripping", () => {
    const messages: UIMessageWire[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-validate_rui",
            toolCallId: "tc-ok",
            input: { rui: { version: "0.2" } },
            state: "output-available",
            output: { valid: true },
            callProviderMetadata: { openai: {} },
          },
        ],
      },
    ];

    const normalized = normalizeWireMessages(messages)[0]?.parts[0] as Record<
      string,
      unknown
    >;

    expect(normalized.input).toEqual({ rui: { version: "0.2" } });
    expect(normalized.output).toEqual({ valid: true });
    expect(normalized.callProviderMetadata).toBeUndefined();
  });
});
