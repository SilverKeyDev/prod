import { useMemo } from "react";

import { color } from "packages/design-tokens";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import { DonutChart, VerticalBarChart } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

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
    </Box>
  );
}
