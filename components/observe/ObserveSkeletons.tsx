import { statCardGridClass } from "@/components/observe/StatCardGrid";

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`}
      aria-hidden="true"
    />
  );
}

function LoadingStatus({ label }: { label: string }) {
  return (
    <p className="sr-only" role="status">
      {label}
    </p>
  );
}

export function ObservePageHeaderSkeleton() {
  return (
    <header className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </header>
  );
}

export function StatCardsSkeleton({
  count = 4,
  className = statCardGridClass,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-14" />
        </div>
      ))}
    </div>
  );
}

export function FilterFormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: fields }, (_, index) => (
        <div
          key={index}
          className={`space-y-2 ${index === fields - 1 ? "min-w-[12rem] flex-[1.5]" : "min-w-[9rem] flex-1"}`}
        >
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex shrink-0 items-end gap-2">
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 6,
  title = true,
}: {
  rows?: number;
  columns?: number;
  title?: boolean;
}) {
  return (
    <section className="space-y-4">
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="flex gap-6">
            {Array.from({ length: columns }, (_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex gap-6 px-4 py-3">
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={`h-4 ${colIndex === 0 ? "w-28" : "w-16"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HubOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading observability overview" />
      <ObservePageHeaderSkeleton />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <section
            key={index}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, metricIndex) => (
                <div key={metricIndex} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ApiDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading API telemetry" />
      <ObservePageHeaderSkeleton />
      <FilterFormSkeleton fields={3} />
      <StatCardsSkeleton count={9} />
      <TableSkeleton rows={6} columns={7} />
    </div>
  );
}

export function AgentDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading agent telemetry" />
      <ObservePageHeaderSkeleton />
      <FilterFormSkeleton fields={5} />
      <StatCardsSkeleton count={8} />
      <TableSkeleton rows={6} columns={8} />
    </div>
  );
}

export function EvalsPageSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingStatus label="Loading eval lab" />
      <ObservePageHeaderSkeleton />
      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </section>
      <TableSkeleton rows={4} columns={3} />
    </div>
  );
}

export function SessionDetailSkeleton({ showTurnsTable = false }: { showTurnsTable?: boolean }) {
  return (
    <div className="space-y-8">
      <LoadingStatus label="Loading session detail" />
      <header className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-full max-w-xl" />
        </div>
      </header>
      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </section>
      {showTurnsTable ? (
        <section className="space-y-4">
          <Skeleton className="h-6 w-16" />
          <TableSkeleton rows={4} columns={6} title={false} />
        </section>
      ) : null}
      <section className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-r-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function AgentSessionDetailSkeleton() {
  return <SessionDetailSkeleton showTurnsTable />;
}
