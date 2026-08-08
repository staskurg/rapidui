import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatShell } from "@/components/demo/ChatShell";
import { SiteShell } from "@/components/site/SiteShell";
import { SITE_PAGE_TITLES } from "@/lib/site/page-titles";

export const metadata: Metadata = {
  title: SITE_PAGE_TITLES.agent,
  description:
    "Chat with the RapidUI agent to discover, validate, and save operations-first RUIs.",
};

function ChatLayoutFallback() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 text-ui text-zinc-500 dark:bg-zinc-950">
      Loading…
    </div>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell className="h-dvh overflow-hidden">
      <Suspense fallback={<ChatLayoutFallback />}>
        <ChatShell />
      </Suspense>
      {children}
    </SiteShell>
  );
}
