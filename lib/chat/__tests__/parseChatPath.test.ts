import { describe, expect, it } from "vitest";

import { parseChatPathSessionId } from "@/lib/chat/parseChatPath";

describe("parseChatPathSessionId", () => {
  it("returns null for plain /chat", () => {
    expect(parseChatPathSessionId("/chat")).toBeNull();
    expect(parseChatPathSessionId("/chat/")).toBeNull();
  });

  it("extracts session id from /chat/{id}", () => {
    expect(parseChatPathSessionId("/chat/abc-123")).toBe("abc-123");
    expect(parseChatPathSessionId("/chat/abc-123/")).toBe("abc-123");
  });

  it("decodes encoded session ids", () => {
    expect(parseChatPathSessionId("/chat/observe-api-smoke%2Fuuid")).toBe(
      "observe-api-smoke/uuid",
    );
  });
});
