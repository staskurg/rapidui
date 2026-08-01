import type { SessionOutcome } from "@/lib/observe/queries";

const styles: Record<SessionOutcome, string> = {
  saved:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  failed:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  in_progress:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
};

const labels: Record<SessionOutcome, string> = {
  saved: "Saved",
  failed: "Failed",
  in_progress: "In progress",
};

type SessionOutcomeBadgeProps = {
  outcome: SessionOutcome;
};

export function SessionOutcomeBadge({ outcome }: SessionOutcomeBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${styles[outcome]}`}
    >
      {labels[outcome]}
    </span>
  );
}
