import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import {
  CHART_BAR_MAX_WIDTH,
  CHART_BAR_RADIUS,
} from "packages/features/brokerage/utils/analytics/analyticsTokens";

export interface BarDataPoint {
  label: string;
  value: number;
  zScore?: number;
  /** Optional secondary label (e.g. conversion %) shown on the bar. */
  dataLabel?: string;
}

/** Named series for grouped (side-by-side) bars. Categories come from `data[].label`. */
export type BarSeries = {
  name: string;
  values: number[];
  color: string;
  /** Optional per-point display strings for tooltips (same length as values). */
  displayValues?: string[];
};

interface Props {
  data: BarDataPoint[];
  height?: number;
  unit?: string;
  orientation?: "horizontal" | "vertical";
  showAvgLine?: boolean;
  /** Optional target mark line on the value axis. */
  targetValue?: number;
  targetLabel?: string;
  showDataLabels?: boolean;
  colorAbove?: string;
  colorNear?: string;
  colorBelow?: string;
  color?: string;
  /**
   * When set, renders grouped bars sharing `data` category labels.
   * Single-series z-score coloring / avg line are ignored.
   */
  series?: BarSeries[];
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
  targetValue,
  targetLabel = "target",
  showDataLabels = true,
  colorAbove,
  colorNear,
  colorBelow,
  color: colorOverride,
  series: multiSeries,
}: Props) {
  const above = colorAbove ?? color("state.success.DEFAULT");
  const near = colorNear ?? color("chart.1");
  const below = colorBelow ?? color("rose.DEFAULT");
  const isVertical = orientation === "vertical";
  const radius = CHART_BAR_RADIUS;
  const isGrouped = multiSeries != null && multiSeries.length > 0;

  const categoryAxis = {
    type: "category" as const,
    data: data.map((d) => d.label),
    axisLabel: { fontSize: 11, color: color("text-secondary") },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
  };

  const valueAxis = {
    type: "value" as const,
    axisLabel: {
      fontSize: 10,
      formatter: `{value}${unit}`,
      color: color("text-secondary"),
    },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: color("border-card-muted") } },
  };

  if (isGrouped) {
    const borderRadius = isVertical ? [radius, radius, 0, 0] : [0, radius, radius, 0];
    const echartsSeries = multiSeries.map((s) => ({
      name: s.name,
      type: "bar" as const,
      data: s.values,
      barMaxWidth: isVertical ? CHART_BAR_MAX_WIDTH : 14,
      itemStyle: {
        color: s.color,
        borderRadius,
      },
      label: showDataLabels
        ? {
            show: true,
            position: isVertical ? ("top" as const) : ("right" as const),
            fontSize: 10,
            color: color("text-secondary"),
            formatter: (params: { dataIndex: number; value: number }) => {
              const display = s.displayValues?.[params.dataIndex];
              if (display) return display;
              return `${params.value}${unit}`;
            },
          }
        : { show: false },
    }));

    const option = {
      legend: {
        data: multiSeries.map((s) => s.name),
        top: 0,
        textStyle: { fontSize: 11, color: color("text-secondary") },
      },
      tooltip: {
        trigger: "axis" as const,
        axisPointer: { type: "shadow" as const },
        formatter: (
          params: {
            seriesName: string;
            dataIndex: number;
            value: number;
            marker: string;
          }[]
        ) => {
          if (!params.length) return "";
          const label = data[params[0]!.dataIndex]?.label ?? "";
          const rows = params
            .map((p) => {
              const seriesDef = multiSeries.find((s) => s.name === p.seriesName);
              const display = seriesDef?.displayValues?.[p.dataIndex];
              const valueText = display ?? `${p.value}${unit}`;
              return `${p.marker}${p.seriesName}: <b>${valueText}</b>`;
            })
            .join("<br/>");
          return `${label}<br/>${rows}`;
        },
      },
      grid: isVertical
        ? { left: 16, right: 16, top: 36, bottom: 36, containLabel: true }
        : { left: 64, right: 36, top: 36, bottom: 28 },
      xAxis: isVertical ? categoryAxis : valueAxis,
      yAxis: isVertical ? valueAxis : categoryAxis,
      series: echartsSeries,
    };

    return <ReactECharts option={option} style={{ height }} />;
  }

  const values = data.map((d) => d.value);
  const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  const seriesData = data.map((d) => ({
    value: d.value,
    itemStyle: {
      color: barColor(d.zScore, above, near, below, colorOverride),
      borderRadius: isVertical ? [radius, radius, 0, 0] : [0, radius, radius, 0],
    },
  }));

  const markLineData: ({ yAxis: number } | { xAxis: number })[] = [];
  const markLineFormatters: string[] = [];

  if (showAvgLine) {
    markLineData.push(isVertical ? { yAxis: Math.round(avg) } : { xAxis: Math.round(avg) });
    markLineFormatters.push(`avg ${Math.round(avg)}${unit}`);
  }
  if (targetValue != null && Number.isFinite(targetValue)) {
    markLineData.push(isVertical ? { yAxis: targetValue } : { xAxis: targetValue });
    markLineFormatters.push(`${targetLabel} ${targetValue}${unit}`);
  }

  const markLine =
    markLineData.length > 0
      ? {
          silent: true,
          symbol: "none" as const,
          lineStyle: { type: "dashed" as const, width: 1, color: color("text-secondary") },
          data: markLineData.map((point, i) => ({
            ...point,
            label: {
              show: true,
              formatter: markLineFormatters[i],
              fontSize: 10,
              position: "end" as const,
            },
          })),
        }
      : undefined;

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { dataIndex: number; value: number }[]) => {
        const p = params[0];
        const d = data[p.dataIndex];
        const zLine =
          d.zScore != null ? `<br/>z-score: <b>${d.zScore > 0 ? "+" : ""}${d.zScore}</b>` : "";
        const conv = d.dataLabel != null && d.dataLabel !== "" ? `<br/>${d.dataLabel}` : "";
        return `${d.label}<br/><b>${p.value}${unit}</b>${conv}${zLine}`;
      },
    },
    grid: isVertical
      ? { left: 16, right: 16, top: 28, bottom: 36, containLabel: true }
      : { left: 64, right: 28, top: 12, bottom: 28 },
    xAxis: isVertical ? categoryAxis : valueAxis,
    yAxis: isVertical ? valueAxis : categoryAxis,
    series: [
      {
        type: "bar",
        data: seriesData,
        barMaxWidth: isVertical ? CHART_BAR_MAX_WIDTH : 18,
        markLine,
        label: showDataLabels
          ? {
              show: true,
              position: isVertical ? "top" : "right",
              fontSize: 10,
              color: color("text-secondary"),
              formatter: (params: { dataIndex: number; value: number }) => {
                const d = data[params.dataIndex];
                if (d.dataLabel) return d.dataLabel;
                return `${params.value}${unit}`;
              },
            }
          : { show: false },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
