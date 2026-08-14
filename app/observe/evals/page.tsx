import { redirect } from "next/navigation";

import { ObserveTelemetryDataSection } from "@/components/observe/ObserveTelemetryDataSection";
import { ObserveTelemetryHeader } from "@/components/observe/ObserveTelemetryHeader";
import { EvalObserveDataSkeleton } from "@/components/observe/ObserveSkeletons";
import {
  buildEvalTrialFilterHref,
  buildEvalTrialFilterQuery,
  canonicalEvalTrialFilterInput,
  evalTrialFilterInputWithPreset,
  shouldCanonicalizeEvalTrialFilterUrl,
} from "@/lib/eval/evalTrialFilterQuery";
import { parseEvalTrialsQuery } from "@/lib/eval/queryEvalTrials";
import {
  buildObservePresetHrefs,
  resolveObservePageWindow,
} from "@/lib/observe/observePageSetup";

import { EvalTrialsDashboard } from "./EvalTrialsDashboard";

export const dynamic = "force-dynamic";

type EvalsObservePageProps = {
  searchParams: Promise<{
    result?: string;
    experiment?: string;
    overCap?: string;
    days?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function EvalsObservePage({ searchParams }: EvalsObservePageProps) {
  const params = await searchParams;

  if (shouldCanonicalizeEvalTrialFilterUrl(params)) {
    redirect(buildEvalTrialFilterHref(canonicalEvalTrialFilterInput(params)));
  }

  const observeWindow = resolveObservePageWindow(params);
  const filterQueryParams = {
    result: params.result,
    experiment: params.experiment,
    overCap: params.overCap,
    from: observeWindow.from,
    to: observeWindow.to,
  };
  const preserveDateRange = { from: observeWindow.from, to: observeWindow.to };
  const filterInputForNavigation = {
    result: params.result,
    experiment: params.experiment,
    overCap: params.overCap,
  };
  const presetHrefs = buildObservePresetHrefs(
    filterInputForNavigation,
    buildEvalTrialFilterHref,
    evalTrialFilterInputWithPreset,
  );

  const filterQuery = buildEvalTrialFilterQuery(filterQueryParams);
  const query = parseEvalTrialsQuery(filterQueryParams);

  return (
    <div className="space-y-8">
      <ObserveTelemetryHeader
        title="Eval lab"
        description="Automated guided trials from npm run eval:run. Open an experiment to review per-case results and transcripts."
        windowDays={observeWindow.windowDays}
        dateRangeLabel={observeWindow.dateRangeLabel}
        presetHrefs={presetHrefs}
      />

      <ObserveTelemetryDataSection filterQuery={filterQuery} fallback={<EvalObserveDataSkeleton />}>
        <EvalTrialsDashboard
          params={filterQueryParams}
          query={query}
          preserveDateRange={preserveDateRange}
        />
      </ObserveTelemetryDataSection>
    </div>
  );
}
