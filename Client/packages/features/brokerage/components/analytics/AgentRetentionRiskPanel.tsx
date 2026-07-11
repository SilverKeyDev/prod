/**
 * AgentRetentionRiskPanel — SIL-278
 *
 * Shows brokerage admins which agents are flight risks (top producers
 * underpaid vs market benchmarks) and which are over-compensated relative
 * to their production volume. Ranked by risk score.
 *
 * Methodology is surfaced inline so brokerage admins can explain the
 * scoring to agents in retention conversations.
 */
import React, { useState } from "react";

import Button from "packages/ui/components/actions/button/Button";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { useAgentRetentionRisk } from "../../hooks/useAgentRetentionRisk";
import type { BrokerageAgentRetentionFixture } from "../../utils/brokerageAnalyticsFixtures";

type RiskTier = "flight_risk" | "watch" | "stable" | "over_comp";

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

function exportToCsv(rows: BrokerageAgentRetentionFixture["agents"]) {
  const headers = [
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
  ];
  const lines = rows.map((a) =>
    [
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
    ].join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agent-retention-risk.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function AgentRetentionRiskPanel({
  period = "all",
}: {
  period?: import("../../hooks/useBrokerageAnalytics").TimePeriod;
}) {
  const { data, isLoading, error } = useAgentRetentionRisk(period);
  const [tierFilter, setTierFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <Box className="rounded-xl border border-gray-200 bg-white p-6">
        <BodyText size="sm" className="text-gray-400">
          Loading retention risk data...
        </BodyText>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box className="rounded-xl border border-gray-200 bg-white p-6">
        <BodyText size="sm" className="text-red-500">
          Failed to load retention risk data.
        </BodyText>
      </Box>
    );
  }

  const filtered =
    tierFilter === "all" ? data.agents : data.agents.filter((a) => a.risk_tier === tierFilter);

  return (
    <Box className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Title size="sm" as="h2" className="font-sans font-semibold text-gray-900 sm:text-lg">
            Agent Retention Risk
          </Title>
          <BodyText size="sm" className="mt-1 text-gray-500">
            Cross-references production volume against split structures to flag flight risks and
            over-compensated agents.
          </BodyText>
        </Box>
        <Button
          onClick={() => exportToCsv(filtered)}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          Export CSV
        </Button>
      </Box>

      {/* Summary KPIs */}
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Box className="rounded-lg bg-red-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-red-500">
            Flight Risk
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-red-700">
            {data.summary.flight_risk_count}
          </Title>
          <BodyText size="xs" className="mt-1 text-red-400">
            ${data.summary.estimated_at_risk_gci.toLocaleString()} GCI at risk
          </BodyText>
        </Box>
        <Box className="rounded-lg bg-yellow-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-yellow-600">
            Watch
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-yellow-700">
            {data.summary.watch_count}
          </Title>
        </Box>
        <Box className="rounded-lg bg-green-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-green-600">
            Stable
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-green-700">
            {data.summary.stable_count}
          </Title>
        </Box>
        <Box className="rounded-lg bg-purple-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-purple-600">
            Over-Comp
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-purple-700">
            {data.summary.over_comp_count}
          </Title>
        </Box>
      </Box>

      {/* Methodology note */}
      <Box className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
        <BodyText size="xs" className="text-gray-500">
          <BodyText as="span" size="xs" className="font-medium text-gray-700">
            Methodology:{" "}
          </BodyText>
          {data.methodology}
        </BodyText>
      </Box>

      {/* Tier filter tabs */}
      <Box className="flex flex-wrap gap-2">
        {TIER_FILTERS.map((f) => (
          <Button
            key={f.value}
            onClick={() => setTierFilter(f.value)}
            variant={tierFilter === f.value ? "primary" : "secondary"}
            size="sm"
            rounded="full"
          >
            {f.label}
          </Button>
        ))}
      </Box>

      {/* Agent Table */}
      <Box className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 pr-4 text-right font-medium">GCI</th>
              <th className="pb-3 pr-4 text-right font-medium">Their Split</th>
              <th className="pb-3 pr-4 text-right font-medium">Market</th>
              <th className="pb-3 pr-4 text-right font-medium">Gap</th>
              <th className="pb-3 pr-4 text-right font-medium">Score</th>
              <th className="pb-3 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((agent) => (
              <tr key={agent.agent_id}>
                <td className="py-3 pr-4">
                  <BodyText size="sm" className="font-medium text-gray-900">
                    {agent.name}
                  </BodyText>
                  <BodyText size="xs" className="mt-0.5 text-gray-400">
                    {agent.office}
                  </BodyText>
                  <BodyText size="xs" className="mt-0.5 italic text-gray-400">
                    {agent.recommended_action}
                  </BodyText>
                </td>
                <td className="py-3 pr-4 text-right text-gray-700">
                  ${agent.estimated_gci.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-gray-900">
                  {agent.current_split_percent}%
                </td>
                <td className="py-3 pr-4 text-right text-gray-500">
                  {agent.market_benchmark_split_percent}%
                </td>
                <td className="py-3 pr-4 text-right">
                  <BodyText
                    as="span"
                    size="sm"
                    className={
                      agent.split_gap < 0
                        ? "font-semibold text-red-600"
                        : agent.split_gap > 5
                          ? "font-semibold text-purple-600"
                          : "text-gray-500"
                    }
                  >
                    {agent.split_gap > 0 ? "+" : ""}
                    {agent.split_gap}pts
                  </BodyText>
                </td>
                <td className="py-3 pr-4 text-right">
                  <BodyText
                    as="span"
                    size="sm"
                    className={
                      agent.risk_score >= 70
                        ? "font-bold text-red-600"
                        : agent.risk_score >= 40
                          ? "font-semibold text-yellow-600"
                          : "text-gray-500"
                    }
                  >
                    {agent.risk_score}
                  </BodyText>
                </td>
                <td className="py-3">
                  <BodyText
                    as="span"
                    size="xs"
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      TIER_STYLES[agent.risk_tier as RiskTier]
                    }`}
                  >
                    {TIER_LABELS[agent.risk_tier as RiskTier]}
                  </BodyText>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <BodyText size="sm" className="py-6 text-center text-gray-400">
            No agents in this tier.
          </BodyText>
        )}
      </Box>

      {/* Market Benchmark Reference */}
      <Box>
        <BodyText size="xs" className="mb-3 font-medium uppercase tracking-wide text-gray-500">
          Market Benchmark Splits by Production Tier
        </BodyText>
        <Box className="flex flex-wrap gap-3">
          {data.market_benchmarks.map((b) => (
            <Box key={b.tier} className="rounded-lg border border-gray-200 px-3 py-2">
              <BodyText as="span" size="sm" className="text-gray-500">
                {b.tier}
              </BodyText>
              <BodyText as="span" size="sm" className="ml-2 font-semibold text-gray-800">
                {b.market_split_percent}/{100 - b.market_split_percent}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
