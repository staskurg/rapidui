import { redirect } from "next/navigation";

import { ObserveNoticeBanner } from "@/components/observe/ObserveNoticeBanner";
import { ObserveTelemetryDataSection } from "@/components/observe/ObserveTelemetryDataSection";
import { ObserveTelemetryHeader } from "@/components/observe/ObserveTelemetryHeader";
import { AgentObserveDataSkeleton } from "@/components/observe/ObserveSkeletons";
import {
  agentFilterInputWithPreset,
  buildAgentFilterHref,
  buildAgentFilterQuery,
  canonicalAgentFilterInput,
  shouldCanonicalizeAgentFilterUrl,
} from "@/lib/observe/agentFilterQuery";
import {
  parseAgentEnvFilter,
  parseAgentStateFilter,
} from "@/lib/observe/agentFilterOptions";
import { getObserveNotice, isObserveNoticeKey } from "@/lib/observe/notices";
import {
  buildObservePresetHrefs,
  resolveObservePageWindow,
} from "@/lib/observe/observePageSetup";

import { AgentObserveDashboard } from "./AgentObserveDashboard";

export const dynamic = "force-dynamic";

type AgentObservePageProps = {
  searchParams: Promise<{
    model?: string;
    promptVersion?: string;
    agent?: string;
    session?: string;
    state?: string;
    env?: string;
    days?: string;
    from?: string;
    to?: string;
    notice?: string;
  }>;
};

export default async function AgentObservePage({ searchParams }: AgentObservePageProps) {
  const params = await searchParams;

  if (shouldCanonicalizeAgentFilterUrl(params)) {
    redirect(buildAgentFilterHref(canonicalAgentFilterInput(params)));
  }

  const observeWindow = resolveObservePageWindow(params);
  const stateFilter = parseAgentStateFilter(params.state);
  const envFilter = parseAgentEnvFilter(params.env);
  const filterQueryParams = {
    model: params.model,
    promptVersion: params.promptVersion,
    agent: params.agent,
    session: params.session,
    state: stateFilter,
    env: envFilter,
    from: observeWindow.from,
    to: observeWindow.to,
  };
  const preserveDateRange = { from: observeWindow.from, to: observeWindow.to };
  const filterInputForNavigation = {
    model: params.model,
    promptVersion: params.promptVersion,
    agent: params.agent,
    session: params.session,
    state: params.state,
    env: params.env,
  };
  const presetHrefs = buildObservePresetHrefs(
    filterInputForNavigation,
    buildAgentFilterHref,
    agentFilterInputWithPreset,
  );

  const filterQuery = buildAgentFilterQuery(filterQueryParams);
  const noticeKey = isObserveNoticeKey(params.notice) ? params.notice : undefined;
  const notice = noticeKey ? getObserveNotice(noticeKey, { sessionId: params.session }) : null;

  return (
    <div className="space-y-8">
      {notice ? (
        <ObserveNoticeBanner
          title={notice.title}
          message={notice.message}
          dismissHref={`/observe/agent${filterQuery}`}
        />
      ) : null}

      <ObserveTelemetryHeader
        title="Agent telemetry"
        description="RapidUI Agent chat sessions — session state, latency, tokens, and platform API usage."
        windowDays={observeWindow.windowDays}
        dateRangeLabel={observeWindow.dateRangeLabel}
        presetHrefs={presetHrefs}
      />

      <ObserveTelemetryDataSection filterQuery={filterQuery} fallback={<AgentObserveDataSkeleton />}>
        <AgentObserveDashboard
          params={params}
          filterQueryParams={filterQueryParams}
          preserveDateRange={preserveDateRange}
        />
      </ObserveTelemetryDataSection>
    </div>
  );
}
