"use client";

import { Suspense, type ReactNode } from "react";

import { ObservePendingDataGate } from "@/lib/observe/observePendingContext";

type ObserveTelemetryDataSectionProps = {
  filterQuery: string;
  fallback: ReactNode;
  children: ReactNode;
};

export function ObserveTelemetryDataSection({
  filterQuery,
  fallback,
  children,
}: ObserveTelemetryDataSectionProps) {
  return (
    <ObservePendingDataGate fallback={fallback}>
      <Suspense key={filterQuery} fallback={fallback}>
        {children}
      </Suspense>
    </ObservePendingDataGate>
  );
}
