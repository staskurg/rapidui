"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  agentFilterInputFromForm,
  buildAgentFilterHref,
} from "@/lib/observe/agentFilterQuery";
import {
  apiFilterInputFromForm,
  buildApiFilterHref,
} from "@/lib/observe/apiFilterQuery";
import { useObserveNavigation } from "@/lib/observe/observePendingContext";

const FormPendingContext = createContext(false);

type ObserveDateRange = {
  from?: string;
  to?: string;
};

export type ObserveFilterScope = "agent" | "api";

const filterQueryByScope = {
  agent: {
    buildHref: buildAgentFilterHref,
    parseFormInput: agentFilterInputFromForm,
  },
  api: {
    buildHref: buildApiFilterHref,
    parseFormInput: apiFilterInputFromForm,
  },
} as const;

type ObserveFiltersFormProps = {
  children: ReactNode;
  className?: string;
  /** Remount form when filters change so defaultValue/defaultChecked stay in sync. */
  formKey?: string;
  preserveDateRange?: ObserveDateRange;
  scope: ObserveFilterScope;
};

export function ObserveFiltersForm({
  children,
  className,
  formKey,
  preserveDateRange,
  scope,
}: ObserveFiltersFormProps) {
  const router = useRouter();
  const { isPending, startObserveTransition } = useObserveNavigation();
  const { buildHref, parseFormInput } = filterQueryByScope[scope];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const filters: Record<string, string | undefined> = {};

    for (const [key, value] of data.entries()) {
      if (typeof value === "string") {
        filters[key] = value;
      }
    }

    startObserveTransition(() => {
      router.push(
        buildHref({
          ...parseFormInput(filters),
          ...preserveDateRange,
        }),
      );
    });
  }

  return (
    <FormPendingContext.Provider value={isPending}>
      <form key={formKey} className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormPendingContext.Provider>
  );
}

function ApplySpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const actionButtonClass =
  "inline-flex items-center justify-center rounded-md text-ui font-medium";

export function ObserveApplyButton({
  className = `${actionButtonClass} min-w-13 px-3 py-2 bg-zinc-900 text-white disabled:cursor-wait disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900`,
}: {
  className?: string;
}) {
  const isPending = useContext(FormPendingContext);

  return (
    <button type="submit" disabled={isPending} aria-busy={isPending} className={className}>
      {isPending ? <ApplySpinner className="h-4 w-4 animate-spin" /> : "Apply"}
    </button>
  );
}

function ClearFiltersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function ObserveClearFiltersButton({
  preserveDateRange,
  scope,
}: {
  preserveDateRange?: ObserveDateRange;
  scope: ObserveFilterScope;
}) {
  const router = useRouter();
  const formPending = useContext(FormPendingContext);
  const { isPending: observePending, startObserveTransition } = useObserveNavigation();
  const { buildHref } = filterQueryByScope[scope];

  function handleClear() {
    startObserveTransition(() => {
      router.replace(buildHref(preserveDateRange ?? {}));
      router.refresh();
    });
  }

  const isPending = formPending || observePending;

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={isPending}
      aria-label="Clear filters"
      className={`${actionButtonClass} shrink-0 p-2 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 border border-zinc-300 dark:border-zinc-700`}
    >
      <ClearFiltersIcon className="h-4 w-4" />
    </button>
  );
}
