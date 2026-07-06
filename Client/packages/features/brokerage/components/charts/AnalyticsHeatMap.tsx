import ReactECharts from 'echarts-for-react';

export interface HeatMapCell {
  /** Index into xLabels */
  x: number;
  /** Index into yLabels */
  y: number;
  value: number;
}

interface Props {
  xLabels: string[];
  yLabels: string[];
  data: HeatMapCell[];
  height?: number;
  /** Tooltip label for the value axis, e.g. "transactions" */
  valueLabel?: string;
  colorLow?: string;
  colorHigh?: string;
}

export function AnalyticsHeatMap({
  xLabels,
  yLabels,
  data,
  height = 200,
  valueLabel = 'transactions',
  colorLow = '#e8f1fb',
  colorHigh = '#2a78d6',
}: Props) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: { data: [number, number, number] }) => {
        const [x, y, v] = params.data;
        return `${yLabels[y]} ${xLabels[x]}<br/><b>${v}</b> ${valueLabel}`;
      },
    },
    grid: { left: 44, right: 16, top: 10, bottom: 28 },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitArea: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
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
      inRange: { color: [colorLow, colorHigh] },
    },
    series: [
      {
        type: 'heatmap',
        data: data.map((d) => [d.x, d.y, d.value]),
        label: { show: false },
        itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 2 },
        emphasis: { itemStyle: { borderColor: '#2a78d6', borderWidth: 2 } },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
