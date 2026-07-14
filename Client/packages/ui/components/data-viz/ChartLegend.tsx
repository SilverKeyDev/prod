import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type ChartLegendItem = {
  label: string;
  color: string;
  valueLabel?: string;
};

export type ChartLegendProps = {
  items: ChartLegendItem[];
  className?: string;
};

export function ChartLegend({ items, className }: ChartLegendProps): React.ReactElement {
  return (
    <Box className={["space-y-1.5", className].filter(Boolean).join(" ")}>
      {items.map((item, index) => (
        <Box key={`${item.label}-${index}`} className="flex items-center gap-2">
          <Box className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          <BodyText as="span" size="sm" className="text-text-secondary">
            {item.label}
            {item.valueLabel != null ? ` ${item.valueLabel}` : ""}
          </BodyText>
        </Box>
      ))}
    </Box>
  );
}
