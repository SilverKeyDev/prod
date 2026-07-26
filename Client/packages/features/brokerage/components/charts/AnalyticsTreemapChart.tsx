import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import { Box } from "packages/ui/components/structure/primitives";

export interface TreemapLeaf {
  name: string;
  value: number;
}

interface Props {
  data: TreemapLeaf[];
  height?: number;
  colors?: string[];
  valueLabel?: string;
}

export function AnalyticsTreemapChart({
  data,
  height = 220,
  colors: colorsOverride,
  valueLabel = "agents",
}: Props) {
  const defaultColors = [
    color("chart.1"),
    color("chart.2"),
    color("chart.3"),
    color("chart.4"),
    color("chart.5"),
    color("chart.6"),
  ];
  const palette = colorsOverride ?? defaultColors;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const option = {
    tooltip: {
      formatter: (params: { name: string; value: number }) => {
        const pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : "0.0";
        return `${params.name}<br/><b>${params.value}</b> ${valueLabel} (${pct}%)`;
      },
    },
    series: [
      {
        type: "treemap",
        width: "100%",
        height: "100%",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: (params: { name: string; value: number }) => `${params.name}\n${params.value}`,
          fontSize: 12,
          color: color("text.primary"),
        },
        upperLabel: { show: false },
        itemStyle: {
          borderColor: color("background-surface"),
          borderWidth: 2,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderColor: color("background-surface"),
              borderWidth: 2,
              gapWidth: 2,
            },
          },
        ],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: palette[i % palette.length] },
        })),
      },
    ],
  };

  return (
    <Box data-testid="analytics-treemap-chart">
      <ReactECharts
        option={option}
        style={{ height, width: "100%" }}
        opts={{ renderer: "canvas" }}
      />
    </Box>
  );
}
