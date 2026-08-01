import { MetricInfoTooltip } from "@/components/observe/MetricInfoTooltip";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
  className?: string;
};

export function StatCard({ label, value, hint, tooltip, className }: StatCardProps) {
  return (
    <div
      className={`rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1">
        <p className="text-caption font-medium text-zinc-500">{label}</p>
        {tooltip ? <MetricInfoTooltip label={label} description={tooltip} /> : null}
      </div>
      <p className="mt-0.5 text-subhead font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-micro leading-tight text-zinc-500">{hint}</p> : null}
    </div>
  );
}
