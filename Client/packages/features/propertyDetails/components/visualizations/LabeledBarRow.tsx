import React from "react";

import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

export type LabeledBarRowProps = {
  label: string;
  valueText: string;
  /** 0–1 portion of the track to fill (clamped). */
  fillRatio: number;
};

export function LabeledBarRow({
  label,
  valueText,
  fillRatio,
}: LabeledBarRowProps): React.ReactElement {
  const clamped = Math.min(1, Math.max(0, fillRatio));
  return (
    <Box className="space-y-1">
      <Box className="flex justify-between text-sm">
        <BodyText as="span" className="text-text-secondary">
          {label}
        </BodyText>
        <BodyText as="span" className="text-text-secondary font-medium">
          {valueText}
        </BodyText>
      </Box>
      <Box
        className="bg-accent-muted h-2 w-full overflow-hidden rounded-full"
        aria-hidden
      >
        <Box
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${clamped * 100}%` }}
        />
      </Box>
    </Box>
  );
}
