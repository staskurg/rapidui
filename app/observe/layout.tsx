import type { Metadata } from "next";

import { ObserveSidebar } from "@/components/observe/ObserveSidebar";
import { SiteShell } from "@/components/site/SiteShell";
import { ObservePendingProvider } from "@/lib/observe/observePendingContext";
import { SITE_PAGE_TITLES } from "@/lib/site/page-titles";

export const metadata: Metadata = {
  title: SITE_PAGE_TITLES.observe,
};

export default function ObserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell className="h-dvh overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <ObserveSidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto w-full max-w-6xl">
            <ObservePendingProvider>{children}</ObservePendingProvider>
          </div>
        </main>
      </div>
    </SiteShell>
  );
}
