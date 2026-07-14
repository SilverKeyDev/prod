import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";

export interface FunnelDataPoint {
  label: string;
  value: number;
  /** Optional annotation (e.g. stage conversion %) shown in tooltip / label. */
  dataLabel?: string;
}

interface Props {
  data: FunnelDataPoint[];
  height?: number;
  colors?: string[];
}

export function AnalyticsFunnelChart({ data, height = 220, colors: colorsOverride }: Props) {
  const defaultColors = [
    color("chart.1"),
    color("chart.2"),
    color("chart.3"),
    color("chart.4"),
    color("chart.5"),
    color("chart.6"),
  ];
  const palette = colorsOverride ?? defaultColors;

  const option = {
    tooltip: {
      trigger: "item" as const,
      formatter: (params: { name: string; value: number; dataIndex: number; percent: number }) => {
        const d = data[params.dataIndex];
        const conv =
          d?.dataLabel != null && d.dataLabel !== ""
            ? `<br/>Conversion: <b>${d.dataLabel}</b>`
            : "";
        return `${params.name}<br/><b>${params.value}</b> (${params.percent.toFixed(1)}% of top)${conv}`;
      },
    },
    series: [
      {
        type: "funnel" as const,
        left: "8%",
        top: 12,
        bottom: 12,
        width: "84%",
        minSize: "12%",
        maxSize: "100%",
        sort: "none" as const,
        gap: 4,
        label: {
          show: true,
          position: "inside" as const,
          fontSize: 11,
          color: color("background-surface"),
          formatter: (params: { name: string; value: number; dataIndex: number }) => {
            const d = data[params.dataIndex];
            const conv = d?.dataLabel ? ` · ${d.dataLabel}` : "";
            return `${params.name}: ${params.value}${conv}`;
          },
        },
        labelLine: { show: false },
        itemStyle: {
          borderColor: color("background-surface"),
          borderWidth: 1,
        },
        emphasis: {
          label: { fontSize: 12 },
        },
        data: data.map((d, i) => ({
          name: d.label,
          value: d.value,
          itemStyle: { color: palette[i % palette.length] },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
