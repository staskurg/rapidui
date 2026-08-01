import type { Metadata } from "next";

import { SITE_PAGE_TITLES } from "@/lib/site/page-titles";

export const metadata: Metadata = {
  title: SITE_PAGE_TITLES.agent,
  description:
    "Chat with the RapidUI agent to discover, validate, and save operations-first RUIs.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
