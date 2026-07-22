"use client";

import { NewTabLink } from "@/components/demo/NewTabLink";

type SessionBarProps = {
  sessionId: string;
};

function truncateSessionId(sessionId: string): string {
  return `${sessionId.slice(0, 8)}…`;
}

export function SessionBar({ sessionId }: SessionBarProps) {
  async function copySessionId() {
    try {
      await navigator.clipboard.writeText(sessionId);
    } catch {
      // Clipboard may be unavailable in some contexts.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-zinc-500">Session</span>
      <code
        className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
        title={sessionId}
      >
        {truncateSessionId(sessionId)}
      </code>
      <button
        type="button"
        onClick={() => void copySessionId()}
        title="Copy session ID to find this run in Observe."
        className="rounded border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Copy
      </button>
      <NewTabLink
        href={`/observe/api/sessions/${sessionId}`}
        title="Session timeline appears after the agent's first API call. Opens in a new tab."
        className="text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        API ↗
      </NewTabLink>
    </div>
  );
}
