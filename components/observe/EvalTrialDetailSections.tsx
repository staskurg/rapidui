import Link from "next/link";

import { AssertionResultsTable } from "@/components/observe/AssertionResultsTable";
import { ConfigSnapshotCard } from "@/components/observe/ConfigSnapshotCard";
import { CopyIconButton } from "@/components/observe/CopyIconButton";
import { EvalTrialTranscript } from "@/components/observe/EvalTrialTranscript";
import { ObserveDetailRow, observeLinkClass } from "@/components/observe/ObserveDetailRow";
import { TrialOutcomeBadge } from "@/components/observe/TrialOutcomeBadge";
import { NewTabLink } from "@/components/demo/NewTabLink";
import { SpecLink } from "@/components/site/SpecLink";
import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import {
  compareTrialToBaseline,
  getTrialProcessCaps,
} from "@/lib/eval/queryEvalTrials";
import {
  buildTrialRerunCommand,
  formatMustValidateBeforeSave,
  formatTrialLatency,
  formatTrialStartedAt,
} from "@/lib/eval/trialDisplay";
import { truncateSessionId } from "@/lib/observe/queries";

type EvalTrialDetailSectionsProps = {
  trial: EvalTrialRecord;
  /** Hide summary + config when embedded on the experiment page. */
  compact?: boolean;
};

function capClass(overCap: boolean): string {
  return overCap
    ? "font-medium text-amber-700 dark:text-amber-400"
    : "text-ui text-zinc-900 dark:text-zinc-100";
}


export async function EvalTrialDetailSections({
  trial,
  compact = false,
}: EvalTrialDetailSectionsProps) {
  const caps = getTrialProcessCaps(trial.eval_case_id);
  const baseline = await compareTrialToBaseline(trial);
  const rerunCommand = buildTrialRerunCommand(trial.eval_case_id);

  const validateOverCap =
    caps.maxRetries !== null && trial.validate_attempts > caps.maxRetries;
  const turnsOverCap =
    caps.maxUserTurns !== null && trial.user_turns > caps.maxUserTurns;
  const latencyOverCap =
    caps.maxLatencyMs !== null &&
    trial.latency_ms !== null &&
    trial.latency_ms > caps.maxLatencyMs;

  return (
    <div className="min-w-0 space-y-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ObserveDetailRow label="Agent session">
            <NewTabLink
              href={`/observe/agent/sessions/${trial.session_id}`}
              className={observeLinkClass}
            >
              {truncateSessionId(trial.session_id)}
            </NewTabLink>
          </ObserveDetailRow>
          <ObserveDetailRow label="API session">
            <NewTabLink
              href={`/observe/api/sessions/${trial.session_id}`}
              className={observeLinkClass}
            >
              {truncateSessionId(trial.session_id)}
            </NewTabLink>
          </ObserveDetailRow>
          {trial.final_spec_id ? (
            <ObserveDetailRow label="Saved spec">
              <SpecLink href={`/specs/${trial.final_spec_id}`} className={observeLinkClass}>
                {trial.final_spec_id}
              </SpecLink>
            </ObserveDetailRow>
          ) : null}
          <ObserveDetailRow label="Session id">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate font-mono">{trial.session_id}</span>
              <CopyIconButton text={trial.session_id} ariaLabel="Copy session id" />
            </div>
          </ObserveDetailRow>
          <ObserveDetailRow label="Re-run command">
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate font-mono">{rerunCommand}</span>
              <CopyIconButton text={rerunCommand} ariaLabel="Copy re-run command" />
            </div>
          </ObserveDetailRow>
        </dl>
      </section>

      {!compact ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-body font-semibold">Summary</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Result
              </dt>
              <dd className="mt-1">
                <TrialOutcomeBadge passed={trial.passed} runState={trial.run_state} />
              </dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Case
              </dt>
              <dd className="mt-1 font-mono text-ui">{trial.eval_case_id}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Started
              </dt>
              <dd className="mt-1 text-ui">{formatTrialStartedAt(trial.started_at)}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Experiment
              </dt>
              <dd className="mt-1 font-mono text-ui">
                <Link
                  href={`/observe/evals/experiments/${trial.experiment_id}`}
                  className="text-violet-700 hover:text-violet-900 dark:text-violet-400"
                >
                  {trial.experiment_id}
                </Link>
              </dd>
            </div>
            {trial.failure_owner ? (
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Failure owner
                </dt>
                <dd className="mt-1 font-mono text-ui">{trial.failure_owner}</dd>
              </div>
            ) : null}
            {trial.failure_stage ? (
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Failure stage
                </dt>
                <dd className="mt-1 font-mono text-ui">{trial.failure_stage}</dd>
              </div>
            ) : null}
            {trial.failure_detail ? (
              <div className="sm:col-span-2">
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Failure detail
                </dt>
                <dd className="mt-1 text-ui">{trial.failure_detail}</dd>
              </div>
            ) : null}
          </dl>

          {baseline.compatible && baseline.passedChanged !== null ? (
            <p className="mt-4 text-ui text-zinc-600 dark:text-zinc-400">
              Baseline comparison:{" "}
              {baseline.passedChanged ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  result changed vs baseline experiment
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400">
                  same pass/fail as compatible baseline trial
                </span>
              )}
            </p>
          ) : null}
        </section>
      ) : null}

      {compact &&
      (trial.failure_owner || trial.failure_stage || trial.failure_detail) ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-body font-semibold">Failure</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {trial.failure_owner ? (
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Owner
                </dt>
                <dd className="mt-1 font-mono text-ui">{trial.failure_owner}</dd>
              </div>
            ) : null}
            {trial.failure_stage ? (
              <div>
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Stage
                </dt>
                <dd className="mt-1 font-mono text-ui">{trial.failure_stage}</dd>
              </div>
            ) : null}
            {trial.failure_detail ? (
              <div className="sm:col-span-2">
                <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                  Detail
                </dt>
                <dd className="mt-1 text-ui">{trial.failure_detail}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {compact && baseline.compatible && baseline.passedChanged !== null ? (
        <p className="text-ui text-zinc-600 dark:text-zinc-400">
          Baseline comparison:{" "}
          {baseline.passedChanged ? (
            <span className="font-medium text-amber-700 dark:text-amber-400">
              result changed vs baseline experiment
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400">
              same pass/fail as compatible baseline trial
            </span>
          )}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-body font-semibold">Assertion breakdown</h2>
        <AssertionResultsTable assertions={trial.assertion_results} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-body font-semibold">Process metrics</h2>
        <p className="mt-1 text-ui text-zinc-500">
          Numbers only — caps come from the eval case definition.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Validates
            </dt>
            <dd className={`mt-1 ${capClass(validateOverCap)}`}>
              {trial.validate_attempts}
              {caps.maxRetries !== null ? ` / ${caps.maxRetries}` : ""}
              {trial.validation_failures > 0
                ? ` (${trial.validation_failures} failed)`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              User turns
            </dt>
            <dd className={`mt-1 ${capClass(turnsOverCap)}`}>
              {trial.user_turns}
              {caps.maxUserTurns !== null ? ` / ${caps.maxUserTurns}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Latency
            </dt>
            <dd className={`mt-1 ${capClass(latencyOverCap)}`}>
              {formatTrialLatency(trial.latency_ms)}
              {caps.maxLatencyMs !== null ? ` / ${caps.maxLatencyMs}ms cap` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
              Tokens
            </dt>
            <dd className="mt-1 text-ui">
              {trial.tokens_in ?? "—"} in · {trial.tokens_out ?? "—"} out
            </dd>
          </div>
          {caps.mustValidate ? (
            <div>
              <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
                Validated before save
              </dt>
              <dd className="mt-1 text-ui">
                {formatMustValidateBeforeSave(trial.must_validate_met)}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {!compact ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-body font-semibold">Config snapshot</h2>
          <div className="mt-4">
            <ConfigSnapshotCard trial={trial} />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-body font-semibold">Transcript</h2>
        <EvalTrialTranscript messages={trial.transcript_jsonb} />
      </section>
    </div>
  );
}
