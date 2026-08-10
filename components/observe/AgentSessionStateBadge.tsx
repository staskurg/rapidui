import type { AgentSessionState } from "@/lib/observe/queries";

const styles: Record<AgentSessionState, string> = {
  saved:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  draft:
    "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
  active:
    "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900",
  failed:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  abandoned:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};

const labels: Record<AgentSessionState, string> = {
  saved: "Saved",
  draft: "Draft",
  active: "Active",
  failed: "Failed",
  abandoned: "Abandoned",
};

type AgentSessionStateBadgeProps = {
  state: AgentSessionState;
};

export function AgentSessionStateBadge({ state }: AgentSessionStateBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}
