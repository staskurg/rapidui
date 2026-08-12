"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react";

type ObservePendingContextValue = {
  isPending: boolean;
  startObserveTransition: TransitionStartFunction;
};

const ObservePendingContext = createContext<ObservePendingContextValue | null>(null);

export function ObservePendingProvider({ children }: { children: ReactNode }) {
  const [isPending, startObserveTransition] = useTransition();

  return (
    <ObservePendingContext.Provider value={{ isPending, startObserveTransition }}>
      {children}
    </ObservePendingContext.Provider>
  );
}

export function useObservePending(): ObservePendingContextValue {
  const context = useContext(ObservePendingContext);
  if (!context) {
    throw new Error("useObservePending must be used within ObservePendingProvider");
  }

  return context;
}

/** Shared observe navigation transition, falling back to a local transition outside the provider. */
export function useObserveNavigation(): ObservePendingContextValue {
  const context = useContext(ObservePendingContext);
  const [isPending, startObserveTransition] = useTransition();

  return (
    context ?? {
      isPending,
      startObserveTransition,
    }
  );
}

type ObservePendingDataGateProps = {
  children: ReactNode;
  fallback: ReactNode;
};

/** Shows fallback while an observe navigation transition is in flight. */
export function ObservePendingDataGate({ children, fallback }: ObservePendingDataGateProps) {
  const { isPending } = useObservePending();

  if (isPending) {
    return fallback;
  }

  return children;
}
