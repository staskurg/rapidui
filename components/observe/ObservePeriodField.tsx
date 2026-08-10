export const OBSERVE_PERIOD_PRESETS = [1, 7, 30] as const;
export type ObservePeriodDays = (typeof OBSERVE_PERIOD_PRESETS)[number];

type ObservePeriodPillsProps = {
  activeDays: ObservePeriodDays;
};

const pillClassName =
  "flex h-7 min-w-[2.25rem] cursor-pointer items-center justify-center rounded-md px-2 text-caption font-medium text-zinc-600 transition-colors hover:text-zinc-900 has-[:checked]:bg-white has-[:checked]:text-zinc-900 has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500 dark:text-zinc-400 dark:hover:text-zinc-200 dark:has-[:checked]:bg-zinc-950 dark:has-[:checked]:text-zinc-100";

export function ObservePeriodPills({ activeDays }: ObservePeriodPillsProps) {
  return (
    <div
      className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800"
      role="radiogroup"
      aria-label="Period length"
    >
      {OBSERVE_PERIOD_PRESETS.map((days) => (
        <label key={days} className={pillClassName}>
          <input
            type="radio"
            name="days"
            value={String(days)}
            defaultChecked={activeDays === days}
            className="sr-only"
          />
          {days}d
        </label>
      ))}
    </div>
  );
}
