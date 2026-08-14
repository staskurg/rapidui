import Link from "next/link";
import { notFound } from "next/navigation";

import { EvalTrialDetailSections } from "@/components/observe/EvalTrialDetailSections";
import { TrialOutcomeBadge } from "@/components/observe/TrialOutcomeBadge";
import { getEvalTrialById } from "@/lib/eval/queryEvalTrials";

export const dynamic = "force-dynamic";

type EvalTrialDetailPageProps = {
  params: Promise<{ trialId: string }>;
};

export default async function EvalTrialDetailPage({ params }: EvalTrialDetailPageProps) {
  const { trialId } = await params;
  const trial = await getEvalTrialById(trialId);

  if (!trial) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link
          href={`/observe/evals/experiments/${trial.experiment_id}`}
          className="text-ui font-medium text-violet-700 dark:text-violet-400"
        >
          ← Back to experiment details
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title font-semibold tracking-tight">Trial details</h1>
          <TrialOutcomeBadge passed={trial.passed} runState={trial.run_state} />
        </div>
        <p className="font-mono text-caption text-zinc-500">{trial.id}</p>
      </header>

      <EvalTrialDetailSections trial={trial} />
    </div>
  );
}
