"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ObserveNavIcon } from "@/components/observe/ObserveNavIcons";

const STORAGE_KEY = "rapidui-observe-sidebar-collapsed";

const navItems = [
  { href: "/observe", label: "Overview", icon: "overview" as const, exact: true },
  { href: "/observe/api", label: "API", icon: "api" as const, exact: false },
  { href: "/observe/agent", label: "Agent", icon: "agent" as const, exact: false },
  { href: "/observe/evals", label: "Evals", icon: "evals" as const, exact: false },
];

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ObserveSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`flex min-h-0 shrink-0 flex-col self-stretch border-r border-zinc-200 bg-white transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
        collapsed ? "w-14" : "w-48"
      }`}
    >
      {!collapsed ? (
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Observe
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">Platform analytics</p>
        </div>
      ) : null}

      <nav aria-label="Observe" className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : "gap-2.5"
                  } ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <ObserveNavIcon name={item.icon} />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-md px-2 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>
    </aside>
  );
}
