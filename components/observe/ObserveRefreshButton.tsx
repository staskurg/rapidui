"use client";

import { useRouter } from "next/navigation";

import { useObserveNavigation } from "@/lib/observe/observePendingContext";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function ObserveRefreshButton() {
  const router = useRouter();
  const { isPending, startObserveTransition } = useObserveNavigation();

  return (
    <button
      type="button"
      onClick={() => startObserveTransition(() => router.refresh())}
      disabled={isPending}
      aria-label="Refresh telemetry data"
      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white p-2 text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <RefreshIcon className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
    </button>
  );
}
