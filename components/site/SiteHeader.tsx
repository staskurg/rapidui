"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { GitHubLink } from "@/components/site/GitHubLink";
import { getSitePageName, SiteBrandTitle } from "@/components/site/SiteBrandTitle";

const navItems = [
  { href: "/chat", label: "Build a RUI" },
  { href: "/observe", label: "Observe" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const pageName = getSitePageName(pathname);

  return (
    <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3">
        <SiteBrandTitle pageName={pageName} />

        <div className="flex items-center gap-1 sm:gap-2">
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center justify-end gap-1">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <GitHubLink />
        </div>
      </div>
    </header>
  );
}
