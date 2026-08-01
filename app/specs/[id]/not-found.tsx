import Link from "next/link";
import type { Metadata } from "next";

import { SitePageHeader } from "@/components/site/SitePageHeader";
import { SITE_PAGE_NAMES, SITE_PAGE_TITLES } from "@/lib/site/page-titles";

export const metadata: Metadata = {
  title: SITE_PAGE_TITLES.ruiInspector,
};

export default function SpecInspectorNotFound() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <SitePageHeader pageName={SITE_PAGE_NAMES.ruiInspector} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Spec not found</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          No saved RUI exists for this ID, or the ID is invalid.
        </p>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-2"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
