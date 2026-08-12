import Link from "next/link";
import { redirect } from "next/navigation";

import { ObserveTelemetryDataSection } from "@/components/observe/ObserveTelemetryDataSection";
import { ObserveTelemetryHeader } from "@/components/observe/ObserveTelemetryHeader";
import { ApiObserveDataSkeleton } from "@/components/observe/ObserveSkeletons";
import {
  apiFilterInputWithPreset,
  buildApiFilterHref,
  buildApiFilterQuery,
  canonicalApiFilterInput,
  shouldCanonicalizeApiFilterUrl,
} from "@/lib/observe/apiFilterQuery";
import {
  buildObservePresetHrefs,
  resolveObservePageWindow,
} from "@/lib/observe/observePageSetup";

import { ApiObserveDashboard } from "./ApiObserveDashboard";

export const dynamic = "force-dynamic";

type ApiObservePageProps = {
  searchParams: Promise<{
    agent?: string;
    evalCase?: string;
    session?: string;
    days?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function ApiObservePage({ searchParams }: ApiObservePageProps) {
  const params = await searchParams;

  if (shouldCanonicalizeApiFilterUrl(params)) {
    redirect(buildApiFilterHref(canonicalApiFilterInput(params)));
  }

  const observeWindow = resolveObservePageWindow(params);
  const filterQueryParams = {
    agent: params.agent,
    evalCase: params.evalCase,
    session: params.session,
    from: observeWindow.from,
    to: observeWindow.to,
  };
  const preserveDateRange = { from: observeWindow.from, to: observeWindow.to };
  const filterInputForNavigation = {
    agent: params.agent,
    evalCase: params.evalCase,
    session: params.session,
  };
  const presetHrefs = buildObservePresetHrefs(
    filterInputForNavigation,
    buildApiFilterHref,
    apiFilterInputWithPreset,
  );

  const filterQuery = buildApiFilterQuery(filterQueryParams);

  return (
    <div className="space-y-8">
      <ObserveTelemetryHeader
        title="API telemetry"
        description="Discovery, validate, and save events from external agents and RapidUI Agent."
        windowDays={observeWindow.windowDays}
        dateRangeLabel={observeWindow.dateRangeLabel}
        presetHrefs={presetHrefs}
      />

      <ObserveTelemetryDataSection filterQuery={filterQuery} fallback={<ApiObserveDataSkeleton />}>
        <ApiObserveDashboard
          params={params}
          filterQueryParams={filterQueryParams}
          preserveDateRange={preserveDateRange}
        />
      </ObserveTelemetryDataSection>

      <Link
        href="/observe/agent"
        className="inline-flex text-ui font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
      >
        View Agent telemetry →
      </Link>
    </div>
  );
}
