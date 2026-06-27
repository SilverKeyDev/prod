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
import { useAgentRetentionRisk } from "../../hooks/useAgentRetentionRisk";

type RiskTier = "flight_risk" | "watch" | "stable" | "over_comp";

const TIER_LABELS: Record<RiskTier, string> = {
  flight_risk: "Flight Risk",
  watch:       "Watch",
  stable:      "Stable",
  over_comp:   "Over-Comp",
};

const TIER_STYLES: Record<RiskTier, string> = {
  flight_risk: "bg-red-100 text-red-700",
  watch:       "bg-yellow-100 text-yellow-700",
  stable:      "bg-green-100 text-green-700",
  over_comp:   "bg-purple-100 text-purple-700",
};

const TIER_FILTERS: { label: string; value: string }[] = [
  { label: "All",         value: "all" },
  { label: "Flight Risk", value: "flight_risk" },
  { label: "Watch",       value: "watch" },
  { label: "Stable",      value: "stable" },
  { label: "Over-Comp",   value: "over_comp" },
];

function exportToCsv(rows: typeof data.agents) {
  const headers = [
    "Name", "Office", "Transactions", "Est. GCI ($)",
    "Current Split %", "Market Benchmark %", "Split Gap",
    "Risk Score", "Risk Tier", "Percentile", "Recommended Action",
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

export function AgentRetentionRiskPanel() {
  const { data, isLoading, error } = useAgentRetentionRisk();
  const [tierFilter, setTierFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-400">Loading retention risk data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-red-500">Failed to load retention risk data.</p>
      </div>
    );
  }

  const filtered = tierFilter === "all"
    ? data.agents
    : data.agents.filter((a) => a.risk_tier === tierFilter);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Agent Retention Risk
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Cross-references production volume against split structures to flag
            flight risks and over-compensated agents.
          </p>
        </div>
        <button
          onClick={() => exportToCsv(filtered)}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-xs text-red-500 uppercase tracking-wide">Flight Risk</p>
          <p className="mt-1 text-2xl font-bold text-red-700">
            {data.summary.flight_risk_count}
          </p>
          <p className="text-xs text-red-400 mt-1">
            ${data.summary.estimated_at_risk_gci.toLocaleString()} GCI at risk
          </p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4">
          <p className="text-xs text-yellow-600 uppercase tracking-wide">Watch</p>
          <p className="mt-1 text-2xl font-bold text-yellow-700">
            {data.summary.watch_count}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-xs text-green-600 uppercase tracking-wide">Stable</p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            {data.summary.stable_count}
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <p className="text-xs text-purple-600 uppercase tracking-wide">Over-Comp</p>
          <p className="mt-1 text-2xl font-bold text-purple-700">
            {data.summary.over_comp_count}
          </p>
        </div>
      </div>

      {/* Methodology note */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Methodology: </span>
          {data.methodology}
        </p>
      </div>

      {/* Tier filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TIER_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTierFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              tierFilter === f.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Agent Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 pr-4 font-medium text-right">GCI</th>
              <th className="pb-3 pr-4 font-medium text-right">Their Split</th>
              <th className="pb-3 pr-4 font-medium text-right">Market</th>
              <th className="pb-3 pr-4 font-medium text-right">Gap</th>
              <th className="pb-3 pr-4 font-medium text-right">Score</th>
              <th className="pb-3 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((agent) => (
              <tr key={agent.agent_id}>
                <td className="py-3 pr-4">
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{agent.office}</p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">
                    {agent.recommended_action}
                  </p>
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
                  <span
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
                  </span>
                </td>
                <td className="py-3 pr-4 text-right">
                  <span
                    className={
                      agent.risk_score >= 70
                        ? "font-bold text-red-600"
                        : agent.risk_score >= 40
                        ? "font-semibold text-yellow-600"
                        : "text-gray-500"
                    }
                  >
                    {agent.risk_score}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      TIER_STYLES[agent.risk_tier as RiskTier]
                    }`}
                  >
                    {TIER_LABELS[agent.risk_tier as RiskTier]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No agents in this tier.
          </p>
        )}
      </div>

      {/* Market Benchmark Reference */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Market Benchmark Splits by Production Tier
        </p>
        <div className="flex gap-3 flex-wrap">
          {data.market_benchmarks.map((b) => (
            <div
              key={b.tier}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <span className="text-gray-500">{b.tier}</span>
              <span className="ml-2 font-semibold text-gray-800">
                {b.market_split_percent}/
                {100 - b.market_split_percent}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}