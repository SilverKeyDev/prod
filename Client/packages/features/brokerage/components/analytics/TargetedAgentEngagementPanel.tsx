/**
 * TargetedAgentEngagementPanel — SIL-279
 *
 * Shows brokerage admins which agents have 0% or bottom-quartile ancillary
 * attach rates despite high transaction volume, along with a suggested
 * engagement action per agent and estimated recoverable dollars.
 *
 * v1: dashboard view + CSV export only — no auto-send nudges.
 * Future: wire into notification/nudge system (Notification Systems project).
 */
import React, { useState } from "react";
import { useTargetedAgentEngagement } from "../../hooks/useTargetedAgentEngagement";

const SERVICE_LABELS: Record<string, string> = {
  title: "Title",
  lending: "Lending",
  escrow: "Escrow",
  home_warranty: "Warranty",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
};

function exportToCsv(rows: typeof data.flagged_agents) {
  const headers = [
    "Name",
    "Office",
    "Transactions",
    "Title Attach %",
    "Lending Attach %",
    "Escrow Attach %",
    "Warranty Attach %",
    "Service Gaps",
    "Est. Leakage $",
    "Priority",
    "Suggested Action",
  ];
  const lines = rows.map((a) =>
    [
      a.name,
      a.office,
      a.total_transactions,
      a.attach_rates.title,
      a.attach_rates.lending,
      a.attach_rates.escrow,
      a.attach_rates.home_warranty,
      a.service_gaps.join(" | "),
      a.estimated_leakage_dollars,
      a.priority,
      `"${a.suggested_action}"`,
    ].join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "targeted-agent-engagement.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function TargetedAgentEngagementPanel() {
  const { data, isLoading, error } = useTargetedAgentEngagement();
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-400">Loading engagement targets...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-red-500">Failed to load engagement data.</p>
      </div>
    );
  }

  const offices = Array.from(new Set(data.flagged_agents.map((a) => a.office)));

  const filtered = data.flagged_agents.filter((a) => {
    if (officeFilter !== "all" && a.office !== officeFilter) return false;
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Targeted Agent Engagement</h2>
          <p className="mt-1 text-sm text-gray-500">
            Agents with low in-house ancillary attach rates — prioritized by estimated recoverable
            revenue.
          </p>
        </div>
        <button
          onClick={() => exportToCsv(filtered)}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Agents Analyzed</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {data.summary.total_agents_analyzed}
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-xs uppercase tracking-wide text-red-500">Flagged Agents</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{data.summary.agents_flagged}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-xs uppercase tracking-wide text-green-600">Recoverable Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green-700">
            ${data.summary.estimated_recoverable_dollars.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="all">All Offices</option>
          {offices.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
      </div>

      {/* Agent Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 pr-4 font-medium">Office</th>
              <th className="pb-3 pr-4 text-right font-medium">Deals</th>
              <th className="pb-3 pr-4 text-right font-medium">Title</th>
              <th className="pb-3 pr-4 text-right font-medium">Lending</th>
              <th className="pb-3 pr-4 text-right font-medium">Escrow</th>
              <th className="pb-3 pr-4 text-right font-medium">Warranty</th>
              <th className="pb-3 pr-4 text-right font-medium">Leakage</th>
              <th className="pb-3 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((agent) => (
              <tr key={agent.agent_id} className="group">
                <td className="py-3 pr-4">
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{agent.suggested_action}</p>
                </td>
                <td className="py-3 pr-4 text-gray-600">{agent.office}</td>
                <td className="py-3 pr-4 text-right text-gray-700">{agent.total_transactions}</td>
                {(["title", "lending", "escrow", "home_warranty"] as const).map((svc) => (
                  <td key={svc} className="py-3 pr-4 text-right">
                    <span
                      className={
                        agent.attach_rates[svc] === 0
                          ? "font-semibold text-red-600"
                          : agent.service_gaps.includes(svc)
                            ? "text-yellow-600"
                            : "text-gray-700"
                      }
                    >
                      {agent.attach_rates[svc]}%
                    </span>
                  </td>
                ))}
                <td className="py-3 pr-4 text-right font-medium text-gray-900">
                  ${agent.estimated_leakage_dollars.toLocaleString()}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[agent.priority]}`}
                  >
                    {agent.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No agents match the current filters.
          </p>
        )}
      </div>

      {/* Service Gap Summary */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          Most Common Service Gaps
        </p>
        <div className="flex flex-wrap gap-3">
          {data.by_service_gap.map((g) => (
            <div key={g.service} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span className="font-medium text-gray-800">
                {SERVICE_LABELS[g.service] ?? g.service}
              </span>
              <span className="ml-2 text-gray-400">
                {g.agents_with_gap} agent{g.agents_with_gap !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
