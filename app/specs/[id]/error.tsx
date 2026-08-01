"use client";

import { SitePageHeader } from "@/components/site/SitePageHeader";
import { SITE_PAGE_NAMES } from "@/lib/site/page-titles";

type SpecInspectorErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SpecInspectorError({ reset }: SpecInspectorErrorProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <SitePageHeader pageName={SITE_PAGE_NAMES.ruiInspector} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Store unavailable</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          The RUI store is temporarily unavailable. Please try again later.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          Try again
        </button>
      </main>
    </div>
  );
}
