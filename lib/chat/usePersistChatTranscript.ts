"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef } from "react";

import { normalizeWireMessages } from "./normalizeWireMessages";
import {
  putChatTranscript,
  shouldPersistTranscript,
  type TranscriptFinishFlags,
} from "./persistTranscript";
import type { UIMessageWire } from "./transcriptSchema";

type ChatOnFinishArg = {
  messages: UIMessage[];
  isAbort: boolean;
  isDisconnect: boolean;
  isError: boolean;
};

function toWireMessages(messages: UIMessage[]): UIMessageWire[] {
  return normalizeWireMessages(messages as UIMessageWire[]);
}

/**
 * Persist hook for live /chat — wires AI SDK onFinish to PUT transcript API.
 * Keeps a ref of the latest messages for a final flush before New chat (W5).
 */
export function usePersistChatTranscript(sessionId: string) {
  const latestMessagesRef = useRef<UIMessageWire[]>([]);

  useEffect(() => {
    latestMessagesRef.current = [];
  }, [sessionId]);

  const persistMessages = useCallback(
    (messages: UIMessageWire[], flags?: TranscriptFinishFlags) => {
      if (messages.length === 0) {
        return;
      }
      latestMessagesRef.current = messages;
      if (
        flags &&
        !shouldPersistTranscript(flags, messages.length)
      ) {
        return;
      }
      putChatTranscript(sessionId, messages);
    },
    [sessionId],
  );

  const onFinish = useCallback(
    ({ messages, isAbort, isDisconnect, isError }: ChatOnFinishArg) => {
      const wireMessages = toWireMessages(messages);
      persistMessages(wireMessages, { isAbort, isDisconnect, isError });
    },
    [persistMessages],
  );

  /** Final snapshot before session abandon — uses last known wire messages. */
  const flushTranscript = useCallback(() => {
    const messages = latestMessagesRef.current;
    if (messages.length === 0) {
      return;
    }
    putChatTranscript(sessionId, messages);
  }, [sessionId]);

  return { onFinish, flushTranscript };
}
