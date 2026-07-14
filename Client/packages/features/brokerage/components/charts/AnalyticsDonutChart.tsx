import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import { ChartLegend } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export interface DonutSlice {
  label: string;
  value: number;
  detail?: string;
}

interface Props {
  data: DonutSlice[];
  centerLabel?: string;
  centerSub?: string;
  height?: number;
  colors?: string[];
  showEntropy?: boolean;
}

function shannonEntropy(slices: DonutSlice[]): number {
  const total = slices.reduce((s, d) => s + d.value, 0);
  return -slices.reduce((s, d) => {
    const p = d.value / total;
    return p > 0 ? s + p * Math.log2(p) : s;
  }, 0);
}

export function AnalyticsDonutChart({
  data,
  centerLabel,
  centerSub,
  height = 300,
  colors: colorsOverride,
  showEntropy = false,
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

  const entropy = shannonEntropy(data);
  const maxEntropy = Math.log2(data.length);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const legendItems = data.map((d, i) => ({
    label: d.label,
    color: palette[i % palette.length],
    valueLabel: total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : "0.0%",
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: { dataIndex: number; percent: number }) => {
        const d = data[params.dataIndex];
        const detailLine = d.detail ? `<br/>${d.detail}` : "";
        return `${d.label}<br/><b>${params.percent}%</b>${detailLine}`;
      },
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "78%"],
        center: ["50%", "50%"],
        data: data.map((d, i) => ({
          value: d.value,
          name: d.label,
          itemStyle: { color: palette[i % palette.length] },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 4 },
        })),
        itemStyle: { borderColor: color("background-surface"), borderWidth: 2 },
      },
    ],
    graphic: [
      ...(centerLabel
        ? [
            {
              type: "text",
              left: "center",
              top: centerSub ? "39%" : "45%",
              style: {
                text: centerLabel,
                fontSize: 18,
                fontWeight: "500",
                textAlign: "center",
              },
            },
          ]
        : []),
      ...(centerSub
        ? [
            {
              type: "text",
              left: "center",
              top: "51%",
              style: {
                text: centerSub,
                fontSize: 11,
                textAlign: "center",
              },
            },
          ]
        : []),
      ...(showEntropy
        ? [
            {
              type: "text",
              right: 8,
              bottom: 8,
              style: {
                text: `H = ${entropy.toFixed(2)} / ${maxEntropy.toFixed(2)} bits`,
                fontSize: 10,
                textAlign: "right",
              },
            },
          ]
        : []),
    ],
  };

  return (
    <Box className="relative">
      <ReactECharts option={option} style={{ height }} />
      <ChartLegend className="absolute right-0 top-0" items={legendItems} />
    </Box>
  );
}
