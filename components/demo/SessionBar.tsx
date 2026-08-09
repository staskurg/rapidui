"use client";

import { useCallback, useEffect, useState } from "react";
import { ObserveNavIcon } from "@/components/observe/ObserveNavIcons";
import { NewTabLink } from "@/components/demo/NewTabLink";

type SessionBarProps = {
  sessionId: string | null;
  observeEnabled?: boolean;
};

const observeIconClass =
  "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors";

const sessionIdClass =
  "relative min-w-0 break-all rounded border px-2 py-0.5 font-mono text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500";

export function SessionBar({ sessionId, observeEnabled = false }: SessionBarProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopySessionId = useCallback(async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
    } catch {
      // Clipboard access can fail in unsupported or locked-down contexts.
    }
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-ui">
        <span className="shrink-0 text-zinc-500">Session</span>
        <span className="text-zinc-700 dark:text-zinc-300">New conversation</span>
      </div>
    );
  }

  const observeHref = `/observe/agent/sessions/${encodeURIComponent(sessionId)}`;
  const enabledLabel = "Open session telemetry in Observe (new tab)";
  const disabledLabel = "Send a message to open session telemetry in Observe";
  const copyLabel = copied ? "Session ID copied" : "Copy session ID";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-ui">
      <span className="shrink-0 text-zinc-500">Session</span>
      <button
        type="button"
        onClick={handleCopySessionId}
        className={`${sessionIdClass} cursor-pointer border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 ${
          copied
            ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200"
            : ""
        }`}
        title={copyLabel}
        aria-label={copyLabel}
      >
        <span className={copied ? "text-transparent" : undefined}>{sessionId}</span>
        {copied ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-emerald-800 dark:text-emerald-200">
            Copied!
          </span>
        ) : null}
      </button>
      {observeEnabled ? (
        <NewTabLink
          href={observeHref}
          title={enabledLabel}
          aria-label={enabledLabel}
          className={`${observeIconClass} text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`}
        >
          <ObserveNavIcon name="telemetry" className="h-4 w-4" />
        </NewTabLink>
      ) : (
        <button
          type="button"
          disabled
          title={disabledLabel}
          aria-label={disabledLabel}
          className={`${observeIconClass} cursor-not-allowed text-zinc-400 dark:text-zinc-600`}
        >
          <ObserveNavIcon name="telemetry" className="h-4 w-4 opacity-60" />
        </button>
      )}
    </div>
  );
}
