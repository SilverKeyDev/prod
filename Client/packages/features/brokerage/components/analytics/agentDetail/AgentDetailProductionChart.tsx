import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import type { LineSeries } from "packages/features/brokerage/components/charts/AnalyticsLineChart";
import { Box } from "packages/ui/components/structure/primitives";

interface Props {
  productionSeries: LineSeries[];
}

export function AgentDetailProductionChart({ productionSeries }: Props) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Transform series data into chart format expected by AnalyticsLineChart
  const chartData = months.map((month, index) => ({
    label: month,
    value: productionSeries[0]?.values[index] ?? 0,
  }));

  return (
    <SectionCard title="Production Trend (12 Months)" iconName="trending-up">
      <Box className="h-64">
        <AnalyticsLineChart data={chartData} series={productionSeries} height={240} />
      </Box>
    </SectionCard>
  );
}
