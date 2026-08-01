"use client";

import type { ToolCallMessagePartProps } from "@assistant-ui/core/react";

const TOOL_LABELS: Record<string, string> = {
  fetch_docs: "Fetching docs",
  fetch_schema: "Fetching schema",
  validate_rui: "Validating RUI",
  save_rui: "Saving spec",
};

function isComplete(status: ToolCallMessagePartProps["status"]): boolean {
  return status?.type === "complete";
}

function ToolStep({
  label,
  highlight = false,
  defaultOpen = false,
  children,
}: {
  label: string;
  highlight?: boolean;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className={[
        "rounded border px-3 py-2 text-caption",
        highlight
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
      ].join(" ")}
    >
      <summary className="cursor-pointer font-medium">{label}</summary>
      {children ? <div className="mt-2 font-mono text-micro opacity-80">{children}</div> : null}
    </details>
  );
}

function RapidUiToolFallback({
  toolName,
  status,
  result,
  isError,
}: ToolCallMessagePartProps) {
  const label = TOOL_LABELS[toolName] ?? toolName;
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
