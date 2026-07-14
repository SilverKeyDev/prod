import { useMemo } from "react";

import { color } from "packages/design-tokens";
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsFunnelChart,
  AnalyticsLineChart,
} from "packages/features/brokerage/components/charts";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import { selectAgentClosingsDensity } from "packages/features/brokerage/utils/analytics/agentPerformanceChartSelectors";
import {
  selectDonut,
  selectFunnelBars,
  selectFunnelConversions,
  selectFunnelForecastBars,
  selectVolumeByStatusBars,
} from "packages/features/brokerage/utils/analytics/chartSelectors";
import { buildLeakageMathExplanation } from "packages/features/brokerage/utils/analytics/leakageMathExplanation";
import {
  applyOfficeFilterToOverview,
  applyOfficeShareToAncillary,
  buildOverviewKpiExtras,
  officeClosingsShare,
} from "packages/features/brokerage/utils/analytics/overviewTransforms";
import {
  deltaToneForChange,
  formatCompactCurrency,
  formatDeltaCompact,
} from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { ANALYTICS_LEAKAGE_HREF } from "packages/features/brokerage/utils/campaigns/campaignMathExplanation";
import { Link } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { AnalyticsDataTable } from "../AnalyticsDataTable";
import { AnalyticsMotionSection } from "../AnalyticsMotionSection";
import { CLOSINGS_LABEL, DELTA_LABEL, TREND_TITLE } from "../analyticsShellConstants";
import { KpiCard, PaceKpiCard, SectionCard, SectionHeading } from "../AnalyticsShellShared";

type Props = {
  timePeriod: TimePeriod;
  /** Demo office filter; null/empty = all offices. */
  officeId?: string | null;
};

const STATUS_LABEL: Record<"closed" | "pending" | "active", string> = {
  closed: "Closed",
  pending: "Pending",
  active: "Active",
};

export function AnalyticsOverviewTab({ timePeriod, officeId = null }: Props) {
  const { data: rawData, agents: rawAgents, isLoading } = useBrokerageAnalytics(timePeriod);
  const { data: ancillaryRaw } = useAncillaryAnalytics(timePeriod);

  const data = useMemo(() => applyOfficeFilterToOverview(rawData, officeId), [rawData, officeId]);

  const ancillaryShare = useMemo(
    () => officeClosingsShare(rawData.production.officeRollups, officeId),
    [rawData.production.officeRollups, officeId]
  );

  const ancillary = useMemo(
    () => applyOfficeShareToAncillary(ancillaryRaw, ancillaryShare),
    [ancillaryRaw, ancillaryShare]
  );

  const ancillaryTeaser = useMemo(
    () => buildLeakageMathExplanation(ancillary, timePeriod),
    [ancillary, timePeriod]
  );

  const scopedAgents = useMemo(() => {
    if (!officeId) return rawAgents;
    return rawAgents.filter((agent) => agent.office === officeId);
  }, [rawAgents, officeId]);

  const funnelBars = useMemo(() => selectFunnelBars(data), [data]);
  const funnelConversions = useMemo(() => selectFunnelConversions(data), [data]);
  const funnelForecastBars = useMemo(() => selectFunnelForecastBars(data), [data]);
  const volumeByStatusBars = useMemo(() => selectVolumeByStatusBars(data), [data]);
  const agentStatusDonut = useMemo(() => selectDonut(data.agentStatusBreakdown), [data]);
  const propertyClassDonut = useMemo(() => selectDonut(data.propertyClassBreakdown), [data]);
  const transactionSideDonut = useMemo(() => selectDonut(data.transactionSideBreakdown), [data]);
  const closingsDensity = useMemo(
    () => selectAgentClosingsDensity(scopedAgents, timePeriod),
    [scopedAgents, timePeriod]
  );
  const kpiExtras = useMemo(() => buildOverviewKpiExtras(data, timePeriod), [data, timePeriod]);

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

  const closedDelta = closedVolume - kpiExtras.closedVolumePrior;
  const pendingDelta = pendingVolume - kpiExtras.pendingVolumePrior;
  const activeDelta = activeVolume - kpiExtras.activeVolumePrior;
  const gciDelta = production.gci.closed - kpiExtras.gciClosedPrior;

  const officeRows = production.officeRollups;
  const periodDeltaLabel = DELTA_LABEL[timePeriod];
  const officeLabel = officeId ?? "All offices";

  return (
    <Box className="flex flex-col gap-8" data-testid="analytics-overview-tab">
      {officeId ? (
        <BodyText size="xs" muted className="tabular-nums" data-testid="overview-office-scope">
          Scoped to {officeLabel}
        </BodyText>
      ) : null}

      <AnalyticsMotionSection index={0} testId="overview-section-snapshot">
        <SectionHeading title="Snapshot" iconName="activity" />
        <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Active Agents" value={overview.activeAgents} iconName="users" />
          <KpiCard
            label="Open Transactions"
            value={overview.openTransactions.toLocaleString()}
            iconName="clipboard-check"
          />
          <KpiCard
            label="At-Risk Agents"
            value={overview.atRiskCount}
            delta="Stalled > 14 days"
            iconName="alert-triangle"
          />
          <KpiCard
            label={CLOSINGS_LABEL[timePeriod]}
            value={overview.closingsThisMonth.toLocaleString()}
            delta={formatDeltaCompact(closingsDelta, { suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(closingsDelta)}
            sparkline={kpiExtras.closingsSparkline}
            iconName="check-circle"
          />
          <KpiCard
            label="Active Clients"
            value={overview.activeClientsThisMonth.toLocaleString()}
            delta={formatDeltaCompact(clientsDelta, { suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(clientsDelta)}
            sparkline={kpiExtras.clientsSparkline}
            iconName="user"
          />
        </Box>
        <Box className="mt-4" data-testid="overview-snapshot-closings-density">
          <SectionCard title="Agents by closings / year" iconName="users">
            <AnalyticsLineChart
              data={closingsDensity}
              height={220}
              color={chartColor1}
              fillArea
              showSymbols={false}
              showConfidenceBand={false}
              valueUnit="agents per closings/yr"
            />
          </SectionCard>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={1} testId="overview-section-ancillary">
        <Box
          className="border-state-danger/30 bg-background-surface flex flex-col gap-3 rounded-xl border p-5 shadow-sm"
          data-testid="overview-ancillary-teaser"
        >
          <SectionHeading title="Ancillary opportunity" iconName="trending-up" />
          <Box className="flex flex-wrap items-end justify-between gap-4">
            <Box className="min-w-0">
              <BodyText size="xs" muted>
                {ancillaryTeaser.hero.label}
              </BodyText>
              <Title
                size="xl"
                as="h2"
                className="tabular-nums"
                style={{ color: color("state.danger.DEFAULT") }}
              >
                {ancillaryTeaser.hero.value}
              </Title>
              {ancillaryTeaser.hero.secondaryValue ? (
                <BodyText size="sm" muted className="mt-1 tabular-nums">
                  {ancillaryTeaser.hero.secondaryLabel}: {ancillaryTeaser.hero.secondaryValue}
                </BodyText>
              ) : null}
            </Box>
            <BodyText size="sm">
              <Link to={ANALYTICS_LEAKAGE_HREF} className="underline underline-offset-2">
                Open Leakage for attach-by-category →
              </Link>
            </BodyText>
          </Box>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={2} testId="overview-section-goals">
        <SectionCard title="Goals & pacing" iconName="target">
          <Box className="grid gap-4 sm:grid-cols-3" data-testid="goals-pacing">
            <PaceKpiCard
              metricLabel="Volume"
              actualDisplay={formatCompactCurrency(production.goals.volumeActual)}
              targetDisplay={formatCompactCurrency(production.goals.volumeTarget)}
              actual={production.goals.volumeActual}
              target={production.goals.volumeTarget}
              iconName="bar-chart-2"
            />
            <PaceKpiCard
              metricLabel="GCI"
              actualDisplay={formatCompactCurrency(production.goals.gciActual)}
              targetDisplay={formatCompactCurrency(production.goals.gciTarget)}
              actual={production.goals.gciActual}
              target={production.goals.gciTarget}
              iconName="trending-up"
            />
            <PaceKpiCard
              metricLabel="Attach rate"
              actualDisplay={`${production.goals.attachActualPercent}%`}
              targetDisplay={`${production.goals.attachTargetPercent}%`}
              actual={production.goals.attachActualPercent}
              target={production.goals.attachTargetPercent}
              iconName="link-2"
              unitIsPercent
            />
          </Box>
        </SectionCard>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={3} testId="overview-section-production">
        <SectionHeading title="Production" iconName="dollar-sign" />
        <Box
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          data-testid="production-kpi-row"
        >
          <KpiCard
            label="Closed volume"
            value={formatCompactCurrency(closedVolume)}
            delta={formatDeltaCompact(closedDelta, { asCurrency: true, suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(closedDelta)}
            sparkline={kpiExtras.volumeSparkline}
            iconName="check-circle"
          />
          <KpiCard
            label="Pending volume"
            value={formatCompactCurrency(pendingVolume)}
            delta={formatDeltaCompact(pendingDelta, { asCurrency: true, suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(pendingDelta)}
            iconName="clock"
          />
          <KpiCard
            label="Active volume"
            value={formatCompactCurrency(activeVolume)}
            delta={formatDeltaCompact(activeDelta, { asCurrency: true, suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(activeDelta)}
            iconName="activity"
          />
          <KpiCard
            label="GCI closed"
            value={formatCompactCurrency(production.gci.closed)}
            delta={formatDeltaCompact(gciDelta, { asCurrency: true, suffix: periodDeltaLabel })}
            deltaTone={deltaToneForChange(gciDelta)}
            iconName="dollar-sign"
          />
          <KpiCard
            label="Avg commission / side"
            value={formatCompactCurrency(production.gci.avgCommissionPerSide)}
            iconName="receipt"
          />
          <KpiCard
            label="Avg sale price"
            value={formatCompactCurrency(production.pricing.avgSalePrice)}
            delta={`L2S ${(production.pricing.listToSaleRatio * 100).toFixed(1)}% · DOM ${production.pricing.avgDom}d`}
            iconName="home"
          />
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={4} testId="overview-section-pipeline">
        <SectionHeading title="Pipeline" iconName="bar-chart-2" />
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Transaction Funnel" iconName="activity">
            <BodyText size="xs" muted className="mb-2">
              Stage counts · conversion between stages
            </BodyText>
            <Box className="mb-3 flex flex-wrap gap-2">
              {funnelConversions.map((chip) => (
                <BodyText
                  key={`${chip.from}-${chip.to}`}
                  size="xs"
                  className="border-border bg-background rounded-md border px-2 py-0.5 tabular-nums"
                >
                  {chip.from}→{chip.to} {chip.conversionPercent}%
                </BodyText>
              ))}
            </Box>
            <AnalyticsFunnelChart data={funnelBars} height={220} />
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
          <SectionCard title="Sales volume by status" iconName="dollar-sign">
            <AnalyticsBarChart
              data={volumeByStatusBars}
              orientation="vertical"
              color={successColor}
              height={280}
            />
          </SectionCard>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={5} testId="overview-section-mix">
        <SectionHeading title="Mix" iconName="grid-3x3" />
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Agent Status Breakdown" iconName="users">
            <AnalyticsDonutChart
              data={agentStatusDonut}
              centerLabel={String(overview.activeAgents)}
              centerSub="active agents"
              height={280}
              colors={[successColor, chartColor1, dangerColor]}
            />
          </SectionCard>
          <SectionCard title="Property Class" iconName="building-2">
            <AnalyticsDonutChart
              data={propertyClassDonut}
              centerLabel={propertyClassTotal.toLocaleString()}
              centerSub="transactions"
              height={280}
              colors={[chartColor1, chartColor2]}
            />
          </SectionCard>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={6} testId="overview-section-closings">
        <SectionHeading title="Closings" iconName="check-circle" />
        <Box className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Representation Side" iconName="handshake">
            <AnalyticsDonutChart
              data={transactionSideDonut}
              centerLabel={transactionSideTotal.toLocaleString()}
              centerSub="transactions"
              height={280}
              colors={[successColor, chartColor1, chartColor3]}
            />
          </SectionCard>
          <SectionCard title={TREND_TITLE[timePeriod]} iconName="trending-up">
            <AnalyticsLineChart
              data={data.closingsTrend.map((d) => ({ label: d.label, value: d.value }))}
              height={280}
            />
          </SectionCard>
        </Box>
      </AnalyticsMotionSection>

      <AnalyticsMotionSection index={7}>
        <SectionCard title="Office production" iconName="building">
          <Box data-testid="office-production-table">
            <AnalyticsDataTable
              rows={officeRows}
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
                  render: (office) => office.team ?? "-",
                },
                {
                  key: "closed",
                  header: "Closed $",
                  cellClassName: "tabular-nums",
                  render: (office) => formatCompactCurrency(office.volumeClosed),
                },
                {
                  key: "pending",
                  header: "Pending $",
                  cellClassName: "tabular-nums",
                  render: (office) => formatCompactCurrency(office.volumePending),
                },
                {
                  key: "active",
                  header: "Active $",
                  cellClassName: "tabular-nums",
                  render: (office) => formatCompactCurrency(office.volumeActive),
                },
                {
                  key: "gciClosed",
                  header: "GCI closed",
                  cellClassName: "tabular-nums",
                  render: (office) => formatCompactCurrency(office.gciClosed),
                },
                {
                  key: "gciPending",
                  header: "GCI pending",
                  cellClassName: "tabular-nums",
                  render: (office) => formatCompactCurrency(office.gciPending),
                },
                {
                  key: "closings",
                  header: "Closings",
                  cellClassName: "py-2 tabular-nums",
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
      </AnalyticsMotionSection>
    </Box>
  );
}
