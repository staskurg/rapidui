"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/observe", label: "Overview", exact: true },
  { href: "/observe/api", label: "API", exact: false },
  { href: "/observe/agent", label: "Agent", exact: false },
  { href: "/observe/evals", label: "Evals", exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ObserveNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/observe"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Observe
          </Link>
          <p className="text-sm text-zinc-500">Platform analytics</p>
        </div>
        <ul className="flex flex-wrap gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
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
      </div>
    </nav>
  );
}
