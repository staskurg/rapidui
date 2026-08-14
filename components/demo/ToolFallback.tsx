"use client";

import type { ToolCallMessagePartProps } from "@assistant-ui/core/react";

import { ToolStep } from "@/components/chat/ToolStep";
import { getToolLabel } from "@/lib/chat/toolLabels";

function isComplete(status: ToolCallMessagePartProps["status"]): boolean {
  return status?.type === "complete";
}

function RapidUiToolFallback({
  toolName,
  status,
  result,
  isError,
}: ToolCallMessagePartProps) {
  const label = getToolLabel(toolName);
  const running = status?.type === "running" || status?.type === "requires-action";
  const complete = isComplete(status);
  const displayLabel = running ? `${label}…` : label;
  const highlight = toolName === "save_rui" && complete && !isError;
  const defaultOpen = highlight;

  let resultPreview: string | null = null;
  if (complete && result !== undefined) {
    resultPreview =
      typeof result === "string" ? result : JSON.stringify(result, null, 2).slice(0, 400);
  }

  return (
    <ToolStep label={displayLabel} highlight={highlight} defaultOpen={defaultOpen}>
      {resultPreview}
    </ToolStep>
  );
}

export const demoToolComponents = {
  fetch_docs: RapidUiToolFallback,
  fetch_schema: RapidUiToolFallback,
  validate_rui: RapidUiToolFallback,
  save_rui: RapidUiToolFallback,
  Fallback: RapidUiToolFallback,
};
