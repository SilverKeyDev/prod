/**
 * AncillaryInsightPanel — SIL-277
 *
 * Presentational pieces for attach rates and agent opportunity leaderboard.
 * Leakage tab owns section hierarchy, KPI snapshot, and QuantMathStrip.
 */
import { useMemo } from "react";

import { Icon } from "@ui/icons";
import ReactECharts from "echarts-for-react";
import type { ReactNode } from "react";

import { color } from "packages/design-tokens";
import type { AncillaryAnalytics } from "packages/features/brokerage/types/analytics";
import { rateColorHighGood } from "packages/features/brokerage/utils/analytics/rateColor";
import {
  ANCILLARY_SERVICE_LABELS,
  formatAncillaryDollars,
} from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { AgentRowActions } from "./AgentRowActions";
import { AnalyticsDataTable } from "./AnalyticsDataTable";
import { SectionCard } from "./AnalyticsShellShared";

const SERVICE_COLORS: Record<string, string> = {
  title: color("state.success.DEFAULT"),
  lending: color("state.danger.DEFAULT"),
  escrow: color("state.warning.DEFAULT"),
  home_warranty: color("chart.1"),
  mortgage_insurance: color("chart.3"),
};

type ServiceData = AncillaryAnalytics["by_service"][number];

function AttachRatesChart({ services }: { services: ServiceData[] }) {
  const labels = services.map((s) => ANCILLARY_SERVICE_LABELS[s.service] ?? s.service);
  const dangerColor = color("state.danger.DEFAULT");
  const inHouseData = services.map((s) => ({
    value: parseFloat(s.attach_rate_percent.toFixed(1)),
    itemStyle: {
      color: SERVICE_COLORS[s.service] ?? color("chart.2"),
      borderRadius: [0, 3, 3, 0],
    },
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
        const label = ANCILLARY_SERVICE_LABELS[svc.service] ?? svc.service;
        return [
          `<b>${label}</b>`,
          `Current: <b>${svc.attach_rate_percent.toFixed(1)}%</b> (${svc.in_house_count} in-house)`,
          `Industry avg: <b>${svc.industry_avg_percent.toFixed(1)}%</b> · high: <b>${svc.industry_high_percent.toFixed(1)}%</b>`,
          `Opportunity to high: <b style="color:${dangerColor}">${formatAncillaryDollars(svc.opportunity_vs_high_dollars)}</b>`,
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
      splitLine: { lineStyle: { color: color("border-card-muted") } },
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

export function AncillaryAttachRatesCard({ services }: { services: ServiceData[] }) {
  return (
    <SectionCard title="Attach Rates by Service" iconName="bar-chart-2">
      <BodyText size="xs" muted className="mb-4">
        Hover any bar for current vs industry avg / high and opportunity to high
      </BodyText>
      <AttachRatesChart services={services} />
    </SectionCard>
  );
}

type LeaderboardProps = {
  data: AncillaryAnalytics;
  onViewAllAgents?: () => void;
};

export function AncillaryAgentLeaderboardCard({ data, onViewAllAgents }: LeaderboardProps) {
  const sortedAgents = useMemo(
    () =>
      [...data.by_agent]
        .map((agent, seedIndex) => ({ agent, seedIndex }))
        .sort((a, b) => {
          const dollarDiff = b.agent.total_leakage_dollars - a.agent.total_leakage_dollars;
          if (dollarDiff !== 0) return dollarDiff;
          return a.seedIndex - b.seedIndex;
        })
        .map(({ agent }) => agent),
    [data]
  );

  const dangerColor = color("state.danger.DEFAULT");

  return (
    <SectionCard title="Agent Opportunity Leaderboard" iconName="users">
      <Box className="mb-4 flex items-center justify-between gap-3">
        <BodyText size="xs" muted className="min-w-0">
          Agents sorted by opportunity to industry high (title + lending), highest coaching priority
        </BodyText>
        {onViewAllAgents ? (
          <Button type="button" variant="ghost" size="sm" onPress={onViewAllAgents}>
            View all agents
          </Button>
        ) : null}
      </Box>
      <AnalyticsDataTable
        rows={sortedAgents}
        rowKey={(agent) => agent.agent_id}
        columns={[
          {
            key: "agent",
            header: "Agent",
            render: (agent) => {
              const index = sortedAgents.findIndex((row) => row.agent_id === agent.agent_id);
              return (
                <Box className="flex items-center gap-2">
                  {index === 0 ? (
                    <Icon
                      name="trending-up"
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: dangerColor }}
                    />
                  ) : null}
                  <BodyText as="span" className="font-medium">
                    {agent.name}
                  </BodyText>
                </Box>
              );
            },
          },
          {
            key: "tx",
            header: "Transactions",
            render: (agent) => agent.transactions,
          },
          {
            key: "title",
            header: "Title Attach",
            render: (agent) => (
              <BodyText as="span" style={{ color: rateColorHighGood(agent.title_attach, 60, 40) }}>
                {agent.title_attach.toFixed(1)}%
              </BodyText>
            ),
          },
          {
            key: "lending",
            header: "Lending Attach",
            render: (agent) => (
              <BodyText
                as="span"
                style={{ color: rateColorHighGood(agent.lending_attach, 60, 40) }}
              >
                {agent.lending_attach.toFixed(1)}%
              </BodyText>
            ),
          },
          {
            key: "leakage",
            header: (
              <BodyText as="span" className="font-medium" style={{ color: dangerColor }}>
                Total opportunity
              </BodyText>
            ),
            cellClassName: "py-2 font-bold",
            render: (agent) => (
              <BodyText as="span" style={{ color: dangerColor }}>
                {formatAncillaryDollars(agent.total_leakage_dollars)}
              </BodyText>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (agent) => <AgentRowActions agentId={agent.agent_id} agentName={agent.name} />,
          },
        ]}
      />
    </SectionCard>
  );
}

type Props = {
  data: AncillaryAnalytics;
  /** Shown beside Attach Rates by Service on large screens. */
  revenueMix?: ReactNode;
  /** Opens the shared agent leaderboard modal (full roster). */
  onViewAllAgents?: () => void;
};

/** Composed charts + leaderboard (barrel / legacy). Leakage tab prefers the split cards. */
export function AncillaryInsightPanel({ data, revenueMix, onViewAllAgents }: Props) {
  return (
    <Box className="flex flex-col gap-6" data-testid="ancillary-panel">
      <Box className="grid gap-4 lg:grid-cols-2">
        <Box className="min-w-0">
          <AncillaryAttachRatesCard services={data.by_service} />
        </Box>
        {revenueMix ? <Box className="min-w-0">{revenueMix}</Box> : null}
      </Box>
      <AncillaryAgentLeaderboardCard data={data} onViewAllAgents={onViewAllAgents} />
    </Box>
  );
}
