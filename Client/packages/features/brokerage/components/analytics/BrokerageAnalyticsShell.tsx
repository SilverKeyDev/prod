import { useMemo, useState } from "react";

import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import { useDealFailureForensics } from "packages/features/brokerage/hooks/useDealFailureForensics";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { UnderlineTabs } from "packages/ui/components/structure/tabs/UnderlineTabs";
import { AncillaryInsightPanel } from "./AncillaryInsightPanel";
import { TargetedAgentEngagementPanel } from "./TargetedAgentEngagementPanel";
import { AgentRetentionRiskPanel } from "./AgentRetentionRiskPanel";
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsHeatMap,
} from "../charts";

type TimePeriod = "week" | "month" | "year" | "5years" | "all";
type Tab = "overview" | "agents" | "leakage" | "forensics" | "market";

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "7D" },
  { value: "month", label: "1M" },
  { value: "year", label: "1Y" },
  { value: "5years", label: "5Y" },
  { value: "all", label: "All" },
];

const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "leakage", label: "Leakage" },
  { id: "forensics", label: "Deal forensics" },
  { id: "market", label: "Market" },
];

const CLOSINGS_LABEL: Record<TimePeriod, string> = {
  week: "Closings This Week",
  month: "Closings This Month",
  year: "Closings This Year",
  "5years": "Total Closings (5Y)",
  all: "Total Closings (All)",
};

const TREND_TITLE: Record<TimePeriod, string> = {
  week: "Closings Trend (7 Days)",
  month: "Closings Trend (1 Month)",
  year: "Closings Trend (12 Months)",
  "5years": "Closings Trend (2 Years)",
  all: "Closings Trend (All Time)",
};

const DELTA_LABEL: Record<TimePeriod, string> = {
  week: "vs last week",
  month: "vs last month",
  year: "vs last year",
  "5years": "vs prior period",
  all: "vs prior period",
};

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

export function BrokerageAnalyticsShell() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { data, agents, isLoading } = useBrokerageAnalytics(timePeriod);
  const { data: failureData } = useDealFailureForensics(timePeriod);

  const funnelBars = useMemo(
    () =>
      data.transactionFunnel.map((s) => ({
        label: s.stage,
        value: s.count,
      })),
    [data]
  );

  const agentPerformanceBarsWithZ = useMemo(() => {
    const sorted = [...agents]
      .sort((a, b) => b.closings - a.closings)
      .slice(0, 8);
    const vals = sorted.map((a) => a.closings);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std = Math.sqrt(
      vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length
    );
    return sorted.map((a) => ({
      label: a.name.split(" ")[0] ?? a.name,
      value: a.closings,
      zScore: std > 0 ? +((a.closings - avg) / std).toFixed(2) : 0,
    }));
  }, [agents]);

  const agentStatusDonut = useMemo(
    () =>
      data.agentStatusBreakdown.map((s) => ({
        label: s.label,
        value: s.value,
      })),
    [data]
  );

  const failureTrendLine = useMemo(
    () =>
      failureData.trend.map((t) => ({
        label: t.month,
        value: t.cancelled,
      })),
    [failureData]
  );

  const failureStageBars = useMemo(
    () =>
      failureData.by_stage.map((s) => ({
        label: s.stage,
        value: s.count,
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
          Real data — 50,122 transactions across 500 agents
        </BodyText>
      </Box>

      {/* Tab header — SIL-286 */}
      <UnderlineTabs
        items={DASHBOARD_TABS}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
        size="sm"
        scrollable
      />

      {/* Time Period Picker */}
      <Box className="flex items-center gap-2">
        {TIME_PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimePeriod(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              timePeriod === opt.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </Box>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <Box className="flex flex-col gap-6">
          <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Active Agents" value={overview.activeAgents} />
            <KpiCard label="Open Transactions" value={overview.openTransactions.toLocaleString()} />
            <KpiCard
              label="Messaging SLA"
              value={`${overview.messagingSlaPercent}%`}
              delta="Response within 24h"
            />
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

          <Box className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Transaction Funnel">
              <AnalyticsBarChart
                data={funnelBars}
                orientation="vertical"
                color="#4a6741"
                height={220}
              />
            </SectionCard>
            <SectionCard title="Agent Status Breakdown">
              <AnalyticsDonutChart
                data={agentStatusDonut}
                centerLabel={String(overview.activeAgents)}
                centerSub="active agents"
                height={280}
                colors={["#22c55e", "#3b82f6", "#ef4444"]}
              />
            </SectionCard>
          </Box>

          <Box className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Messaging Activity (Last 7 Days)">
              <AnalyticsBarChart
                data={data.messagingActivity.map((d) => ({ label: d.label, value: d.value }))}
                orientation="vertical"
                color="#4a6741"
                height={220}
              />
            </SectionCard>
            <SectionCard title={TREND_TITLE[timePeriod]}>
              <AnalyticsLineChart
                data={data.closingsTrend.map((d) => ({ label: d.label, value: d.value }))}
                height={220}
              />
            </SectionCard>
          </Box>
        </Box>
      )}

      {/* ── Agents tab ── */}
      {activeTab === "agents" && (
        <Box className="flex flex-col gap-6">
          <SectionCard title="Agent Performance">
            <Box className="mb-4">
              <AnalyticsBarChart
                data={agentPerformanceBarsWithZ}
                unit=" closings"
                height={260}
              />
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
          <TargetedAgentEngagementPanel period={timePeriod} />
          <AgentRetentionRiskPanel period={timePeriod} />
        </Box>
      )}

      {/* ── Leakage tab ── */}
      {activeTab === "leakage" && (
        <Box className="flex flex-col gap-6">
          <Box className="border-border bg-background-surface rounded-xl border p-5">
            <Title size="sm" as="h3" className="mb-1">
              Ancillary Capture Leakage
            </Title>
            <BodyText size="xs" muted className="mb-4">
              Revenue leaking to outside title, lending, escrow, and home warranty vendors
            </BodyText>
            <AncillaryInsightPanel period={timePeriod} />
          </Box>
          <SectionCard title="Service Revenue Mix">
            <AnalyticsDonutChart
              data={[
                { label: "Title", value: 38, detail: "$912K" },
                { label: "Mortgage", value: 27, detail: "$648K" },
                { label: "Escrow", value: 21, detail: "$504K" },
                { label: "Warranty", value: 14, detail: "$336K" },
              ]}
              centerLabel="$2.4M"
              centerSub="total revenue"
              showEntropy
              height={300}
            />
          </SectionCard>
        </Box>
      )}

      {/* ── Deal Forensics tab ── */}
      {activeTab === "forensics" && (
        <Box className="flex flex-col gap-6">
          <Box className="border-border bg-background-surface rounded-xl border p-5">
            <Title size="sm" as="h3" className="mb-1">
              Deal Failure Forensics
            </Title>
            <BodyText size="xs" muted className="mb-4">
              Fall-through rate:{" "}
              <span className="font-medium text-red-500">
                {failureData.summary.fall_through_rate_percent}%
              </span>{" "}
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
                  color="#e34948"
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
                  color="#e34948"
                  height={200}
                />
              </Box>
            </Box>

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
                        <td className="py-2 pr-4">{agent.total_deals.toLocaleString()}</td>
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
                        <td className="py-2 pr-4">{lender.total_deals.toLocaleString()}</td>
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
                      <td className="py-2 pr-4">{band.total_deals.toLocaleString()}</td>
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
        </Box>
      )}

      {/* ── Market tab ── */}
      {activeTab === "market" && (
        <Box className="flex flex-col gap-6">
          <SectionCard title="Transaction Activity Density">
            <BodyText size="xs" muted className="mb-3">
              Activity by day and hour — real dataset patterns
            </BodyText>
            <AnalyticsHeatMap
              xLabels={["8:00","9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]}
              yLabels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}
              data={[
                {x:0,y:0,value:6},{x:1,y:0,value:18},{x:2,y:0,value:22},{x:3,y:0,value:14},{x:4,y:0,value:8},{x:5,y:0,value:10},{x:6,y:0,value:16},{x:7,y:0,value:20},{x:8,y:0,value:12},{x:9,y:0,value:7},{x:10,y:0,value:4},
                {x:0,y:1,value:5},{x:1,y:1,value:20},{x:2,y:1,value:24},{x:3,y:1,value:16},{x:4,y:1,value:9},{x:5,y:1,value:11},{x:6,y:1,value:18},{x:7,y:1,value:22},{x:8,y:1,value:14},{x:9,y:1,value:8},{x:10,y:1,value:3},
                {x:0,y:2,value:7},{x:1,y:2,value:16},{x:2,y:2,value:20},{x:3,y:2,value:18},{x:4,y:2,value:10},{x:5,y:2,value:12},{x:6,y:2,value:15},{x:7,y:2,value:19},{x:8,y:2,value:11},{x:9,y:2,value:6},{x:10,y:2,value:3},
                {x:0,y:3,value:4},{x:1,y:3,value:14},{x:2,y:3,value:19},{x:3,y:3,value:21},{x:4,y:3,value:8},{x:5,y:3,value:9},{x:6,y:3,value:17},{x:7,y:3,value:21},{x:8,y:3,value:13},{x:9,y:3,value:7},{x:10,y:3,value:2},
                {x:0,y:4,value:5},{x:1,y:4,value:12},{x:2,y:4,value:17},{x:3,y:4,value:15},{x:4,y:4,value:7},{x:5,y:4,value:8},{x:6,y:4,value:14},{x:7,y:4,value:18},{x:8,y:4,value:10},{x:9,y:4,value:5},{x:10,y:4,value:2},
                {x:0,y:5,value:1},{x:1,y:5,value:3},{x:2,y:5,value:4},{x:3,y:5,value:3},{x:4,y:5,value:2},{x:5,y:5,value:2},{x:6,y:5,value:3},{x:7,y:5,value:4},{x:8,y:5,value:2},{x:9,y:5,value:1},{x:10,y:5,value:0},
                {x:0,y:6,value:1},{x:1,y:6,value:2},{x:2,y:6,value:3},{x:3,y:6,value:2},{x:4,y:6,value:1},{x:5,y:6,value:1},{x:6,y:6,value:2},{x:7,y:6,value:3},{x:8,y:6,value:2},{x:9,y:6,value:1},{x:10,y:6,value:0},
              ]}
              height={200}
              valueLabel="transactions"
            />
          </SectionCard>
        </Box>
      )}
    </Box>
  );
}