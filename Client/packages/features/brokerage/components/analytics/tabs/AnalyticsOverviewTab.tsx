import { useMemo } from "react";

import { color } from "packages/design-tokens";
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsLineChart,
} from "packages/features/brokerage/components/charts";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import {
  selectDonut,
  selectFunnelBars,
  selectFunnelForecastBars,
  selectVolumeByStatusBars,
} from "packages/features/brokerage/utils/analytics/chartSelectors";
import {
  formatCompactCurrency,
  pacePercent,
} from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Box } from "packages/ui/components/structure/primitives";
import DashedDivider from "packages/ui/components/structure/primitives/divider/DashedDivider";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { AnalyticsDataTable } from "../AnalyticsDataTable";
import { CLOSINGS_LABEL, DELTA_LABEL, TREND_TITLE } from "../analyticsShellConstants";
import { KpiCard, SectionCard } from "../AnalyticsShellShared";

type Props = {
  timePeriod: TimePeriod;
};

const STATUS_LABEL: Record<"closed" | "pending" | "active", string> = {
  closed: "Closed",
  pending: "Pending",
  active: "Active",
};

export function AnalyticsOverviewTab({ timePeriod }: Props) {
  const { data, isLoading } = useBrokerageAnalytics(timePeriod);

  const funnelBars = useMemo(() => selectFunnelBars(data), [data]);
  const funnelForecastBars = useMemo(() => selectFunnelForecastBars(data), [data]);
  const volumeByStatusBars = useMemo(() => selectVolumeByStatusBars(data), [data]);
  const agentStatusDonut = useMemo(() => selectDonut(data.agentStatusBreakdown), [data]);
  const propertyClassDonut = useMemo(() => selectDonut(data.propertyClassBreakdown), [data]);
  const transactionSideDonut = useMemo(() => selectDonut(data.transactionSideBreakdown), [data]);

  const successColor = color("state.success.DEFAULT");
  const dangerColor = color("state.danger.DEFAULT");
  const chartColor1 = color("chart.1");
  const chartColor2 = color("chart.2");
  const chartColor3 = color("chart.3");

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading overview…</BodyText>
      </Box>
    );
  }

  const { overview, production } = data;
  const closingsDelta = overview.closingsThisMonth - overview.closingsLastMonth;
  const clientsDelta = overview.activeClientsThisMonth - overview.activeClientsLastMonth;
  const propertyClassTotal = propertyClassDonut.reduce((sum, s) => sum + s.value, 0);
  const transactionSideTotal = transactionSideDonut.reduce((sum, s) => sum + s.value, 0);

  const closedVolume =
    production.volumeByStatus.find((v) => v.status === "closed")?.volumeDollars ?? 0;
  const pendingVolume =
    production.volumeByStatus.find((v) => v.status === "pending")?.volumeDollars ?? 0;
  const activeVolume =
    production.volumeByStatus.find((v) => v.status === "active")?.volumeDollars ?? 0;

  const volumePace = pacePercent(production.goals.volumeActual, production.goals.volumeTarget);
  const gciPace = pacePercent(production.goals.gciActual, production.goals.gciTarget);
  const attachPace = pacePercent(
    production.goals.attachActualPercent,
    production.goals.attachTargetPercent
  );

  return (
    <Box className="flex flex-col gap-6" data-testid="analytics-overview-tab">
      <Box data-testid="overview-section-snapshot">
        <Title size="sm" as="h2" className="mb-4">
          Snapshot
        </Title>
        <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Active Agents" value={overview.activeAgents} />
          <KpiCard label="Open Transactions" value={overview.openTransactions.toLocaleString()} />
          <KpiCard label="At-Risk Agents" value={overview.atRiskCount} delta="Stalled > 14 days" />
          <KpiCard
            label={CLOSINGS_LABEL[timePeriod]}
            value={overview.closingsThisMonth.toLocaleString()}
            delta={`${closingsDelta >= 0 ? "+" : ""}${closingsDelta.toLocaleString()} ${DELTA_LABEL[timePeriod]}`}
          />
          <KpiCard
            label="Active Clients"
            value={overview.activeClientsThisMonth.toLocaleString()}
            delta={`${clientsDelta >= 0 ? "+" : ""}${clientsDelta.toLocaleString()} ${DELTA_LABEL[timePeriod]}`}
          />
        </Box>
      </Box>

      <DashedDivider className="my-2" />

      <Box data-testid="overview-section-production">
        <Title size="sm" as="h2" className="mb-4">
          Production
        </Title>
        <Box
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          data-testid="production-kpi-row"
        >
          <KpiCard label="Closed volume" value={formatCompactCurrency(closedVolume)} />
          <KpiCard label="Pending volume" value={formatCompactCurrency(pendingVolume)} />
          <KpiCard label="Active volume" value={formatCompactCurrency(activeVolume)} />
          <KpiCard
            label="GCI closed"
            value={formatCompactCurrency(production.gci.closed)}
            delta={`Pending ${formatCompactCurrency(production.gci.pending)} · Projected ${formatCompactCurrency(production.gci.projected)}`}
          />
          <KpiCard
            label="Avg commission / side"
            value={formatCompactCurrency(production.gci.avgCommissionPerSide)}
          />
          <KpiCard
            label="Avg sale price"
            value={formatCompactCurrency(production.pricing.avgSalePrice)}
            delta={`L2S ${(production.pricing.listToSaleRatio * 100).toFixed(1)}% · DOM ${production.pricing.avgDom}d`}
          />
        </Box>
      </Box>

      <DashedDivider className="my-2" />

      <SectionCard title="Goals & pacing">
        <Box className="grid gap-4 sm:grid-cols-3" data-testid="goals-pacing">
          <KpiCard
            label="Volume pace"
            value={`${volumePace}%`}
            delta={`${formatCompactCurrency(production.goals.volumeActual)} of ${formatCompactCurrency(production.goals.volumeTarget)}`}
          />
          <KpiCard
            label="GCI pace"
            value={`${gciPace}%`}
            delta={`${formatCompactCurrency(production.goals.gciActual)} of ${formatCompactCurrency(production.goals.gciTarget)}`}
          />
          <KpiCard
            label="Attach pace"
            value={`${attachPace}%`}
            delta={`${production.goals.attachActualPercent}% of ${production.goals.attachTargetPercent}% target`}
          />
        </Box>
      </SectionCard>

      <DashedDivider className="my-2" />

      <Box data-testid="overview-section-pipeline">
        <Title size="sm" as="h2" className="mb-4">
          Pipeline
        </Title>
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Transaction Funnel">
            <BodyText size="xs" muted className="mb-2">
              Stage counts
            </BodyText>
            <AnalyticsBarChart
              data={funnelBars}
              orientation="vertical"
              color={chartColor1}
              height={200}
            />
            <BodyText size="xs" muted className="mb-2 mt-4">
              Weighted pipeline forecast ($M)
            </BodyText>
            <AnalyticsBarChart
              data={funnelForecastBars}
              orientation="vertical"
              color={chartColor2}
              height={200}
              unit=""
            />
          </SectionCard>
          <SectionCard title="Sales volume by status">
            <AnalyticsBarChart
              data={volumeByStatusBars}
              orientation="vertical"
              color={successColor}
              height={280}
            />
          </SectionCard>
        </Box>
      </Box>

      <DashedDivider className="my-2" />

      <Box data-testid="overview-section-mix">
        <Title size="sm" as="h2" className="mb-4">
          Mix
        </Title>
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Agent Status Breakdown">
            <AnalyticsDonutChart
              data={agentStatusDonut}
              centerLabel={String(overview.activeAgents)}
              centerSub="active agents"
              height={280}
              colors={[successColor, chartColor1, dangerColor]}
            />
          </SectionCard>
          <SectionCard title="Property Class">
            <AnalyticsDonutChart
              data={propertyClassDonut}
              centerLabel={propertyClassTotal.toLocaleString()}
              centerSub="transactions"
              height={280}
              colors={[chartColor1, chartColor2]}
            />
          </SectionCard>
        </Box>
      </Box>

      <DashedDivider className="my-2" />

      <Box data-testid="overview-section-closings">
        <Title size="sm" as="h2" className="mb-4">
          Closings
        </Title>
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Representation Side">
            <AnalyticsDonutChart
              data={transactionSideDonut}
              centerLabel={transactionSideTotal.toLocaleString()}
              centerSub="transactions"
              height={280}
              colors={[successColor, chartColor1, chartColor3]}
            />
          </SectionCard>
          <SectionCard title={TREND_TITLE[timePeriod]}>
            <AnalyticsLineChart
              data={data.closingsTrend.map((d) => ({ label: d.label, value: d.value }))}
              height={280}
            />
          </SectionCard>
        </Box>
      </Box>

      <DashedDivider className="my-2" />

      <SectionCard title="Office production">
        <Box data-testid="office-production-table">
          <AnalyticsDataTable
            rows={production.officeRollups}
            rowKey={(office) => office.office}
            columns={[
              {
                key: "office",
                header: "Office",
                cellClassName: "py-2 pr-4 font-medium",
                render: (office) => office.office,
              },
              {
                key: "team",
                header: "Team",
                render: (office) => office.team ?? "—",
              },
              {
                key: "closed",
                header: "Closed $",
                render: (office) => formatCompactCurrency(office.volumeClosed),
              },
              {
                key: "pending",
                header: "Pending $",
                render: (office) => formatCompactCurrency(office.volumePending),
              },
              {
                key: "active",
                header: "Active $",
                render: (office) => formatCompactCurrency(office.volumeActive),
              },
              {
                key: "gciClosed",
                header: "GCI closed",
                render: (office) => formatCompactCurrency(office.gciClosed),
              },
              {
                key: "gciPending",
                header: "GCI pending",
                render: (office) => formatCompactCurrency(office.gciPending),
              },
              {
                key: "closings",
                header: "Closings",
                cellClassName: "py-2",
                render: (office) => office.closings.toLocaleString(),
              },
            ]}
          />
        </Box>
        <BodyText size="xs" muted className="mt-3">
          Status buckets: {STATUS_LABEL.closed} / {STATUS_LABEL.pending} / {STATUS_LABEL.active}{" "}
          volume rollups by office and team.
        </BodyText>
      </SectionCard>
    </Box>
  );
}
