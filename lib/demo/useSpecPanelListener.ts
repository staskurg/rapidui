"use client";

import { useEffect, useRef } from "react";
import { useAuiState } from "@assistant-ui/store";

import type { SavedSpec } from "@/lib/db/types";
import type { Rui } from "@/lib/operations";

import { buildDraftSavedSpec } from "./build-draft-spec";
import { fetchSpecById } from "./fetch-spec";

export type SpecPanelState =
  | { kind: "empty" }
  | { kind: "draft"; spec: SavedSpec }
  | { kind: "saved"; spec: SavedSpec }
  | { kind: "loading" };

type UseSpecPanelListenerOptions = {
  sessionId: string;
  resetKey: number;
  onStateChange: (state: SpecPanelState) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseValidateResult(result: unknown): { valid: boolean; normalizedRui?: Rui } | null {
  if (!isRecord(result) || result.valid !== true) {
    return null;
  }
  if (!isRecord(result.normalizedRui)) {
    return { valid: true };
  }
  return {
    valid: true,
    normalizedRui: result.normalizedRui as Rui,
  };
}

function parseSaveResult(result: unknown): { specId: string } | null {
  if (!isRecord(result) || typeof result.specId !== "string") {
    return null;
  }
  return { specId: result.specId };
}

/** Watch validate_rui / save_rui tool results and drive the output panel state machine. */
export function useSpecPanelListener({
  sessionId,
  resetKey,
  onStateChange,
}: UseSpecPanelListenerOptions): void {
  const messages = useAuiState((state) => state.thread.messages);
  const processedToolCalls = useRef<Set<string>>(new Set());
  const listenerGeneration = useRef(0);

  useEffect(() => {
    processedToolCalls.current.clear();
    listenerGeneration.current += 1;
    onStateChange({ kind: "empty" });
  }, [resetKey, onStateChange]);

  useEffect(() => {
    const generation = listenerGeneration.current;

    for (const message of messages) {
      if (message.role !== "assistant") {
        continue;
      }

      for (const part of message.content) {
        if (part.type !== "tool-call" || part.result === undefined) {
          continue;
        }

        if (processedToolCalls.current.has(part.toolCallId)) {
          continue;
        }
        processedToolCalls.current.add(part.toolCallId);

        if (part.toolName === "validate_rui") {
          const parsed = parseValidateResult(part.result);
          if (parsed?.valid && parsed.normalizedRui) {
            if (generation !== listenerGeneration.current) {
              continue;
            }
            onStateChange({
              kind: "draft",
              spec: buildDraftSavedSpec(parsed.normalizedRui),
            });
          }
          continue;
        }

        if (part.toolName === "save_rui") {
          const parsed = parseSaveResult(part.result);
          if (!parsed) {
            continue;
          }

          if (generation !== listenerGeneration.current) {
            continue;
          }

          onStateChange({ kind: "loading" });
          void fetchSpecById(parsed.specId, sessionId)
            .then((spec) => {
              if (generation !== listenerGeneration.current) {
                return;
              }
              onStateChange({ kind: "saved", spec });
            })
            .catch(() => {
              if (generation !== listenerGeneration.current) {
                return;
              }
              onStateChange({ kind: "empty" });
            });
        }
      }
    }
  }, [messages, onStateChange, sessionId]);
}
