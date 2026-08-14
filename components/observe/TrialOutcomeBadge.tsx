import {
  resolveTrialResultLabel,
  trialResultStyles,
  type TrialResultLabel,
} from "@/lib/eval/trialDisplay";
import type { RunState } from "@/lib/eval/runnerTypes";

type TrialOutcomeBadgeProps = {
  passed: boolean | null;
  runState: RunState;
};

export function TrialOutcomeBadge({ passed, runState }: TrialOutcomeBadgeProps) {
  const label = resolveTrialResultLabel({ passed, run_state: runState });

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${trialResultStyles[label]}`}
    >
      {label}
    </span>
  );
}

export function trialOutcomeLabel(props: TrialOutcomeBadgeProps): TrialResultLabel {
  return resolveTrialResultLabel({ passed: props.passed, run_state: props.runState });
}
