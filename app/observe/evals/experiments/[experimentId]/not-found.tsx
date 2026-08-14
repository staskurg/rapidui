import Link from "next/link";

export default function EvalExperimentNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-title font-semibold tracking-tight">Experiment not found</h1>
      <p className="text-ui text-zinc-600 dark:text-zinc-400">
        No trials are stored for this experiment id in{" "}
        <code className="font-mono text-caption">eval_trials</code>.
      </p>
      <Link
        href="/observe/evals"
        className="inline-flex text-ui font-medium text-violet-700 dark:text-violet-400"
      >
        ← Back to Eval lab
      </Link>
    </div>
  );
}
