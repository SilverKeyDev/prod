import React from "react";

import { color } from "packages/design-tokens";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type LollipopChartProps = {
  data: Array<{ label: string; value: number; displayValue: string }>;
};

export function LollipopChart({ data }: LollipopChartProps): React.ReactElement {
  const maxValue = Math.max(...data.map((item) => item.value), 100);

  return (
    <Box className="space-y-4">
      {data.map((item, index) => {
        const widthPercentage = (item.value / maxValue) * 100;
        return (
          <Box key={index} className="space-y-1">
            <Box className="flex justify-between">
              <BodyText as="span" size="sm" className="text-text-secondary">
                {item.label}
              </BodyText>
              <BodyText as="span" size="sm" className="text-text-secondary font-medium">
                {item.displayValue}
              </BodyText>
            </Box>
            <Box className="relative h-3 w-full">
              <Box
                className="absolute left-0 top-1/2 h-px"
                style={{
                  width: `${widthPercentage}%`,
                  backgroundColor: color("accent"),
                }}
              />
              <Box
                className="ring-background absolute top-0 h-3 w-3 rounded-full ring-2 transition-all"
                style={{
                  left: `calc(${widthPercentage}% - 6px)`,
                  backgroundColor: color("primary"),
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
