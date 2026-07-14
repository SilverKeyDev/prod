import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";

export interface HeatMapCell {
  x: number;
  y: number;
  value: number;
}

interface Props {
  xLabels: string[];
  yLabels: string[];
  data: HeatMapCell[];
  height?: number;
  valueLabel?: string;
  colorLow?: string;
  colorHigh?: string;
}

export function AnalyticsHeatMap({
  xLabels,
  yLabels,
  data,
  height = 200,
  valueLabel = "transactions",
  colorLow,
  colorHigh,
}: Props) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const low = colorLow ?? color("olive.muted");
  const high = colorHigh ?? color("chart.1");

  const option = {
    tooltip: {
      position: "top",
      formatter: (params: { data: [number, number, number] }) => {
        const [x, y, v] = params.data;
        return `${yLabels[y]} ${xLabels[x]}<br/><b>${v}</b> ${valueLabel}`;
      },
    },
    grid: { left: 44, right: 16, top: 10, bottom: 28 },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLabel: { fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: yLabels,
      axisLabel: { fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: false },
      splitLine: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      show: false,
      inRange: { color: [low, high] },
    },
    series: [
      {
        type: "heatmap",
        data: data.map((d) => [d.x, d.y, d.value]),
        label: { show: false },
        itemStyle: {
          borderColor: color("background-surface"),
          borderWidth: 2,
          borderRadius: 2,
        },
        emphasis: { itemStyle: { borderColor: high, borderWidth: 2 } },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
