import Link from "next/link";

import { ObserveDetailRow, observeLinkClass } from "@/components/observe/ObserveDetailRow";
import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import type { EvalExperimentSummary } from "@/lib/eval/queryEvalExperiments";
import { formatExperimentPassRate } from "@/lib/eval/queryEvalExperiments";
import {
  formatTrialModelLabel,
  resolveTrialPlatformEnv,
} from "@/lib/eval/configDisplay";
import { formatTrialStartedAt } from "@/lib/eval/trialDisplay";

type ExperimentOverviewCardProps = {
  summary: EvalExperimentSummary;
  trial: EvalTrialRecord;
};


export function ExperimentOverviewCard({ summary, trial }: ExperimentOverviewCardProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ObserveDetailRow label="Pass rate">
          <span className="font-medium">
            {formatExperimentPassRate(summary)}{" "}
            <span className="font-normal text-zinc-500">
              ({summary.passed}/{summary.total_cases} cases)
            </span>
          </span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Started">
          {formatTrialStartedAt(summary.started_at)}
        </ObserveDetailRow>
        <ObserveDetailRow label="Model">
          <span className="font-mono">
            {formatTrialModelLabel(trial.model, trial.provider) ?? "—"}
          </span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Prompt">
          <span className="font-mono">{trial.prompt_version ?? "—"}</span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Eval mode">
          <span className="font-mono">{trial.eval_mode}</span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Environment">
          <span className="font-mono">{resolveTrialPlatformEnv(trial.base_url)}</span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Runner version">
          <span className="font-mono">{trial.runner_version ?? "—"}</span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Validation version">
          <span className="font-mono">{trial.validation_version ?? "—"}</span>
        </ObserveDetailRow>
        <ObserveDetailRow label="Registry version">
          <span className="font-mono">{trial.registry_version ?? "—"}</span>
        </ObserveDetailRow>
        {summary.baseline_experiment_id ? (
          <ObserveDetailRow label="Baseline experiment">
            <Link href={`/observe/evals/experiments/${summary.baseline_experiment_id}`} className={observeLinkClass}>
              {summary.baseline_experiment_id}
            </Link>
          </ObserveDetailRow>
        ) : null}
      </dl>
    </section>
  );
}
