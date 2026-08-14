import { EvalExperimentCaseAccordionItem } from "@/components/observe/EvalExperimentCaseAccordionItem";
import { EvalTrialDetailSections } from "@/components/observe/EvalTrialDetailSections";
import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import { getTrialProcessCaps } from "@/lib/eval/queryEvalTrials";
import { formatTrialLatency, formatTrialStartedAt } from "@/lib/eval/trialDisplay";

type EvalExperimentCasesTableProps = {
  experimentId: string;
  trials: EvalTrialRecord[];
  expandedTrialId?: string;
};

export async function EvalExperimentCasesTable({
  experimentId,
  trials,
  expandedTrialId,
}: EvalExperimentCasesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full table-fixed text-ui">
        <thead className="bg-zinc-50 dark:bg-zinc-950/50">
          <tr>
            <th className="w-10 px-3 py-3" aria-hidden>
              <span className="sr-only">Expand</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Case</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Result</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Validates</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Turns</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Session</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Latency</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {trials.map((trial) => {
            const expanded = expandedTrialId === trial.id;
            const caps = getTrialProcessCaps(trial.eval_case_id);
            const validatesOver =
              caps.maxRetries !== null && trial.validate_attempts > caps.maxRetries;
            const turnsOver =
              caps.maxUserTurns !== null && trial.user_turns > caps.maxUserTurns;

            return (
              <EvalExperimentCaseAccordionItem
                key={trial.id}
                experimentId={experimentId}
                trialId={trial.id}
                caseId={trial.eval_case_id}
                expanded={expanded}
                sessionId={trial.session_id}
                passed={trial.passed}
                runState={trial.run_state}
                validateAttempts={trial.validate_attempts}
                validateCap={caps.maxRetries}
                validatesOver={validatesOver}
                userTurns={trial.user_turns}
                userTurnsCap={caps.maxUserTurns}
                turnsOver={turnsOver}
                latencyLabel={formatTrialLatency(trial.latency_ms)}
                startedLabel={formatTrialStartedAt(trial.started_at)}
              >
                <EvalTrialDetailSections trial={trial} compact />
              </EvalExperimentCaseAccordionItem>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
