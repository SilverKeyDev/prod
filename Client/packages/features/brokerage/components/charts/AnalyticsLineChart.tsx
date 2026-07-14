import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import { paddedValueDomain } from "packages/features/brokerage/utils/charts/paddedValueDomain";

export interface LineDataPoint {
  label: string;
  value: number;
  loBound?: number;
  hiBound?: number;
}

export type LineSeries = {
  name: string;
  values: number[];
  color: string;
  /** Override default stroke width (2). */
  lineWidth?: number;
  /** Larger symbols for emphasized series (e.g. winner). */
  symbolSize?: number;
  /** Dashed stroke for control / holdout. */
  lineType?: "solid" | "dashed";
  /** End-of-series label drawn at the last point. */
  endLabel?: string;
};

export type LineMarkPoint = {
  label: string;
  /** Category index (0-based) or category name matching x-axis. */
  xIndex: number;
  value: number;
};

interface Props {
  data: LineDataPoint[];
  height?: number;
  color?: string;
  showConfidenceBand?: boolean;
  /** When set, renders named multi-series lines; confidence band is ignored. */
  series?: LineSeries[];
  /** Soft area fill under a single-series line (ignored for multi-series / confidence band). */
  fillArea?: boolean;
  /** Hide point markers (density / area curves). */
  showSymbols?: boolean;
  /** Y-axis unit suffix in tooltips (e.g. " agents/yr"). */
  valueUnit?: string;
  /** Hide legend and use end labels / wider right grid (variant comparison). */
  endLabels?: boolean;
  /** Milestone markers for single-series money charts. */
  markPoints?: LineMarkPoint[];
  /** Label the final single-series point (e.g. "$786K"). */
  endValueLabel?: string;
}

export function AnalyticsLineChart({
  data,
  height = 240,
  color: colorOverride,
  showConfidenceBand = true,
  series: multiSeries,
  fillArea = false,
  showSymbols = true,
  valueUnit = "",
  endLabels = false,
  markPoints,
  endValueLabel,
}: Props) {
  const labels = data.map((d) => d.label);
  const isMulti = multiSeries != null && multiSeries.length > 0;

  if (isMulti) {
    const echartsSeries = multiSeries.map((s) => {
      const lastIndex = s.values.length - 1;
      return {
        name: s.name,
        type: "line" as const,
        data: s.values,
        smooth: 0.35,
        lineStyle: {
          color: s.color,
          width: s.lineWidth ?? 2,
          type: s.lineType === "dashed" ? ("dashed" as const) : ("solid" as const),
        },
        itemStyle: {
          color: s.color,
          borderColor: color("background-surface"),
          borderWidth: 2,
        },
        symbolSize: s.symbolSize ?? 5,
        z: (s.lineWidth ?? 2) > 2 ? 3 : 2,
        ...(endLabels && s.endLabel && lastIndex >= 0
          ? {
              label: {
                show: true,
                position: "right" as const,
                formatter: (params: { dataIndex: number }) =>
                  params.dataIndex === lastIndex ? s.endLabel! : "",
                fontSize: 11,
                color: s.color,
                distance: 6,
              },
            }
          : {}),
      };
    });

    const domain = paddedValueDomain(multiSeries.flatMap((s) => s.values));

    const option = {
      legend: endLabels
        ? { show: false }
        : {
            data: multiSeries.map((s) => s.name),
            top: 0,
            textStyle: { fontSize: 11 },
          },
      tooltip: {
        trigger: "axis",
        formatter: (
          params: { seriesName: string; name: string; value: number; marker: string }[]
        ) => {
          if (!params.length) return "";
          const header = params[0]!.name;
          const rows = params
            .map((p) => `${p.marker}${p.seriesName}: <b>${p.value}</b>`)
            .join("<br/>");
          return `${header}<br/>${rows}`;
        },
      },
      grid: {
        left: 46,
        right: endLabels ? 72 : 16,
        top: endLabels ? 16 : 36,
        bottom: 28,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 11 },
        axisLine: { lineStyle: { color: color("border-card-subtle") } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        scale: true,
        min: domain.min,
        max: domain.max,
        axisLabel: { fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: color("border-card-muted") } },
      },
      series: echartsSeries,
    };

    return <ReactECharts option={option} style={{ height }} />;
  }

  const lineColor = colorOverride ?? color("chart.1");
  const values = data.map((d) => d.value);
  const hasBand = showConfidenceBand && data.every((d) => d.loBound != null && d.hiBound != null);

  const series: object[] = [];

  if (hasBand) {
    series.push({
      type: "line",
      data: data.map((d) => d.loBound),
      lineStyle: { opacity: 0 },
      areaStyle: { color: "transparent" },
      symbol: "none",
      stack: "confidence",
      silent: true,
      tooltip: { show: false },
    });
    series.push({
      type: "line",
      data: data.map((d) => (d.hiBound ?? 0) - (d.loBound ?? 0)),
      lineStyle: { opacity: 0 },
      areaStyle: { color: `${lineColor}18` },
      symbol: "none",
      stack: "confidence",
      silent: true,
      tooltip: { show: false },
    });
  }

  const lastIndex = values.length - 1;
  const markPointData = [
    ...(markPoints ?? []).map((mp) => ({
      name: mp.label,
      coord: [labels[mp.xIndex] ?? mp.xIndex, mp.value] as [string | number, number],
      value: mp.value,
      label: {
        formatter: mp.label,
        position: "top" as const,
        fontSize: 11,
        color: lineColor,
      },
    })),
    ...(endValueLabel && lastIndex >= 0
      ? [
          {
            name: endValueLabel,
            coord: [labels[lastIndex]!, values[lastIndex]!] as [string, number],
            value: values[lastIndex]!,
            label: {
              formatter: endValueLabel,
              position: "right" as const,
              fontSize: 12,
              fontWeight: 600,
              color: lineColor,
            },
          },
        ]
      : []),
  ];

  series.push({
    type: "line",
    data: values,
    smooth: fillArea ? 0.45 : 0.35,
    lineStyle: { color: lineColor, width: 2 },
    itemStyle: {
      color: lineColor,
      borderColor: color("background-surface"),
      borderWidth: 2,
    },
    symbol: showSymbols ? "circle" : "none",
    symbolSize: showSymbols ? 5 : 0,
    z: 10,
    ...(fillArea && !hasBand
      ? {
          areaStyle: {
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${lineColor}55` },
                { offset: 1, color: `${lineColor}08` },
              ],
            },
          },
        }
      : {}),
    ...(markPointData.length > 0
      ? {
          markPoint: {
            symbol: "circle",
            symbolSize: 8,
            itemStyle: { color: lineColor },
            data: markPointData,
          },
        }
      : {}),
  });

  const domainValues = hasBand
    ? [...values, ...data.flatMap((d) => [d.loBound!, d.hiBound!])]
    : values;
  const domain = paddedValueDomain(domainValues);
  const yMin = fillArea ? 0 : domain.min;
  const labelInterval = labels.length > 16 ? Math.max(1, Math.floor(labels.length / 8)) : 0;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: { name: string; value: number; seriesIndex: number }[]) => {
        const main = params.find((p) => p.seriesIndex === series.length - 1);
        if (!main) return "";
        const unitSuffix = valueUnit ? ` ${valueUnit}` : "";
        return `${main.name}<br/><b>${main.value}</b>${unitSuffix}`;
      },
    },
    grid: {
      left: 46,
      right: endValueLabel ? 64 : 16,
      top: markPoints && markPoints.length > 0 ? 28 : 16,
      bottom: 28,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: fillArea ? false : true,
      axisLabel: {
        fontSize: 11,
        interval: labelInterval,
        color: color("text-secondary"),
      },
      axisLine: { lineStyle: { color: color("border-card-subtle") } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      scale: !fillArea,
      min: yMin,
      max: domain.max,
      axisLabel: { fontSize: 11, color: color("text-secondary") },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: color("border-card-muted") } },
    },
    series,
  };

  return <ReactECharts option={option} style={{ height }} />;
}
