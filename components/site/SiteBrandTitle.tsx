import Link from "next/link";

import { SITE_PAGE_NAMES } from "@/lib/site/page-titles";

type SiteBrandTitleProps = {
  pageName?: string | null;
};

export function getSitePageName(pathname: string): string | null {
  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return SITE_PAGE_NAMES.agent;
  }
  if (pathname === "/observe" || pathname.startsWith("/observe/")) {
    return SITE_PAGE_NAMES.observe;
  }
  return null;
}

export function SiteBrandTitle({ pageName }: SiteBrandTitleProps) {
  return (
    <h1 className="text-subhead font-semibold tracking-tight">
      <Link
        href="/"
        className="text-zinc-900 transition-colors hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
      >
        RapidUI
      </Link>
      {pageName ? (
        <span className="font-semibold text-zinc-700 dark:text-zinc-200"> - {pageName}</span>
      ) : null}
    </h1>
  );
}
