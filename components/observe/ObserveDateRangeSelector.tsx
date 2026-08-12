"use client";

import { useRouter } from "next/navigation";

import { MetricInfoTooltip } from "@/components/observe/MetricInfoTooltip";
import { useObserveNavigation } from "@/lib/observe/observePendingContext";
import {
  OBSERVE_WINDOW_PRESETS,
  type ObserveWindowDays,
} from "@/lib/observe/queries";

type ObserveDateRangeSelectorProps = {
  windowDays: ObserveWindowDays;
  dateRangeLabel: string;
  /** Pre-built navigation targets for each preset (computed on the server). */
  presetHrefs: Record<ObserveWindowDays, string>;
  className?: string;
};

const DATE_RANGE_TOOLTIP =
  "Time range is start of day UTC on start date to end of day UTC on end date.";

const presetClassName =
  "cursor-pointer rounded-full px-2 py-0.5 text-caption font-medium transition-colors disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

const presetActiveClassName = "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";

const presetInactiveClassName =
  "text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300";

export function ObserveDateRangeSelector({
  windowDays,
  dateRangeLabel,
  presetHrefs,
  className,
}: ObserveDateRangeSelectorProps) {
  const router = useRouter();
  const { isPending, startObserveTransition } = useObserveNavigation();

  function handleSelect(days: ObserveWindowDays) {
    if (days === windowDays || isPending) {
      return;
    }

    startObserveTransition(() => {
      router.push(presetHrefs[days]);
    });
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 select-none ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center rounded-md border border-zinc-300 px-2.5 py-1.5 text-ui font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
          {dateRangeLabel}
        </span>
        <MetricInfoTooltip
          label="Date range"
          description={DATE_RANGE_TOOLTIP}
          icon="i"
        />
      </div>

      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Period length">
        {OBSERVE_WINDOW_PRESETS.map((days) => {
          const isActive = windowDays === days;

          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={isPending}
              onClick={() => handleSelect(days)}
              className={`${presetClassName} ${isActive ? presetActiveClassName : presetInactiveClassName}`}
            >
              {days}d
            </button>
          );
        })}
      </div>
    </div>
  );
}
