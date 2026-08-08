"use client";

import Link from "next/link";

type ChatSessionNotFoundBannerProps = {
  onDismissHref?: string;
};

export function ChatSessionNotFoundBanner({
  onDismissHref = "/chat",
}: ChatSessionNotFoundBannerProps) {
  return (
    <div
      role="alert"
      className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-ui text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed">
          This conversation could not be found. It may have been removed or the link is
          invalid.
        </p>
        <Link
          href={onDismissHref}
          className="shrink-0 text-caption font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-50"
        >
          Dismiss
        </Link>
      </div>
    </div>
  );
}
