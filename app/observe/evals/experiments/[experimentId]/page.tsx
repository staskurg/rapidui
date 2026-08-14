import Link from "next/link";
import { notFound } from "next/navigation";

import { EvalExperimentCasesTable } from "@/components/observe/EvalExperimentCasesTable";
import { ExperimentOutcomeBadge } from "@/components/observe/ExperimentOutcomeBadge";
import { ExperimentOverviewCard } from "@/components/observe/ExperimentOverviewCard";
import { listEvalTrialsByExperiment } from "@/lib/db/evalTrials";
import { getEvalExperimentSummary } from "@/lib/eval/queryEvalExperiments";

export const dynamic = "force-dynamic";

type EvalExperimentPageProps = {
  params: Promise<{ experimentId: string }>;
  searchParams: Promise<{ trial?: string }>;
};

export default async function EvalExperimentPage({
  params,
  searchParams,
}: EvalExperimentPageProps) {
  const { experimentId } = await params;
  const { trial: expandedTrialId } = await searchParams;

  const [summary, trials] = await Promise.all([
    getEvalExperimentSummary(experimentId),
    listEvalTrialsByExperiment(experimentId),
  ]);

  if (!summary || trials.length === 0) {
    notFound();
  }

  const representativeTrial = trials[0]!;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          href="/observe/evals"
          className="text-ui font-medium text-violet-700 dark:text-violet-400"
        >
          ← Back to Eval lab
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title font-semibold tracking-tight">Experiment details</h1>
          <ExperimentOutcomeBadge summary={summary} />
        </div>
        <p className="font-mono text-caption text-zinc-500">{summary.experiment_id}</p>
      </header>

      <ExperimentOverviewCard summary={summary} trial={representativeTrial} />

      <section className="space-y-3">
        <div>
          <h2 className="text-body font-semibold">Cases</h2>
          <p className="mt-1 text-ui text-zinc-500">
            One row per eval case in this experiment. Click a row to expand assertion breakdown,
            process metrics, and full chat transcript.
          </p>
        </div>
        <EvalExperimentCasesTable
          experimentId={experimentId}
          trials={trials}
          expandedTrialId={
            expandedTrialId?.trim() &&
            trials.some((trial) => trial.id === expandedTrialId.trim())
              ? expandedTrialId.trim()
              : undefined
          }
        />
      </section>
    </div>
  );
}
