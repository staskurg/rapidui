import type { ReactNode } from "react";

/** Caps stat card width; adds columns instead of stretching on wide viewports. */
export const statCardGridClass =
  "grid grid-cols-[repeat(auto-fill,minmax(10rem,12rem))] gap-2";

type StatCardGridProps = {
  children: ReactNode;
  className?: string;
};

export function StatCardGrid({ children, className = "" }: StatCardGridProps) {
  return <div className={`${statCardGridClass} ${className}`}>{children}</div>;
}
