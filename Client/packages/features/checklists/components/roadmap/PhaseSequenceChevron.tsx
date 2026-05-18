import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

export type PhaseSequenceChevronProps = {
  /** True when the stage before this chevron is complete or is the journey step. */
  pathActive: boolean;
  className?: string;
};

/** Sequence indicator between roadmap stages (desktop). */
export function PhaseSequenceChevron({ pathActive, className = "" }: PhaseSequenceChevronProps) {
  return (
    <Box
      className={`flex shrink-0 items-center justify-center px-0.5 ${className}`.trim()}
      role="presentation"
      aria-hidden
      data-testid="phase-sequence-chevron"
    >
      <Icon
        name="chevron-right"
        className={
          pathActive ? "text-gold h-4 w-4 opacity-90" : "text-text-tertiary h-4 w-4 opacity-50"
        }
      />
    </Box>
  );
}
