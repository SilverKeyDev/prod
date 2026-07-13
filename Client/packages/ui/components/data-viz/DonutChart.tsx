import React from "react";

import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { ChartLegend } from "./ChartLegend";

export type DonutChartProps = {
  data: Array<{ label: string; value: number; color: string }>;
};

export function DonutChart({ data }: DonutChartProps): React.ReactElement {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Box className="text-center">
        <BodyText size="sm" className="text-text-secondary">
          No data available
        </BodyText>
      </Box>
    );
  }

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(50, 50, 40, endAngle);
    const end = polarToCartesian(50, 50, 40, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const innerStart = polarToCartesian(50, 50, 25, endAngle);
    const innerEnd = polarToCartesian(50, 50, 25, startAngle);

    return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A 25 25 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y} Z`;
  };

  let cumulativePercentage = 0;

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    cumulativePercentage += percentage;
    const endAngle = (cumulativePercentage / 100) * 360;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle,
    };
  });

  return (
    <Box className="relative">
      <Box className="flex justify-center">
        <svg viewBox="0 0 100 100" className="h-48 w-48">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={createArc(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              className="transition-opacity hover:opacity-80"
            />
          ))}
        </svg>
      </Box>
      <ChartLegend
        className="absolute right-0 top-0"
        items={segments.map((segment) => ({
          label: segment.label,
          color: segment.color,
          valueLabel: `${segment.percentage.toFixed(1)}%`,
        }))}
      />
    </Box>
  );
}
