import type { ReactNode } from "react";

import { GitHubLink } from "@/components/site/GitHubLink";
import { SiteBrandTitle } from "@/components/site/SiteBrandTitle";

type SitePageHeaderProps = {
  pageName?: string | null;
  children?: ReactNode;
};

export function SitePageHeader({ pageName, children }: SitePageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3">
        <SiteBrandTitle pageName={pageName} />
        {children ?? <GitHubLink />}
      </div>
    </header>
  );
}
