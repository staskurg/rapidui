type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div
      className={`rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}
    >
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">{hint}</p> : null}
    </div>
  );
}
