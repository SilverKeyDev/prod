import { useMemo } from "react";

import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import { formatSignedLiftPp } from "packages/features/brokerage/utils/analyticsFormat";
import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import {
  buildVariantRateComparisonSeries,
  type VariantRateMetric,
} from "packages/features/brokerage/utils/campaigns/campaignVariantRateComparison";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type CampaignVariantComparisonChartsProps = {
  categoryId: string;
  emails: SampleEmail[];
};

type ChartBlock = {
  metric: VariantRateMetric;
  title: string;
  data: { label: string; value: number }[];
  series: ReturnType<typeof buildVariantRateComparisonSeries>["series"];
  liftVsControlPp: number | null;
  winnerName: string | null;
};

const CHARTS: { metric: VariantRateMetric; defaultTitle: string }[] = [
  { metric: "attach", defaultTitle: "Attach rate" },
  { metric: "open", defaultTitle: "Open rate" },
  { metric: "click", defaultTitle: "Click rate" },
];

function chartTitle(categoryId: string, metric: VariantRateMetric, defaultTitle: string): string {
  if (metric === "attach" && categoryId === "transaction_fall_off") {
    return "Keep rate";
  }
  return defaultTitle;
}

function VariantRateChart({ categoryId, chart }: { categoryId: string; chart: ChartBlock }) {
  return (
    <Box
      className="flex min-w-0 flex-col gap-2"
      data-testid={`campaign-variant-chart-${chart.metric}-${categoryId}`}
    >
      <Box className="flex flex-col gap-0.5">
        <Title size="sm" as="h3">
          {chart.title}
        </Title>
        <BodyText size="xs" muted>
          Variants compared week over week (%) · winner in gold
        </BodyText>
        {chart.liftVsControlPp != null && chart.winnerName ? (
          <BodyText
            size="xs"
            className="text-gold font-medium tabular-nums"
            data-testid={`campaign-lift-vs-control-${chart.metric}-${categoryId}`}
          >
            {chart.winnerName} vs Control at W{chart.data.length}:{" "}
            {formatSignedLiftPp(chart.liftVsControlPp)} pp
          </BodyText>
        ) : null}
      </Box>
      <AnalyticsLineChart
        data={chart.data}
        series={chart.series}
        height={200}
        showConfidenceBand={false}
        endLabels
      />
    </Box>
  );
}

export function CampaignVariantComparisonCharts({
  categoryId,
  emails,
}: CampaignVariantComparisonChartsProps) {
  const charts = useMemo(
    () =>
      CHARTS.map(({ metric, defaultTitle }) => {
        const comparison = buildVariantRateComparisonSeries(emails, metric);
        return {
          metric,
          title: chartTitle(categoryId, metric, defaultTitle),
          data: comparison.labels.map((label, index) => ({
            label,
            value: comparison.series[0]?.values[index] ?? 0,
          })),
          series: comparison.series,
          liftVsControlPp: comparison.liftVsControlPp,
          winnerName: comparison.winnerName,
        } satisfies ChartBlock;
      }),
    [categoryId, emails]
  );

  const attachChart = charts.find((c) => c.metric === "attach");
  const pairedCharts = charts.filter((c) => c.metric === "open" || c.metric === "click");

  if (emails.length === 0) {
    return null;
  }

  return (
    <Box
      className="flex w-full flex-col gap-4"
      data-testid={`campaign-variant-charts-${categoryId}`}
    >
      {attachChart ? <VariantRateChart categoryId={categoryId} chart={attachChart} /> : null}
      <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pairedCharts.map((chart) => (
          <VariantRateChart key={chart.metric} categoryId={categoryId} chart={chart} />
        ))}
      </Box>
    </Box>
  );
}
