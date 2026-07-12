import { useMemo } from "react";

import { color } from "packages/design-tokens";
import {
  AnalyticsBarChart,
  AnalyticsLineChart,
} from "packages/features/brokerage/components/charts";
import { useDealFailureForensics } from "packages/features/brokerage/hooks/useDealFailureForensics";
import {
  selectFailureStageBars,
  selectFailureTrendLine,
  selectMilestoneBars,
} from "packages/features/brokerage/utils/analytics/chartSelectors";
import { rateColorHighBad } from "packages/features/brokerage/utils/analytics/rateColor";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { AnalyticsDataTable } from "../AnalyticsDataTable";
import { KpiCard, SectionCard } from "../AnalyticsShellShared";
import { TransactionActivityDistribution } from "../TransactionActivityDistribution";

type Props = {
  timePeriod: TimePeriod;
};

type FallThroughRow = {
  id: string;
  name: string;
  total_deals: number;
  cancelled: number;
  fall_through_rate_percent: number;
};

export function AnalyticsForensicsTab({ timePeriod }: Props) {
  const { data: failureData, isLoading } = useDealFailureForensics(timePeriod);

  const failureTrendLine = useMemo(() => selectFailureTrendLine(failureData), [failureData]);
  const failureStageBars = useMemo(() => selectFailureStageBars(failureData), [failureData]);
  const milestoneBars = useMemo(() => selectMilestoneBars(failureData), [failureData]);

  const chartColor1 = color("chart.1");
  const dangerColor = color("state.danger.DEFAULT");

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading forensics…</BodyText>
      </Box>
    );
  }

  const { cycleTime } = failureData;

  const agentRows: FallThroughRow[] = [...failureData.by_agent]
    .sort((a, b) => b.fall_through_rate_percent - a.fall_through_rate_percent)
    .map((a) => ({
      id: a.agent_id,
      name: a.name,
      total_deals: a.total_deals,
      cancelled: a.cancelled,
      fall_through_rate_percent: a.fall_through_rate_percent,
    }));

  const lenderRows: FallThroughRow[] = [...failureData.by_lender]
    .sort((a, b) => b.fall_through_rate_percent - a.fall_through_rate_percent)
    .map((l) => ({
      id: l.lender_name,
      name: l.lender_name,
      total_deals: l.total_deals,
      cancelled: l.cancelled,
      fall_through_rate_percent: l.fall_through_rate_percent,
    }));

  const bandRows: FallThroughRow[] = failureData.by_price_band.map((b) => ({
    id: b.band,
    name: b.band,
    total_deals: b.total_deals,
    cancelled: b.cancelled,
    fall_through_rate_percent: b.fall_through_rate_percent,
  }));

  const fallThroughColumns = (nameHeader: string, high: number, mid: number) => [
    {
      key: "name",
      header: nameHeader,
      cellClassName: "py-2 pr-4 font-medium",
      render: (row: FallThroughRow) => row.name,
    },
    {
      key: "total",
      header: "Total Deals",
      render: (row: FallThroughRow) => row.total_deals.toLocaleString(),
    },
    {
      key: "cancelled",
      header: "Cancelled",
      render: (row: FallThroughRow) => row.cancelled,
    },
    {
      key: "rate",
      header: "Fall-Through Rate",
      cellClassName: "py-2",
      render: (row: FallThroughRow) => (
        <BodyText
          as="span"
          style={{
            color: rateColorHighBad(row.fall_through_rate_percent, high, mid),
            fontWeight: 500,
          }}
        >
          {row.fall_through_rate_percent}%
        </BodyText>
      ),
    },
  ];

  return (
    <Box className="flex flex-col gap-6" data-testid="analytics-forensics-tab">
      <SectionCard title="Contract-to-close">
        <Box className="mb-4 grid gap-4 sm:grid-cols-2" data-testid="cycle-time-kpis">
          <KpiCard
            label="Avg contract-to-close"
            value={`${cycleTime.avgContractToCloseDays} days`}
          />
          <KpiCard
            label="Median contract-to-close"
            value={`${cycleTime.medianContractToCloseDays} days`}
          />
        </Box>
        <BodyText size="xs" muted className="mb-2">
          Time in milestone (avg days)
        </BodyText>
        <AnalyticsBarChart
          data={milestoneBars}
          orientation="horizontal"
          color={chartColor1}
          height={220}
          unit=" days"
        />
      </SectionCard>

      <TransactionActivityDistribution chartColor={chartColor1} period={timePeriod} />

      <SectionCard title="Deal Failure Forensics">
        <BodyText size="xs" muted className="mb-4">
          Fall-through rate:{" "}
          <BodyText as="span" className="font-medium" style={{ color: dangerColor }}>
            {failureData.summary.fall_through_rate_percent}%
          </BodyText>{" "}
          · {failureData.summary.total_cancelled.toLocaleString()} cancelled of{" "}
          {failureData.summary.total_transactions.toLocaleString()} transactions · avg{" "}
          {failureData.summary.avg_days_to_cancellation} days to cancellation
        </BodyText>

        <Box className="mb-6 grid gap-4 lg:grid-cols-2">
          <Box>
            <BodyText size="xs" muted className="mb-2">
              Cancellations by Month
            </BodyText>
            <AnalyticsLineChart
              data={failureTrendLine}
              height={200}
              color={dangerColor}
              showConfidenceBand={false}
            />
          </Box>
          <Box>
            <BodyText size="xs" muted className="mb-2">
              Failure Stage Breakdown
            </BodyText>
            <AnalyticsBarChart
              data={failureStageBars}
              orientation="vertical"
              color={dangerColor}
              height={200}
            />
          </Box>
        </Box>

        <BodyText size="xs" muted className="mb-2">
          Agent Fall-Through Rates
        </BodyText>
        <Box className="mb-6">
          <AnalyticsDataTable
            rows={agentRows}
            rowKey={(r) => r.id}
            columns={fallThroughColumns("Agent", 30, 15)}
          />
        </Box>

        <BodyText size="xs" muted className="mb-2">
          Lender Fall-Through Rates
        </BodyText>
        <AnalyticsDataTable
          rows={lenderRows}
          rowKey={(r) => r.id}
          columns={fallThroughColumns("Lender", 25, 15)}
        />

        <BodyText size="xs" muted className="mb-2 mt-6">
          Fall-Through Rates by Price Band
        </BodyText>
        <AnalyticsDataTable
          rows={bandRows}
          rowKey={(r) => r.id}
          columns={fallThroughColumns("Price Band", 25, 15)}
        />
      </SectionCard>
    </Box>
  );
}
