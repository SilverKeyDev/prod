import React from "react";

import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

export type ScoreBarProps = {
  /** Numeric score (e.g. 7 for 7/10). */
  score: number;
  max?: number;
  /** Shown next to the bar (e.g. "7/10"). */
  label?: string;
};

export function ScoreBar({ score, max = 10, label }: ScoreBarProps): React.ReactElement {
  const safeMax = max > 0 ? max : 10;
  const n = Number.isFinite(score) ? score : 0;
  const ratio = Math.min(1, Math.max(0, n / safeMax));
  const displayLabel = label ?? `${Math.round(n * 10) / 10}/${safeMax}`;

  return (
    <Box className="min-w-[4.5rem]">
      <Box className="flex items-center justify-end gap-2">
        <Box className="bg-accent-muted h-2 w-16 overflow-hidden rounded-full sm:w-20" aria-hidden>
          <Box
            className="bg-brand-accent h-full rounded-full transition-all"
            style={{ width: `${ratio * 100}%` }}
          />
        </Box>
        <BodyText
          as="span"
          className="text-text-primary w-10 text-right text-xs font-semibold tabular-nums"
        >
          {displayLabel}
        </BodyText>
      </Box>
    </Box>
  );
}
