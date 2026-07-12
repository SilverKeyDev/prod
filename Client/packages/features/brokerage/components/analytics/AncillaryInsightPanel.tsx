/**
 * AncillaryInsightPanel — SIL-277
 *
 * Primary sales document for the SkySlope engagement.
 * Shows exact attach rates and dollar leakage for title, lending,
 * escrow, and home warranty by agent and office.
 *
 * Background: Large brokerages set up joint ventures (JVs) with ancillary
 * service providers (title companies, lenders, escrow companies, home warranty).
 * When agents use outside vendors instead of the brokerage's in-house JV partners,
 * the brokerage loses that referral revenue. This panel quantifies that leakage.
 *
 * Attach rate = % of transactions that used in-house provider.
 * Leakage $ = transactions using outside vendor × estimated fee per service.
 *
 * TODO SIL-272: Numbers become real once SkySlope sync lands.
 * TODO SIL-211: Reuse this panel in brokerage performance dashboard.
 */
import { useMemo } from "react";

import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

const SERVICE_LABELS: Record<string, string> = {
  title: "Title Insurance",
  lending: "Lending / Mortgage",
  escrow: "Escrow",
  home_warranty: "Home Warranty",
  mortgage_insurance: "Mortgage Insurance",
};

const SERVICE_COLORS: Record<string, string> = {
  title: color("state.success.DEFAULT"),
  lending: color("state.danger.DEFAULT"),
  escrow: color("state.warning.DEFAULT"),
  home_warranty: color("chart.1"),
  mortgage_insurance: color("chart.3"),
};

function formatDollars(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function DemoDisclaimer() {
  return (
    <Box className="border-border-warning bg-background-warning rounded-lg border px-3 py-2">
      <BodyText size="xs" muted>
        ⚠️ Demo data — synthetic figures only. Real numbers populate once SkySlope sync completes.
      </BodyText>
    </Box>
  );
}

interface ServiceData {
  service: string;
  in_house_count: number;
  outside_count: number;
  attach_rate_percent: number;
  leakage_dollars: number;
  fee_assumption: number;
}

function AttachRatesChart({ services }: { services: ServiceData[] }) {
  const labels = services.map((s) => SERVICE_LABELS[s.service] ?? s.service);
  const dangerColor = color("state.danger.DEFAULT");
  const inHouseData = services.map((s) => ({
    value: parseFloat(s.attach_rate_percent.toFixed(1)),
    itemStyle: { color: SERVICE_COLORS[s.service] ?? color("chart.2"), borderRadius: [0, 3, 3, 0] },
  }));
  const outsideData = services.map((s) => ({
    value: parseFloat((100 - s.attach_rate_percent).toFixed(1)),
    itemStyle: { color: color("olive.muted"), borderRadius: [0, 3, 3, 0] },
  }));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "none" },
      formatter: (params: { seriesName: string; value: number; dataIndex: number }[]) => {
        const svc = services[params[0].dataIndex];
        const label = SERVICE_LABELS[svc.service] ?? svc.service;
        return [
          `<b>${label}</b>`,
          `In-house: <b>${svc.attach_rate_percent.toFixed(1)}%</b> (${svc.in_house_count} transactions)`,
          `Outside: <b>${(100 - svc.attach_rate_percent).toFixed(1)}%</b> (${svc.outside_count} transactions)`,
          `Leakage: <b style="color:${dangerColor}">${formatDollars(svc.leakage_dollars)}</b>`,
        ].join("<br/>");
      },
    },
    grid: { left: 130, right: 16, top: 8, bottom: 8 },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { fontSize: 10, formatter: "{value}%" },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(11,11,11,0.05)" } },
    },
    yAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    series: [
      { name: "In-house", type: "bar", stack: "attach", data: inHouseData, barMaxWidth: 20 },
      { name: "Outside", type: "bar", stack: "attach", data: outsideData, barMaxWidth: 20 },
    ],
  };

  return <ReactECharts option={option} style={{ height: services.length * 56 + 24 }} />;
}

export function AncillaryInsightPanel({
  period = "all",
}: {
  period?: import("packages/features/brokerage/hooks/useBrokerageAnalytics").TimePeriod;
}) {
  const { data, isLoading } = useAncillaryAnalytics(period);

  const sortedAgents = useMemo(
    () =>
      [...(data?.by_agent ?? [])].sort((a, b) => b.total_leakage_dollars - a.total_leakage_dollars),
    [data]
  );

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading ancillary data…</BodyText>
      </Box>
    );
  }

  if (!data) return null;

  const dangerColor = color("state.danger.DEFAULT");
  const successColor = color("state.success.DEFAULT");
  const warningColor = color("state.warning.DEFAULT");

  return (
    <Box className="flex flex-col gap-6">
      <DemoDisclaimer />

      <Box className="border-border-danger bg-background-surface rounded-xl border p-6">
        <BodyText size="sm" muted className="mb-1">
          Estimated Annual Revenue Leakage
        </BodyText>
        <Title size="xl" style={{ color: dangerColor }}>
          {formatDollars(data.summary.total_leakage_dollars)}
        </Title>
        <BodyText size="sm" muted className="mt-2">
          Across {data.total_transactions} transactions —{" "}
          {data.summary.avg_attach_rate_percent.toFixed(1)}% average in-house attach rate
        </BodyText>
        <BodyText size="xs" muted className="mt-1">
          Based on configurable fee assumptions per service category
        </BodyText>
      </Box>

      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Attach Rates by Service
        </Title>
        <BodyText size="xs" muted className="mb-4">
          Hover any bar to see in-house vs outside breakdown and leakage amount
        </BodyText>
        <AttachRatesChart services={data.by_service} />
      </Box>

      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-1">
          Agent Leakage Leaderboard
        </Title>
        <BodyText size="xs" muted className="mb-4">
          Agents sorted by total estimated leakage — highest opportunity for coaching
        </BodyText>
        <Box className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 pr-4 font-medium">Agent</th>
                <th className="py-2 pr-4 font-medium">Transactions</th>
                <th className="py-2 pr-4 font-medium">Title Attach</th>
                <th className="py-2 pr-4 font-medium">Lending Attach</th>
                <th className="py-2 font-medium" style={{ color: dangerColor }}>
                  Total Leakage
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAgents.map((agent, index) => (
                <tr key={agent.agent_id} className="border-border/60 border-b">
                  <td className="py-2 pr-4">
                    <Box className="flex items-center gap-2">
                      {index === 0 && (
                        <BodyText
                          as="span"
                          size="xs"
                          className="font-bold"
                          style={{ color: dangerColor }}
                        >
                          ▲
                        </BodyText>
                      )}
                      <BodyText as="span" size="sm" className="font-medium">
                        {agent.name}
                      </BodyText>
                    </Box>
                  </td>
                  <td className="py-2 pr-4">{agent.transactions}</td>
                  <td className="py-2 pr-4">
                    <BodyText
                      as="span"
                      size="sm"
                      style={{
                        color:
                          agent.title_attach >= 60
                            ? successColor
                            : agent.title_attach >= 40
                              ? warningColor
                              : dangerColor,
                      }}
                    >
                      {agent.title_attach.toFixed(1)}%
                    </BodyText>
                  </td>
                  <td className="py-2 pr-4">
                    <BodyText
                      as="span"
                      size="sm"
                      style={{
                        color:
                          agent.lending_attach >= 60
                            ? successColor
                            : agent.lending_attach >= 40
                              ? warningColor
                              : dangerColor,
                      }}
                    >
                      {agent.lending_attach.toFixed(1)}%
                    </BodyText>
                  </td>
                  <td className="py-2 font-bold" style={{ color: dangerColor }}>
                    {formatDollars(agent.total_leakage_dollars)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      <Box className="border-border rounded-xl border border-dashed p-4 text-center">
        <BodyText size="sm" muted>
          📋 Export functionality coming in SIL-277 v2 — screenshot this view for pitch decks
        </BodyText>
      </Box>
    </Box>
  );
}
