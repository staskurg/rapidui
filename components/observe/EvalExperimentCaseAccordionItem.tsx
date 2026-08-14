"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState, type MouseEvent, type ReactNode } from "react";

import { NewTabLink } from "@/components/demo/NewTabLink";
import { EvalCaseDetailSkeleton } from "@/components/observe/ObserveSkeletons";
import { TrialOutcomeBadge } from "@/components/observe/TrialOutcomeBadge";
import type { RunState } from "@/lib/eval/runnerTypes";
import { useObserveNavigation } from "@/lib/observe/observePendingContext";

type EvalExperimentCaseAccordionItemProps = {
  experimentId: string;
  trialId: string;
  caseId: string;
  expanded: boolean;
  sessionId: string;
  passed: boolean | null;
  runState: RunState;
  validateAttempts: number;
  validateCap: number | null;
  validatesOver: boolean;
  userTurns: number;
  userTurnsCap: number | null;
  turnsOver: boolean;
  latencyLabel: string;
  startedLabel: string;
  children: ReactNode;
};

function buildTrialDetailsHref(
  experimentId: string,
  trialId: string,
  expanded: boolean,
): string {
  const base = `/observe/evals/experiments/${experimentId}`;
  return expanded ? base : `${base}?trial=${encodeURIComponent(trialId)}`;
}

function ChevronIcon({ expanded, className }: { expanded: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""} ${className ?? ""}`}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function EvalExperimentCaseAccordionItem({
  experimentId,
  trialId,
  caseId,
  expanded,
  sessionId,
  passed,
  runState,
  validateAttempts,
  validateCap,
  validatesOver,
  userTurns,
  userTurnsCap,
  turnsOver,
  latencyLabel,
  startedLabel,
  children,
}: EvalExperimentCaseAccordionItemProps) {
  const router = useRouter();
  const { isPending, startObserveTransition } = useObserveNavigation();
  const [navIntent, setNavIntent] = useState<"expand" | "collapse" | null>(null);

  const isOpening = navIntent === "expand" && isPending && !expanded;
  const isClosing = navIntent === "collapse" && isPending && expanded;
  const showPanel = expanded || isOpening || isClosing;
  const showLoader = isOpening;
  const chevronExpanded = expanded || isOpening;

  function toggleExpanded() {
    setNavIntent(expanded ? "collapse" : "expand");
    startObserveTransition(() => {
      router.push(buildTrialDetailsHref(experimentId, trialId, expanded), { scroll: false });
    });
  }

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>) {
    if ((event.target as HTMLElement).closest("a")) {
      return;
    }

    toggleExpanded();
  }

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleExpanded();
          }
        }}
        aria-expanded={expanded}
        aria-controls={`trial-panel-${trialId}`}
        className={`cursor-pointer ${
          expanded
            ? "bg-violet-50/60 dark:bg-violet-950/20"
            : "hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40"
        }`}
      >
        <td className="w-10 px-3 py-3 text-zinc-500">
          <ChevronIcon expanded={chevronExpanded} className="h-4 w-4" />
        </td>
        <td className="px-4 py-3 font-mono text-caption text-zinc-900 dark:text-zinc-100">
          {caseId}
        </td>
        <td className="px-4 py-3">
          <TrialOutcomeBadge passed={passed} runState={runState} />
        </td>
        <td
          className={`px-4 py-3 ${validatesOver ? "font-medium text-amber-700 dark:text-amber-400" : ""}`}
        >
          {validateAttempts}
          {validateCap !== null ? ` / ${validateCap}` : ""}
        </td>
        <td
          className={`px-4 py-3 ${turnsOver ? "font-medium text-amber-700 dark:text-amber-400" : ""}`}
        >
          {userTurns}
          {userTurnsCap !== null ? ` / ${userTurnsCap}` : ""}
        </td>
        <td className="px-4 py-3">
          <NewTabLink
            href={`/observe/agent/sessions/${sessionId}`}
            className="inline-flex items-center gap-1.5 text-caption font-medium text-violet-700 hover:underline dark:text-violet-400"
            title={`Open agent session ${sessionId}`}
          >
            Agent session
            <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
          </NewTabLink>
        </td>
        <td className="px-4 py-3">{latencyLabel}</td>
        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
          {startedLabel}
        </td>
      </tr>
      {showPanel ? (
        <tr className="bg-zinc-50/80 dark:bg-zinc-950/30">
          <td colSpan={8} className="max-w-0 px-4 py-6" id={`trial-panel-${trialId}`}>
            <div className="min-w-0">
              {showLoader ? (
                <EvalCaseDetailSkeleton />
              ) : (
                <Suspense fallback={<EvalCaseDetailSkeleton />}>{children}</Suspense>
              )}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
