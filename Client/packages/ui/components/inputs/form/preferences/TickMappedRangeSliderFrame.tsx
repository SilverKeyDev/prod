import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

import { RANGE_SLIDER_HIT_HEIGHT } from "./tickMappedRangeSliderShared";

type TickMappedRangeSliderChromeProps = {
  className?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
};

export function TickMappedRangeSliderChrome({
  className = "",
  header,
  children,
}: TickMappedRangeSliderChromeProps): React.ReactElement {
  return (
    <Box className={`flex w-full min-w-0 flex-col ${className}`}>
      <Box className="w-full min-w-0 max-w-xl">
        <Box className="flex w-full min-w-0 flex-col gap-2">
          {header}
          {children}
        </Box>
      </Box>
    </Box>
  );
}

type RangeSliderTrackRootProps = {
  children: React.ReactNode;
};

export function RangeSliderTrackRoot({ children }: RangeSliderTrackRootProps): React.ReactElement {
  return (
    <Box
      className="sk-range-slider-root relative w-full min-w-0 max-w-full"
      style={{ height: RANGE_SLIDER_HIT_HEIGHT }}
    >
      {children}
    </Box>
  );
}
