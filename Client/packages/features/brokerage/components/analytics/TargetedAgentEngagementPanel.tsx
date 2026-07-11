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

import Button from "packages/ui/components/actions/button/Button";
import { Select } from "packages/ui/components/inputs/form/pickers/Select";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { useTargetedAgentEngagement } from "../../hooks/useTargetedAgentEngagement";
import type { BrokerageTargetedEngagementFixture } from "../../utils/brokerageAnalyticsFixtures";

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

function exportToCsv(rows: BrokerageTargetedEngagementFixture["flagged_agents"]) {
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

export function TargetedAgentEngagementPanel({
  period = "all",
}: {
  period?: import("../../hooks/useBrokerageAnalytics").TimePeriod;
}) {
  const { data, isLoading, error } = useTargetedAgentEngagement(period);
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <Box className="rounded-xl border border-gray-200 bg-white p-6">
        <BodyText size="sm" className="text-gray-400">
          Loading engagement targets...
        </BodyText>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box className="rounded-xl border border-gray-200 bg-white p-6">
        <BodyText size="sm" className="text-red-500">
          Failed to load engagement data.
        </BodyText>
      </Box>
    );
  }

  const offices = Array.from(new Set(data.flagged_agents.map((a) => a.office)));
  const officeOptions = [
    { value: "all", label: "All Offices" },
    ...offices.map((office) => ({ value: office, label: office })),
  ];

  const filtered = data.flagged_agents.filter((a) => {
    if (officeFilter !== "all" && a.office !== officeFilter) return false;
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <Box className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Title size="sm" as="h2" className="font-sans font-semibold text-gray-900 sm:text-lg">
            Targeted Agent Engagement
          </Title>
          <BodyText size="sm" className="mt-1 text-gray-500">
            Agents with low in-house ancillary attach rates — prioritized by estimated recoverable
            revenue.
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
      <Box className="grid grid-cols-3 gap-4">
        <Box className="rounded-lg bg-gray-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-gray-500">
            Agents Analyzed
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-gray-900">
            {data.summary.total_agents_analyzed}
          </Title>
        </Box>
        <Box className="rounded-lg bg-red-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-red-500">
            Flagged Agents
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-red-700">
            {data.summary.agents_flagged}
          </Title>
        </Box>
        <Box className="rounded-lg bg-green-50 p-4">
          <BodyText size="xs" className="uppercase tracking-wide text-green-600">
            Recoverable Revenue
          </BodyText>
          <Title size="lg" className="mt-1 font-sans font-bold text-green-700">
            ${data.summary.estimated_recoverable_dollars.toLocaleString()}
          </Title>
        </Box>
      </Box>

      {/* Filters */}
      <Box className="flex flex-wrap gap-3">
        <Box className="w-48">
          <Select
            value={officeFilter}
            onChange={setOfficeFilter}
            options={officeOptions}
            size="sm"
            className="text-gray-700"
          />
        </Box>
        <Box className="w-40">
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: "all", label: "All Priorities" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
            ]}
            size="sm"
            className="text-gray-700"
          />
        </Box>
      </Box>

      {/* Agent Table */}
      <Box className="overflow-x-auto">
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
                  <BodyText size="sm" className="font-medium text-gray-900">
                    {agent.name}
                  </BodyText>
                  <BodyText size="xs" className="mt-0.5 text-gray-400">
                    {agent.suggested_action}
                  </BodyText>
                </td>
                <td className="py-3 pr-4 text-gray-600">{agent.office}</td>
                <td className="py-3 pr-4 text-right text-gray-700">{agent.total_transactions}</td>
                {(["title", "lending", "escrow", "home_warranty"] as const).map((svc) => (
                  <td key={svc} className="py-3 pr-4 text-right">
                    <BodyText
                      as="span"
                      size="sm"
                      className={
                        agent.attach_rates[svc] === 0
                          ? "font-semibold text-red-600"
                          : agent.service_gaps.includes(svc)
                            ? "text-yellow-600"
                            : "text-gray-700"
                      }
                    >
                      {agent.attach_rates[svc]}%
                    </BodyText>
                  </td>
                ))}
                <td className="py-3 pr-4 text-right font-medium text-gray-900">
                  ${agent.estimated_leakage_dollars.toLocaleString()}
                </td>
                <td className="py-3">
                  <BodyText
                    as="span"
                    size="xs"
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[agent.priority]}`}
                  >
                    {agent.priority}
                  </BodyText>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <BodyText size="sm" className="py-6 text-center text-gray-400">
            No agents match the current filters.
          </BodyText>
        )}
      </Box>

      {/* Service Gap Summary */}
      <Box>
        <BodyText size="xs" className="mb-3 font-medium uppercase tracking-wide text-gray-500">
          Most Common Service Gaps
        </BodyText>
        <Box className="flex flex-wrap gap-3">
          {data.by_service_gap.map((g) => (
            <Box key={g.service} className="rounded-lg border border-gray-200 px-3 py-2">
              <BodyText as="span" size="sm" className="font-medium text-gray-800">
                {SERVICE_LABELS[g.service] ?? g.service}
              </BodyText>
              <BodyText as="span" size="sm" className="ml-2 text-gray-400">
                {g.agents_with_gap} agent{g.agents_with_gap !== 1 ? "s" : ""}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
