/**
 * AgentRetentionRiskPanel — SIL-278
 *
 * Shows brokerage admins which agents are flight risks and which are
 * over-compensated relative to production volume.
 */
import { useState } from "react";

import { useAgentRetentionRisk } from "packages/features/brokerage/hooks/useAgentRetentionRisk";
import type { AgentRetentionRisk } from "packages/features/brokerage/types/analytics";
import { exportAnalyticsCsv } from "packages/features/brokerage/utils/analytics/exportCsv";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { AnalyticsDataTable } from "./AnalyticsDataTable";
import { SectionCard } from "./AnalyticsShellShared";

type RiskTier = "flight_risk" | "watch" | "stable" | "over_comp";
type RetentionAgent = AgentRetentionRisk["agents"][number];

const TIER_LABELS: Record<RiskTier, string> = {
  flight_risk: "Flight Risk",
  watch: "Watch",
  stable: "Stable",
  over_comp: "Over-Comp",
};

const TIER_STYLES: Record<RiskTier, string> = {
  flight_risk: "bg-red-100 text-red-700",
  watch: "bg-yellow-100 text-yellow-700",
  stable: "bg-green-100 text-green-700",
  over_comp: "bg-purple-100 text-purple-700",
};

const TIER_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Flight Risk", value: "flight_risk" },
  { label: "Watch", value: "watch" },
  { label: "Stable", value: "stable" },
  { label: "Over-Comp", value: "over_comp" },
];

function exportRetentionCsv(rows: RetentionAgent[]) {
  exportAnalyticsCsv(
    "agent-retention-risk.csv",
    [
      "Name",
      "Office",
      "Transactions",
      "Est. GCI ($)",
      "Current Split %",
      "Market Benchmark %",
      "Split Gap",
      "Risk Score",
      "Risk Tier",
      "Percentile",
      "Recommended Action",
    ],
    rows.map((a) => [
      a.name,
      a.office,
      a.total_transactions,
      a.estimated_gci,
      a.current_split_percent,
      a.market_benchmark_split_percent,
      a.split_gap,
      a.risk_score,
      a.risk_tier,
      a.peer_production_percentile,
      `"${a.recommended_action}"`,
    ])
  );
}

export function AgentRetentionRiskPanel({ period = "all" }: { period?: TimePeriod }) {
  const { data, isLoading, error } = useAgentRetentionRisk(period);
  const [tierFilter, setTierFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <SectionCard title="Agent Retention Risk">
        <BodyText size="sm" muted>
          Loading retention risk data...
        </BodyText>
      </SectionCard>
    );
  }

  if (error || !data) {
    return (
      <SectionCard title="Agent Retention Risk">
        <BodyText size="sm" muted>
          Failed to load retention risk data.
        </BodyText>
      </SectionCard>
    );
  }

  const filtered =
    tierFilter === "all" ? data.agents : data.agents.filter((a) => a.risk_tier === tierFilter);

  return (
    <SectionCard title="Agent Retention Risk">
      <Box className="mb-4 flex items-start justify-between gap-4">
        <BodyText size="sm" muted>
          Cross-references production volume against split structures to flag flight risks and
          over-compensated agents.
        </BodyText>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onPress={() => exportRetentionCsv(filtered)}
          className="shrink-0"
        >
          Export CSV
        </Button>
      </Box>

      <Box className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Box className="border-border bg-background-surface rounded-lg border p-4">
          <BodyText size="xs" muted className="uppercase tracking-wide">
            Flight Risk
          </BodyText>
          <Title size="lg" className="mt-1">
            {data.summary.flight_risk_count}
          </Title>
          <BodyText size="xs" muted className="mt-1">
            ${data.summary.estimated_at_risk_gci.toLocaleString()} GCI at risk
          </BodyText>
        </Box>
        <Box className="border-border bg-background-surface rounded-lg border p-4">
          <BodyText size="xs" muted className="uppercase tracking-wide">
            Watch
          </BodyText>
          <Title size="lg" className="mt-1">
            {data.summary.watch_count}
          </Title>
        </Box>
        <Box className="border-border bg-background-surface rounded-lg border p-4">
          <BodyText size="xs" muted className="uppercase tracking-wide">
            Stable
          </BodyText>
          <Title size="lg" className="mt-1">
            {data.summary.stable_count}
          </Title>
        </Box>
        <Box className="border-border bg-background-surface rounded-lg border p-4">
          <BodyText size="xs" muted className="uppercase tracking-wide">
            Over-Comp
          </BodyText>
          <Title size="lg" className="mt-1">
            {data.summary.over_comp_count}
          </Title>
        </Box>
      </Box>

      <Box className="border-border bg-background-muted mb-4 rounded-lg border px-4 py-3">
        <BodyText size="xs" muted>
          <BodyText as="span" size="xs" className="font-medium">
            Methodology:{" "}
          </BodyText>
          {data.methodology}
        </BodyText>
      </Box>

      <Box className="mb-4 flex flex-wrap gap-2">
        {TIER_FILTERS.map((f) => (
          <Button
            key={f.value}
            type="button"
            variant={tierFilter === f.value ? "primary" : "ghost"}
            size="sm"
            onPress={() => setTierFilter(f.value)}
            className={
              tierFilter === f.value
                ? "rounded-full"
                : "rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          >
            {f.label}
          </Button>
        ))}
      </Box>

      <AnalyticsDataTable
        rows={filtered}
        rowKey={(agent) => agent.agent_id}
        emptyMessage="No agents in this tier."
        columns={[
          {
            key: "agent",
            header: "Agent",
            render: (agent) => (
              <Box>
                <BodyText className="font-medium">{agent.name}</BodyText>
                <BodyText size="xs" muted className="mt-0.5">
                  {agent.office}
                </BodyText>
                <BodyText size="xs" muted className="mt-0.5 italic">
                  {agent.recommended_action}
                </BodyText>
              </Box>
            ),
          },
          {
            key: "gci",
            header: "GCI",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => `$${agent.estimated_gci.toLocaleString()}`,
          },
          {
            key: "split",
            header: "Their Split",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right font-medium",
            render: (agent) => `${agent.current_split_percent}%`,
          },
          {
            key: "market",
            header: "Market",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => `${agent.market_benchmark_split_percent}%`,
          },
          {
            key: "gap",
            header: "Gap",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => (
              <BodyText as="span" className="font-semibold">
                {agent.split_gap > 0 ? "+" : ""}
                {agent.split_gap}pts
              </BodyText>
            ),
          },
          {
            key: "score",
            header: "Score",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => (
              <BodyText as="span" className="font-bold">
                {agent.risk_score}
              </BodyText>
            ),
          },
          {
            key: "tier",
            header: "Tier",
            cellClassName: "py-2",
            render: (agent) => (
              <BodyText
                as="span"
                size="xs"
                className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
                  TIER_STYLES[agent.risk_tier as RiskTier]
                }`}
              >
                {TIER_LABELS[agent.risk_tier as RiskTier]}
              </BodyText>
            ),
          },
        ]}
      />
    </SectionCard>
  );
}
