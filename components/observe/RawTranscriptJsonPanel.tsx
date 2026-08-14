"use client";

import { useMemo } from "react";

import { CopyIconButton } from "@/components/observe/CopyIconButton";
import { JsonCodeBlock } from "@/lib/review/JsonCodeBlock";

type RawTranscriptJsonPanelProps = {
  messages: unknown[];
};

function AccordionChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function RawTranscriptJsonPanel({ messages }: RawTranscriptJsonPanelProps) {
  const jsonText = useMemo(() => JSON.stringify(messages, null, 2), [messages]);

  return (
    <details className="group rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40 [&>summary::-webkit-details-marker]:hidden [&>summary::marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-ui font-medium text-zinc-700 dark:text-zinc-300">
        <AccordionChevron className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-90" />
        <span className="min-w-0 flex-1">Raw transcript JSON</span>
        <CopyIconButton text={jsonText} ariaLabel="Copy raw transcript JSON" />
      </summary>
      <div className="mt-3 min-w-0 max-h-96 overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-md border border-zinc-200/80 bg-zinc-50/50 p-2 dark:border-zinc-700/80 dark:bg-zinc-950/40">
        <JsonCodeBlock value={messages} />
      </div>
    </details>
  );
}
