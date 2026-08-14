import {
  resolveExperimentOutcome,
  type EvalExperimentSummary,
} from "@/lib/eval/queryEvalExperiments";
import { trialResultStyles } from "@/lib/eval/trialDisplay";

type ExperimentOutcomeBadgeProps = {
  summary: Pick<
    EvalExperimentSummary,
    "total_cases" | "passed" | "failed" | "incomplete" | "errors"
  >;
};

export function ExperimentOutcomeBadge({ summary }: ExperimentOutcomeBadgeProps) {
  const label = resolveExperimentOutcome(summary);

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${trialResultStyles[label]}`}
    >
      {label}
    </span>
  );
}
