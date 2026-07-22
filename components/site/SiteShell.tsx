import { SiteHeader } from "@/components/site/SiteHeader";

type SiteShellProps = {
  children: React.ReactNode;
  /** Outer shell classes — use `h-dvh overflow-hidden` for full-viewport app surfaces. */
  className?: string;
};

export function SiteShell({ children, className = "" }: SiteShellProps) {
  return (
    <div
      className={`flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 ${className}`}
    >
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
