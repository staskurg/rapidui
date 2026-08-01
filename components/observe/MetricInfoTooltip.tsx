"use client";

type MetricInfoTooltipProps = {
  label: string;
  description: string;
};

export function MetricInfoTooltip({ label, description }: MetricInfoTooltipProps) {
  return (
    <span className="group/info relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={`About ${label}`}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-400 text-[0.625rem] font-bold leading-none text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-500 dark:text-zinc-400 dark:hover:border-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-500"
      >
        !
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-56 -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-micro leading-snug text-zinc-700 shadow-md group-hover/info:block group-focus-within/info:block dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
      >
        {description}
      </span>
    </span>
  );
}
