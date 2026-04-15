import React from "react";

import { color } from "packages/design-tokens";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

export type VerticalBarChartProps = {
  data: Array<{ label: string; value: number; displayValue: string }>;
};

export function VerticalBarChart({
  data,
}: VerticalBarChartProps): React.ReactElement {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) {
    return (
      <Box className="py-4 text-center">
        <BodyText size="sm" className="text-text-secondary">
          No data available
        </BodyText>
      </Box>
    );
  }

  return (
    <Box className="space-y-3">
      <Box className="flex h-40 items-end gap-1">
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxValue) * 100;
          const barPercent = Math.max(heightPercentage, 1.5);
          return (
            <Box
              key={index}
              className="flex min-w-0 flex-1 flex-col justify-end"
            >
              <Box
                className="bg-accent-muted relative min-h-0.5 w-full overflow-hidden rounded-t-md"
                style={{ height: `${barPercent}%` }}
              >
                <Box
                  className="absolute inset-x-0 bottom-0 top-0 rounded-t-md"
                  style={{ backgroundColor: color("primary") }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
      >
        {data.map((item, index) => (
          <Box
            key={index}
            className="flex min-w-0 flex-col items-center gap-0.5"
          >
            <BodyText
              as="span"
              size="xs"
              className="text-text-muted text-center leading-tight"
            >
              {item.label}
            </BodyText>
            <BodyText
              as="span"
              size="xs"
              className="text-text-secondary text-center font-medium"
            >
              {item.displayValue}
            </BodyText>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
