import type { AgentRunOutcome } from "@/lib/observe/queries";

const styles: Record<AgentRunOutcome, string> = {
  saved:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  failed:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  abandoned:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  abandoned_inferred:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
  in_progress:
    "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
};

const labels: Record<AgentRunOutcome, string> = {
  saved: "Saved",
  failed: "Failed",
  abandoned: "Abandoned",
  abandoned_inferred: "Abandoned (inferred)",
  in_progress: "In progress",
};

type AgentRunOutcomeBadgeProps = {
  outcome: AgentRunOutcome;
};

export function AgentRunOutcomeBadge({ outcome }: AgentRunOutcomeBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[outcome]}`}
    >
      {labels[outcome]}
    </span>
  );
}
