import { AnalyticsBarChart, AnalyticsHeatMap } from "packages/features/brokerage/components/charts";
import { useActivityDistribution } from "packages/features/brokerage/hooks/useActivityDistribution";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type Props = {
  chartColor: string;
  period?: TimePeriod;
};

/**
 * Week / month / year transaction activity distributions for Deal Forensics.
 */
export function TransactionActivityDistribution({ chartColor, period = "all" }: Props) {
  const { data } = useActivityDistribution(period);
  const {
    weekHeatmap,
    monthBars,
    yearBars,
    showWeek,
    showMonth,
    showYear,
    weekXLabels,
    weekYLabels,
  } = data;

  return (
    <Box
      className="border-border bg-background-surface rounded-xl border p-5"
      data-testid="transaction-activity-distribution"
      data-period={period}
    >
      <Title size="sm" as="h3" className="mb-1">
        Transaction Activity Distribution
      </Title>
      <BodyText size="xs" muted className="mb-4">
        When deals close across a typical week, month, and year
      </BodyText>

      {showWeek ? (
        <>
          <BodyText size="xs" muted className="mb-2">
            Week (day × hour)
          </BodyText>
          <Box className="mb-6" data-testid="activity-week-heatmap">
            <AnalyticsHeatMap
              xLabels={weekXLabels}
              yLabels={weekYLabels}
              data={weekHeatmap}
              height={200}
              valueLabel="transactions"
            />
          </Box>
        </>
      ) : null}

      <Box className="grid gap-6 lg:grid-cols-2">
        {showMonth ? (
          <Box data-testid="activity-month-bars">
            <BodyText size="xs" muted className="mb-2">
              Month (day of month)
            </BodyText>
            <AnalyticsBarChart
              data={monthBars}
              orientation="vertical"
              color={chartColor}
              height={200}
            />
          </Box>
        ) : null}
        {showYear ? (
          <Box data-testid="activity-year-bars">
            <BodyText size="xs" muted className="mb-2">
              Year (month of year)
            </BodyText>
            <AnalyticsBarChart
              data={yearBars}
              orientation="vertical"
              color={chartColor}
              height={200}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
