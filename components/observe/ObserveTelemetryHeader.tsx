import { ObserveDateRangeSelector } from "@/components/observe/ObserveDateRangeSelector";
import { ObserveRefreshButton } from "@/components/observe/ObserveRefreshButton";
import type { ObserveWindowDays } from "@/lib/observe/queries";

type ObserveTelemetryHeaderProps = {
  title: string;
  description: string;
  windowDays: ObserveWindowDays;
  dateRangeLabel: string;
  presetHrefs: Record<ObserveWindowDays, string>;
};

export function ObserveTelemetryHeader({
  title,
  description,
  windowDays,
  dateRangeLabel,
  presetHrefs,
}: ObserveTelemetryHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-title font-semibold tracking-tight">{title}</h1>
        <p className="text-ui text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-5">
        <ObserveDateRangeSelector
          windowDays={windowDays}
          dateRangeLabel={dateRangeLabel}
          presetHrefs={presetHrefs}
        />
        <ObserveRefreshButton />
      </div>
    </header>
  );
}
