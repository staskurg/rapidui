import { describe, expect, it } from "vitest";

import {
  countUserTurns,
  isTranscriptPayloadTooLarge,
  parseChatSessionId,
  transcriptMessagesSchema,
  transcriptPutBodySchema,
  TRANSCRIPT_MAX_BYTES,
  type UIMessageWire,
} from "@/lib/chat/transcriptSchema";

/** Minimal eval_driver.py wire-format fixture (UC1 turn 1). */
const evalDriverFixture: UIMessageWire[] = [
  {
    id: "m-user-001",
    role: "user",
    parts: [{ type: "text", text: "Build a static browse page for a product catalog." }],
  },
  {
    id: "m-asst-001",
    role: "assistant",
    parts: [
      { type: "text", text: "I'll help you build that.", state: "done" },
      {
        type: "tool-validate_rui",
        toolCallId: "tc-001",
        input: { rui: { version: "0.2" } },
        state: "output-available",
        output: { valid: true },
      },
    ],
  },
];

describe("transcriptPutBodySchema", () => {
  it("accepts eval_driver wire-format messages", () => {
    const parsed = transcriptPutBodySchema.parse({
      messages: evalDriverFixture,
    });
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[1]?.parts[1]?.type).toBe("tool-validate_rui");
  });

  it("rejects empty messages array", () => {
    const result = transcriptPutBodySchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it("rejects messages without required fields", () => {
    const result = transcriptPutBodySchema.safeParse({
      messages: [{ role: "user", parts: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid roles", () => {
    const result = transcriptMessagesSchema.safeParse([
      {
        id: "m-1",
        role: "tool",
        parts: [{ type: "text", text: "nope" }],
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("accepts reasoning parts", () => {
    const result = transcriptMessagesSchema.safeParse([
      {
        id: "m-1",
        role: "assistant",
        parts: [{ type: "reasoning", text: "thinking...", state: "done" }],
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts live AI SDK parts (step-start, dynamic-tool, metadata)", () => {
    const result = transcriptPutBodySchema.safeParse({
      messages: [
        {
          id: "eAKPOGQ5xKGxo03h",
          role: "user",
          metadata: { custom: {} },
          parts: [{ type: "text", text: "Build a browse page." }],
        },
        {
          id: "dfYQPTBhHQN6XJyL",
          role: "assistant",
          metadata: { pydantic_ai: { timestamp: "2026-08-07T23:22:14.414146Z" } },
          parts: [
            { type: "step-start" },
            { type: "reasoning", text: "", state: "done" },
            { type: "text", text: "I'll help.", state: "done" },
            {
              type: "dynamic-tool",
              toolName: "validate_rui",
              toolCallId: "tc-live",
              state: "output-available",
              input: {},
              output: { valid: true },
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("countUserTurns", () => {
  it("counts only user-role messages", () => {
    expect(countUserTurns([...evalDriverFixture])).toBe(1);
    expect(
      countUserTurns([
        ...evalDriverFixture,
        {
          id: "m-user-002",
          role: "user",
          parts: [{ type: "text", text: "Looks good, save it." }],
        },
      ]),
    ).toBe(2);
  });
});

describe("parseChatSessionId", () => {
  it("accepts non-empty strings including prefixed smoke ids", () => {
    expect(parseChatSessionId("abc-123")).toBe("abc-123");
    expect(parseChatSessionId("observe-api-smoke-uuid")).toBe(
      "observe-api-smoke-uuid",
    );
  });

  it("rejects empty or whitespace-only ids", () => {
    expect(parseChatSessionId("")).toBeNull();
    expect(parseChatSessionId("   ")).toBeNull();
    expect(parseChatSessionId(undefined)).toBeNull();
  });
});

describe("isTranscriptPayloadTooLarge", () => {
  it("returns false for typical exploration payloads", () => {
    expect(isTranscriptPayloadTooLarge([...evalDriverFixture])).toBe(false);
  });

  it("returns true when serialized body exceeds cap", () => {
    const hugeText = "x".repeat(TRANSCRIPT_MAX_BYTES);
    expect(
      isTranscriptPayloadTooLarge([
        {
          id: "m-big",
          role: "user",
          parts: [{ type: "text", text: hugeText }],
        },
      ]),
    ).toBe(true);
  });
});
