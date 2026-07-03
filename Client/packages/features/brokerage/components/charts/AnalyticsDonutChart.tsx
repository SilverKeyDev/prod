import ReactECharts from 'echarts-for-react';

export interface DonutSlice {
  label: string;
  value: number;
  /** Optional formatted string shown in tooltip, e.g. "$912K" */
  detail?: string;
}

interface Props {
  data: DonutSlice[];
  /** Text shown in center of the donut (large) */
  centerLabel?: string;
  /** Text shown below centerLabel (small) */
  centerSub?: string;
  height?: number;
  colors?: string[];
  /** Show Shannon entropy badge in the graphic layer */
  showEntropy?: boolean;
}

const DEFAULT_COLORS = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4'];

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
  colors = DEFAULT_COLORS,
  showEntropy = false,
}: Props) {
  const entropy = shannonEntropy(data);
  const maxEntropy = Math.log2(data.length);
  const entropyStr = entropy.toFixed(2);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number; percent: number }) => {
        const d = data[params.dataIndex];
        const detailLine = d.detail ? `<br/>${d.detail}` : '';
        return `${d.label}<br/><b>${params.percent}%</b>${detailLine}`;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '50%'],
        data: data.map((d, i) => ({
          value: d.value,
          name: d.label,
          itemStyle: { color: colors[i % colors.length] },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 4 },
        })),
        itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
      },
    ],
    graphic: [
      ...(centerLabel
        ? [
            {
              type: 'text',
              left: 'center',
              top: centerSub ? '39%' : '45%',
              style: {
                text: centerLabel,
                fill: 'inherit',
                fontSize: 18,
                fontWeight: '500',
                textAlign: 'center',
              },
            },
          ]
        : []),
      ...(centerSub
        ? [
            {
              type: 'text',
              left: 'center',
              top: '51%',
              style: {
                text: centerSub,
                fontSize: 11,
                textAlign: 'center',
              },
            },
          ]
        : []),
      ...(showEntropy
        ? [
            {
              type: 'text',
              right: 8,
              bottom: 8,
              style: {
                text: `H = ${entropyStr} / ${maxEntropy.toFixed(2)} bits`,
                fontSize: 10,
                textAlign: 'right',
              },
            },
          ]
        : []),
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}