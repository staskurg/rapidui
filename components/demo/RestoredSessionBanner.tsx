"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { formatRelativeTime } from "@/lib/chat/formatRelativeTime";
import { ObserveNavIcon } from "@/components/observe/ObserveNavIcons";

type RestoredSessionBannerProps = {
  sessionId: string;
  updatedAt: string;
};

function isDismissed(sessionId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(`rapidui-restored-banner-dismissed-${sessionId}`) === "true";
}

export function RestoredSessionBanner({
  sessionId,
  updatedAt,
}: RestoredSessionBannerProps) {
  const [dismissed, setDismissed] = useState(() => isDismissed(sessionId));

  const dismiss = useCallback(() => {
    localStorage.setItem(`rapidui-restored-banner-dismissed-${sessionId}`, "true");
    setDismissed(true);
  }, [sessionId]);

  if (dismissed) {
    return null;
  }

  const observeHref = `/observe/agent/sessions/${encodeURIComponent(sessionId)}`;

  return (
    <div
      role="status"
      className="shrink-0 border-b border-violet-200 bg-violet-50 px-4 py-2 text-ui text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-100"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed">
          Restored session · last updated {formatRelativeTime(updatedAt)} ·{" "}
          <Link
            href={observeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-violet-800 underline underline-offset-2 hover:text-violet-950 dark:text-violet-200 dark:hover:text-violet-50"
          >
            Open in Observe
            <ObserveNavIcon name="telemetry" className="h-3.5 w-3.5" />
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-caption font-medium text-violet-800 underline underline-offset-2 hover:text-violet-950 dark:text-violet-200 dark:hover:text-violet-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
