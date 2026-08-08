import { describe, expect, it } from "vitest";

import { shouldPersistTranscript } from "@/lib/chat/persistTranscript";

describe("shouldPersistTranscript", () => {
  it("persists on normal completion", () => {
    expect(
      shouldPersistTranscript(
        { isAbort: false, isDisconnect: false, isError: false },
        2,
      ),
    ).toBe(true);
  });

  it("persists on abort or disconnect even when isError is set", () => {
    expect(
      shouldPersistTranscript(
        { isAbort: true, isDisconnect: false, isError: true },
        2,
      ),
    ).toBe(true);
    expect(
      shouldPersistTranscript(
        { isAbort: false, isDisconnect: true, isError: false },
        2,
      ),
    ).toBe(true);
  });

  it("skips pure error finishes", () => {
    expect(
      shouldPersistTranscript(
        { isAbort: false, isDisconnect: false, isError: true },
        2,
      ),
    ).toBe(false);
  });

  it("skips when there are no messages", () => {
    expect(
      shouldPersistTranscript(
        { isAbort: false, isDisconnect: false, isError: false },
        0,
      ),
    ).toBe(false);
  });
});
