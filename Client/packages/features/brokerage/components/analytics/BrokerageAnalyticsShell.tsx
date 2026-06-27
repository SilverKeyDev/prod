import { useMemo } from "react";

import { color } from "packages/design-tokens";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import { useDealFailureForensics } from "packages/features/brokerage/hooks/useDealFailureForensics";
import { DonutChart, VerticalBarChart } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { AncillaryInsightPanel } from "./AncillaryInsightPanel";
import { TargetedAgentEngagementPanel } from "./TargetedAgentEngagementPanel";
import { AgentRetentionRiskPanel } from "./AgentRetentionRiskPanel"; 

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: string;
}) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-4">
      <BodyText size="xs" muted>
        {label}
      </BodyText>
      <Title size="lg">{value}</Title>
      {delta ? (
        <BodyText size="xs" muted className="mt-1">
          {delta}
        </BodyText>
      ) : null}
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-5">
      <Title size="sm" as="h3" className="mb-4">
        {title}
      </Title>
      {children}
    </Box>
  );
}

/** Brokerage analytics shell — populated with demo fixtures (SIL-202 will swap to real API). */
export function BrokerageAnalyticsShell() {
  const { data, agents, isLoading } = useBrokerageAnalytics();
  const { data: failureData } = useDealFailureForensics();

  const funnelBars = useMemo(
    () =>
      data.transactionFunnel.map((s) => ({
        label: s.stage,
        value: s.count,
        displayValue: String(s.count),
      })),
    [data]
  );

  const agentPerformanceBars = useMemo(
    () =>
      [...agents]
        .sort((a, b) => b.closings - a.closings)
        .slice(0, 8)
        .map((a) => ({
          label: a.name.split(" ")[0] ?? a.name,
          value: a.closings,
          displayValue: String(a.closings),
        })),
    [agents]
  );

  const agentStatusDonut = useMemo(
    () =>
      data.agentStatusBreakdown.map((s) => ({
        label: s.label,
        value: s.value,
        color: s.color,
      })),
    [data]
  );

  const failureTrendBars = useMemo(
    () =>
      failureData.trend.map((t) => ({
        label: t.month,
        value: t.cancelled,
        displayValue: String(t.cancelled),
      })),
    [failureData]
  );

  const failureStageBars = useMemo(
    () =>
      failureData.by_stage.map((s) => ({
        label: s.stage,
        value: s.count,
        displayValue: String(s.count),
      })),
    [failureData]
  );

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading analytics…</BodyText>
      </Box>
    );
  }

  const { overview } = data;
  const closingsDelta = overview.closingsThisMonth - overview.closingsLastMonth;
  const clientsDelta = overview.activeClientsThisMonth - overview.activeClientsLastMonth;

  return (
    <Box className="flex flex-col gap-6 p-6">
      {/* Header */}
      <Box>
        <Title size="md" as="h2">
          Brokerage Analytics
        </Title>
        <BodyText size="sm" muted className="mt-1">
          Demo data — synthetic figures only, no PII
        </BodyText>
      </Box>

      {/* KPI Cards */}
      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Agents" value={overview.activeAgents} />
        <KpiCard label="Open Transactions" value={overview.openTransactions} />
        <KpiCard
          label="Messaging SLA"
          value={`${overview.messagingSlaPercent}%`}
          delta="Response within 24h"
        />
        <KpiCard label="At-Risk Agents" value={overview.atRiskCount} delta="Stalled > 14 days" />
        <KpiCard
          label="Closings This Month"
          value={overview.closingsThisMonth}
          delta={`${closingsDelta >= 0 ? "+" : ""}${closingsDelta} vs last month`}
        />
        <KpiCard
          label="Active Clients"
          value={overview.activeClientsThisMonth}
          delta={`${clientsDelta >= 0 ? "+" : ""}${clientsDelta} vs last month`}
        />
      </Box>

      {/* Charts Row 1 */}
      <Box className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Transaction Funnel">
          <VerticalBarChart data={funnelBars} />
        </SectionCard>
        <SectionCard title="Agent Status Breakdown">
          <DonutChart data={agentStatusDonut} />
        </SectionCard>
      </Box>

      {/* Charts Row 2 */}
      <Box className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Messaging Activity (Last 7 Days)">
          <VerticalBarChart data={data.messagingActivity} />
        </SectionCard>
        <SectionCard title="Closings Trend (6 Months)">
          <VerticalBarChart data={data.closingsTrend} />
        </SectionCard>
      </Box>

      {/* Agent Performance Table */}
      <SectionCard title="Agent Performance">
        <Box className="mb-4">
          <VerticalBarChart data={agentPerformanceBars} />
        </Box>
        <Box className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Active Clients</th>
                <th className="py-2 pr-4">Closings</th>
                <th className="py-2 pr-4">Stall Stage</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-border/60 border-b">
                  <td className="py-2 pr-4 font-medium">{agent.name}</td>
                  <td className="py-2 pr-4">{agent.activeClients}</td>
                  <td className="py-2 pr-4">{agent.closings}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{agent.stall ?? "—"}</td>
                  <td className="py-2">
                    <span
                      className={
                        agent.status === "top"
                          ? "font-medium text-green-600"
                          : agent.status === "at_risk"
                            ? "font-medium text-red-500"
                            : "text-blue-500"
                      }
                    >
                      {agent.status === "top"
                        ? "Top Performer"
                        : agent.status === "at_risk"
                          ? "At Risk"
                          : "Healthy"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </SectionCard>

      {/* Ancillary Capture Leakage — SIL-277 */}
      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Ancillary Capture Leakage
        </Title>
        <BodyText size="xs" muted className="mb-4">
          Revenue leaking to outside title, lending, escrow, and home warranty vendors
        </BodyText>
        <AncillaryInsightPanel />
      </Box>

      {/* Deal Failure Forensics — SIL-281 */}
      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Deal Failure Forensics
        </Title>
        <BodyText size="xs" muted className="mb-4">
          Fall-through rate:{" "}
          <span className="font-medium text-red-500">
            {failureData.summary.fall_through_rate_percent}%
          </span>{" "}
          · {failureData.summary.total_cancelled} cancelled of{" "}
          {failureData.summary.total_transactions} transactions · avg{" "}
          {failureData.summary.avg_days_to_cancellation} days to cancellation
        </BodyText>

        {/* Trend + Stage charts */}
        <Box className="mb-6 grid gap-4 lg:grid-cols-2">
          <Box>
            <BodyText size="xs" muted className="mb-2">
              Cancellations by Month
            </BodyText>
            <VerticalBarChart data={failureTrendBars} />
          </Box>
          <Box>
            <BodyText size="xs" muted className="mb-2">
              Failure Stage Breakdown
            </BodyText>
            <VerticalBarChart data={failureStageBars} />
          </Box>
        </Box>

        {/* Agent leaderboard */}
        <BodyText size="xs" muted className="mb-2">
          Agent Fall-Through Rates
        </BodyText>
        <Box className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Total Deals</th>
                <th className="py-2 pr-4">Cancelled</th>
                <th className="py-2">Fall-Through Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...failureData.by_agent]
                .sort((a, b) => b.fall_through_rate_percent - a.fall_through_rate_percent)
                .map((agent) => (
                  <tr key={agent.agent_id} className="border-border/60 border-b">
                    <td className="py-2 pr-4 font-medium">{agent.name}</td>
                    <td className="py-2 pr-4">{agent.total_deals}</td>
                    <td className="py-2 pr-4">{agent.cancelled}</td>
                    <td className="py-2">
                      <span
                        className={
                          agent.fall_through_rate_percent >= 30
                            ? "font-medium text-red-500"
                            : agent.fall_through_rate_percent >= 15
                              ? "font-medium text-yellow-500"
                              : "font-medium text-green-600"
                        }
                      >
                        {agent.fall_through_rate_percent}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>

        {/* Lender leaderboard */}
        <BodyText size="xs" muted className="mb-2">
          Lender Fall-Through Rates
        </BodyText>
        <Box className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4">Lender</th>
                <th className="py-2 pr-4">Total Deals</th>
                <th className="py-2 pr-4">Cancelled</th>
                <th className="py-2">Fall-Through Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...failureData.by_lender]
                .sort((a, b) => b.fall_through_rate_percent - a.fall_through_rate_percent)
                .map((lender) => (
                  <tr key={lender.lender_name} className="border-border/60 border-b">
                    <td className="py-2 pr-4 font-medium">{lender.lender_name}</td>
                    <td className="py-2 pr-4">{lender.total_deals}</td>
                    <td className="py-2 pr-4">{lender.cancelled}</td>
                    <td className="py-2">
                      <span
                        className={
                          lender.fall_through_rate_percent >= 25
                            ? "font-medium text-red-500"
                            : lender.fall_through_rate_percent >= 15
                              ? "font-medium text-yellow-500"
                              : "font-medium text-green-600"
                        }
                      >
                        {lender.fall_through_rate_percent}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>

        {/* Price band table */}
        <BodyText size="xs" muted className="mb-2 mt-6">
          Fall-Through Rates by Price Band
        </BodyText>
        <Box className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4">Price Band</th>
                <th className="py-2 pr-4">Total Deals</th>
                <th className="py-2 pr-4">Cancelled</th>
                <th className="py-2">Fall-Through Rate</th>
              </tr>
            </thead>
            <tbody>
              {failureData.by_price_band.map((band) => (
                <tr key={band.band} className="border-border/60 border-b">
                  <td className="py-2 pr-4 font-medium">{band.band}</td>
                  <td className="py-2 pr-4">{band.total_deals}</td>
                  <td className="py-2 pr-4">{band.cancelled}</td>
                  <td className="py-2">
                    <span
                      className={
                        band.fall_through_rate_percent >= 25
                          ? "font-medium text-red-500"
                          : band.fall_through_rate_percent >= 15
                            ? "font-medium text-yellow-500"
                            : "font-medium text-green-600"
                      }
                    >
                      {band.fall_through_rate_percent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Targeted Agent Engagement — SIL-279 */}
      <TargetedAgentEngagementPanel />
      {/* Agent Retention Risk — SIL-278 */}
      <AgentRetentionRiskPanel />
    </Box>
  );
}