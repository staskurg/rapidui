"use client";

import { useCallback, useState } from "react";

const CONSENT_STORAGE_KEY = "rapidui-chat-consent-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(CONSENT_STORAGE_KEY) === "true";
}

export function ChatConsentBanner() {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = useCallback(() => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "true");
    setDismissed(true);
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <div
      role="note"
      className="shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-ui text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="leading-relaxed">
          Conversations are stored by session ID for product improvement and internal
          review. Do not paste secrets or production credentials. By continuing, you agree.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-caption font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
