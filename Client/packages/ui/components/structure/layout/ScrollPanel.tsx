import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

/** Viewport-relative max-height presets for dashboard list sections. */
export const SCROLL_PANEL_MAX = {
  agenda: "max-h-[40vh]",
  checklist: "max-h-[52vh]",
  clients: "max-h-[55vh]",
  agentSearch: "max-h-[45vh]",
} as const;

export type ScrollPanelProps = {
  children: React.ReactNode;
  /** Tailwind max-height class(es); default caps at ~40% viewport. */
  maxHeight?: string;
  className?: string;
};

/**
 * Capped scroll region for long lists inside dashboard panels.
 * Presentation-only — no data fetching or business logic.
 */
export function ScrollPanel({
  children,
  maxHeight = SCROLL_PANEL_MAX.agenda,
  className,
}: ScrollPanelProps) {
  return (
    <Box
      className={twMergeClasses(
        "scrollbar-styled min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-y-contain",
        maxHeight,
        className
      )}
    >
      {children}
    </Box>
  );
}
