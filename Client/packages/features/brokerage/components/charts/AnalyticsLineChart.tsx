import ReactECharts from 'echarts-for-react';
import { color } from 'packages/design-tokens';

export interface LineDataPoint {
  label: string;
  value: number;
  loBound?: number;
  hiBound?: number;
}

interface Props {
  data: LineDataPoint[];
  height?: number;
  color?: string;
  showConfidenceBand?: boolean;
}

export function AnalyticsLineChart({
  data,
  height = 240,
  color: colorOverride,
  showConfidenceBand = true,
}: Props) {
  const lineColor = colorOverride ?? color("chart.1");
  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);
  const hasBand =
    showConfidenceBand && data.every((d) => d.loBound != null && d.hiBound != null);

  const series: object[] = [];

  if (hasBand) {
    series.push({
      type: 'line',
      data: data.map((d) => d.loBound),
      lineStyle: { opacity: 0 },
      areaStyle: { color: 'transparent' },
      symbol: 'none',
      stack: 'confidence',
      silent: true,
      tooltip: { show: false },
    });
    series.push({
      type: 'line',
      data: data.map((d) => (d.hiBound ?? 0) - (d.loBound ?? 0)),
      lineStyle: { opacity: 0 },
      areaStyle: { color: `${lineColor}18` },
      symbol: 'none',
      stack: 'confidence',
      silent: true,
      tooltip: { show: false },
    });
  }

  series.push({
    type: 'line',
    data: values,
    smooth: 0.35,
    lineStyle: { color: lineColor, width: 2 },
    itemStyle: { color: lineColor, borderColor: '#fff', borderWidth: 2 },
    symbolSize: 5,
    z: 10,
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number; seriesIndex: number }[]) => {
        const main = params.find((p) => p.seriesIndex === series.length - 1);
        return main ? `${main.name}<br/><b>${main.value}</b>` : '';
      },
    },
    grid: { left: 46, right: 16, top: 16, bottom: 28 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(11,11,11,0.08)' } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(11,11,11,0.05)' } },
    },
    series,
  };

  return <ReactECharts option={option} style={{ height }} />;
}