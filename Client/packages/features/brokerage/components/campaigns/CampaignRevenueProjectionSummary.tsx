import { useMemo } from "react";

import { color } from "packages/design-tokens";
import { AnalyticsLineChart } from "packages/features/brokerage/components/charts";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import type { CampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  projection: CampaignRevenueProjections;
};

export function CampaignRevenueProjectionSummary({ projection }: Props) {
  const yearSeries = useMemo(
    () =>
      projection.monthlyCumulative.map((point) => ({
        label: `M${point.month}`,
        value: point.cumulativeDollars,
      })),
    [projection.monthlyCumulative]
  );

  const rankedRows = useMemo(
    () => [...projection.rows].sort((a, b) => b.projectedDollars - a.projectedDollars),
    [projection.rows]
  );

  return (
    <Box
      className="border-border bg-background-surface flex w-full flex-col gap-4 rounded-xl border p-5 shadow-sm"
      data-testid="campaign-revenue-projection-summary"
    >
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        <Box className="min-w-0 shrink-0 sm:w-44">
          <BodyText size="sm" muted className="mb-1">
            Projected recovery
          </BodyText>
          <Box data-testid="campaign-revenue-projection-total">
            <Title size="xl" as="h2" className="!text-gold">
              {formatAncillaryDollars(projection.totalProjectedDollars)}
            </Title>
          </Box>
          <BodyText size="xs" muted className="mt-1">
            Sum of campaigns
          </BodyText>
        </Box>

        {rankedRows.length > 0 ? (
          <Box
            className="flex min-w-0 flex-1 flex-col gap-1.5"
            data-testid="campaign-revenue-projection-breakdown"
          >
            {rankedRows.map((row) => (
              <Box
                key={row.categoryId}
                className="flex items-baseline justify-between gap-3"
                data-testid={`campaign-revenue-projection-row-${row.categoryId}`}
              >
                <BodyText size="xs" className="min-w-0 truncate">
                  {row.label}
                </BodyText>
                <BodyText size="xs" muted className="shrink-0 tabular-nums">
                  {formatAncillaryDollars(row.projectedDollars)}
                </BodyText>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>

      <Box data-testid="campaign-revenue-projection-year-series">
        <AnalyticsLineChart
          data={yearSeries}
          height={140}
          color={color("gold.DEFAULT")}
          showConfidenceBand={false}
        />
      </Box>
    </Box>
  );
}
