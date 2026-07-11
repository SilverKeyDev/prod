import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";

export interface BarDataPoint {
  label: string;
  value: number;
  zScore?: number;
}

interface Props {
  data: BarDataPoint[];
  height?: number;
  unit?: string;
  orientation?: "horizontal" | "vertical";
  showAvgLine?: boolean;
  colorAbove?: string;
  colorNear?: string;
  colorBelow?: string;
  color?: string;
}

function barColor(
  zScore: number | undefined,
  colorAbove: string,
  colorNear: string,
  colorBelow: string,
  override?: string
): string {
  if (override) return override;
  if (zScore == null) return colorNear;
  if (zScore > 0.5) return colorAbove;
  if (zScore < -0.5) return colorBelow;
  return colorNear;
}

export function AnalyticsBarChart({
  data,
  height = 300,
  unit = "",
  orientation = "horizontal",
  showAvgLine = false,
  colorAbove,
  colorNear,
  colorBelow,
  color: colorOverride,
}: Props) {
  const above = colorAbove ?? color("state.success.DEFAULT");
  const near = colorNear ?? color("chart.1");
  const below = colorBelow ?? color("rose.DEFAULT");

  const values = data.map((d) => d.value);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const isVertical = orientation === "vertical";

  const seriesData = data.map((d) => ({
    value: d.value,
    itemStyle: {
      color: barColor(d.zScore, above, near, below, colorOverride),
      borderRadius: isVertical ? [3, 3, 0, 0] : [0, 3, 3, 0],
    },
  }));

  const markLine = showAvgLine
    ? {
        silent: true,
        symbol: "none",
        lineStyle: { type: "dashed", width: 1 },
        data: [isVertical ? { yAxis: Math.round(avg) } : { xAxis: Math.round(avg) }],
        label: {
          show: true,
          formatter: `avg ${Math.round(avg)}${unit}`,
          fontSize: 10,
          position: "end",
        },
      }
    : undefined;

  const categoryAxis = {
    type: "category" as const,
    data: data.map((d) => d.label),
    axisLabel: { fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
  };

  const valueAxis = {
    type: "value" as const,
    axisLabel: { fontSize: 10, formatter: `{value}${unit}` },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: "rgba(11,11,11,0.05)" } },
  };

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      formatter: (params: { dataIndex: number; value: number }[]) => {
        const p = params[0];
        const d = data[p.dataIndex];
        const zLine =
          d.zScore != null ? `<br/>z-score: <b>${d.zScore > 0 ? "+" : ""}${d.zScore}</b>` : "";
        return `${d.label}<br/><b>${p.value}${unit}</b>${zLine}`;
      },
    },
    grid: isVertical
      ? { left: 16, right: 16, top: 16, bottom: 36 }
      : { left: 64, right: 24, top: 8, bottom: 28 },
    xAxis: isVertical ? categoryAxis : valueAxis,
    yAxis: isVertical ? valueAxis : categoryAxis,
    series: [{ type: "bar", data: seriesData, barMaxWidth: isVertical ? 32 : 16, markLine }],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
