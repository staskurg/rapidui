import { ObservePageHeaderSkeleton } from "@/components/observe/ObserveSkeletons";

export default function EvalTrialDetailLoading() {
  return (
    <div className="space-y-6">
      <ObservePageHeaderSkeleton />
      <div className="h-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
