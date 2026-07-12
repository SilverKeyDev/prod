/**
 * AncillaryInsightPanel — SIL-277
 *
 * Presentational panel for attach rates and dollar leakage.
 * Parent supplies data (Leakage tab owns the single useAncillaryAnalytics call).
 */
import { useMemo } from "react";

import ReactECharts from "echarts-for-react";

import { color } from "packages/design-tokens";
import type { AncillaryAnalytics } from "packages/features/brokerage/types/analytics";
import { rateColorHighGood } from "packages/features/brokerage/utils/analytics/rateColor";
import {
  ANCILLARY_SERVICE_LABELS,
  formatAncillaryDollars,
} from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { AnalyticsDataTable } from "./AnalyticsDataTable";

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
          `In-house: <b>${svc.attach_rate_percent.toFixed(1)}%</b> (${svc.in_house_count} transactions)`,
          `Outside: <b>${(100 - svc.attach_rate_percent).toFixed(1)}%</b> (${svc.outside_count} transactions)`,
          `Leakage: <b style="color:${dangerColor}">${formatAncillaryDollars(svc.leakage_dollars)}</b>`,
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

export function AncillaryInsightPanel({ data }: { data: AncillaryAnalytics }) {
  const sortedAgents = useMemo(
    () => [...data.by_agent].sort((a, b) => b.total_leakage_dollars - a.total_leakage_dollars),
    [data]
  );

  const dangerColor = color("state.danger.DEFAULT");

  return (
    <Box className="flex flex-col gap-6">
      <Box className="border-border-danger bg-background-surface rounded-xl border p-6">
        <BodyText size="sm" muted className="mb-1">
          Estimated Annual Revenue Leakage
        </BodyText>
        <Title size="xl" style={{ color: dangerColor }}>
          {formatAncillaryDollars(data.summary.total_leakage_dollars)}
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
        <AnalyticsDataTable
          rows={sortedAgents}
          rowKey={(agent) => agent.agent_id}
          columns={[
            {
              key: "agent",
              header: "Agent",
              render: (agent) => {
                const index = sortedAgents.indexOf(agent);
                return (
                  <Box className="flex items-center gap-2">
                    {index === 0 ? (
                      <BodyText
                        as="span"
                        size="xs"
                        className="font-bold"
                        style={{ color: dangerColor }}
                      >
                        ▲
                      </BodyText>
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
                <BodyText
                  as="span"
                  style={{ color: rateColorHighGood(agent.title_attach, 60, 40) }}
                >
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
                  Total Leakage
                </BodyText>
              ),
              cellClassName: "py-2 font-bold",
              render: (agent) => (
                <BodyText as="span" style={{ color: dangerColor }}>
                  {formatAncillaryDollars(agent.total_leakage_dollars)}
                </BodyText>
              ),
            },
          ]}
        />
      </Box>
    </Box>
  );
}
