import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type ChecklistProgressBarProps = {
  loading: boolean;
  /** 0–100 (clamped internally) */
  percent: number;
  /**
   * When true, renders nothing while loading (legacy close-page header behavior).
   * Dashboard uses loading UI instead.
   */
  hideWhileLoading?: boolean;
  /**
   * Track styling preset: `closePage` matches ClosePageHeader (taller on lg).
   */
  variant?: "dashboard" | "closePage";
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Shared thin progress track + fill used by buyer checklist headers (dashboard + close flow).
 */
export function ChecklistProgressBar({
  loading,
  percent,
  hideWhileLoading = false,
  variant = "dashboard",
}: ChecklistProgressBarProps) {
  if (hideWhileLoading && loading) {
    return null;
  }

  const trackClassName =
    variant === "closePage"
      ? "bg-neutral-300 h-1 w-full overflow-hidden rounded dark:bg-neutral-600 lg:h-2"
      : "bg-neutral-300 h-1 w-full overflow-hidden rounded dark:bg-neutral-600";

  const safePercent = clampPercent(percent);

  if (loading) {
    return (
      <Box
        className={trackClassName}
        role="progressbar"
        aria-busy={true}
        aria-valuetext="Loading progress"
      >
        <Box className="h-full w-full animate-pulse rounded bg-neutral-300/80 dark:bg-neutral-500/80" />
      </Box>
    );
  }

  return (
    <Box
      className={trackClassName}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safePercent}
      aria-valuetext={`${safePercent}% complete`}
    >
      <Box
        className="bg-primary h-full rounded transition-[width] duration-300 ease-out"
        style={{ width: `${safePercent}%` }}
      />
    </Box>
  );
}
