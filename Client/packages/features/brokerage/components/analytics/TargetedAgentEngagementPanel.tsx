/**
 * TargetedAgentEngagementPanel — SIL-279
 *
 * Agents with low in-house ancillary attach rates — prioritized by recoverable revenue.
 */
import { useState } from "react";

import { Icon } from "@ui/icons";

import { useTargetedAgentEngagement } from "packages/features/brokerage/hooks/useTargetedAgentEngagement";
import type { TargetedAgentEngagement } from "packages/features/brokerage/types/analytics";
import { exportAnalyticsCsv } from "packages/features/brokerage/utils/analytics/exportCsv";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { ANCILLARY_SERVICE_LABELS } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Button, Label, Select } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import type { IconName } from "packages/ui/types/icons";

import { AgentRowActions } from "./AgentRowActions";
import { AnalyticsDataTable } from "./AnalyticsDataTable";
import { SectionCard } from "./AnalyticsShellShared";

type FlaggedAgent = TargetedAgentEngagement["flagged_agents"][number];

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
};

const SUMMARY_CARDS: { key: string; label: string; iconName: IconName }[] = [
  { key: "analyzed", label: "Agents Analyzed", iconName: "users" },
  { key: "flagged", label: "Flagged Agents", iconName: "flag" },
  { key: "recoverable", label: "Recoverable Revenue", iconName: "dollar-sign" },
];

function exportEngagementCsv(rows: FlaggedAgent[]) {
  exportAnalyticsCsv(
    "targeted-agent-engagement.csv",
    [
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
    ],
    rows.map((a) => [
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
    ])
  );
}

export function TargetedAgentEngagementPanel({ period = "all" }: { period?: TimePeriod }) {
  const { data, isLoading, error } = useTargetedAgentEngagement(period);
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <SectionCard title="Targeted Agent Engagement" iconName="target">
        <BodyText size="sm" muted>
          Loading engagement targets...
        </BodyText>
      </SectionCard>
    );
  }

  if (error || !data) {
    return (
      <SectionCard title="Targeted Agent Engagement" iconName="target">
        <BodyText size="sm" muted>
          Failed to load engagement data.
        </BodyText>
      </SectionCard>
    );
  }

  const offices = Array.from(new Set(data.flagged_agents.map((a) => a.office)));

  const filtered = data.flagged_agents.filter((a) => {
    if (officeFilter !== "all" && a.office !== officeFilter) return false;
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    return true;
  });

  const officeOptions = [
    { value: "all", label: "All Offices" },
    ...offices.map((o) => ({ value: o, label: o })),
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
  ];

  const summaryValues: Record<string, string | number> = {
    analyzed: data.summary.total_agents_analyzed,
    flagged: data.summary.agents_flagged,
    recoverable: `$${data.summary.estimated_recoverable_dollars.toLocaleString()}`,
  };

  return (
    <SectionCard title="Targeted Agent Engagement" iconName="target">
      <Box className="mb-4 flex items-start justify-between gap-4">
        <BodyText size="sm" muted>
          Agents with low in-house ancillary attach rates — prioritized by estimated recoverable
          revenue.
        </BodyText>
        <Button
          type="button"
          variant="outline"
          size="sm"
          iconName="download"
          onPress={() => exportEngagementCsv(filtered)}
          className="shrink-0"
        >
          Export CSV
        </Button>
      </Box>

      <Box className="mb-4 grid grid-cols-3 gap-4">
        {SUMMARY_CARDS.map((card) => (
          <Box key={card.key} className="border-border bg-background-surface rounded-lg border p-4">
            <Box className="flex items-center gap-1.5">
              <Icon name={card.iconName} className="text-text-secondary h-3.5 w-3.5 shrink-0" />
              <BodyText size="xs" muted className="uppercase tracking-wide">
                {card.label}
              </BodyText>
            </Box>
            <Title size="lg" className="mt-1">
              {summaryValues[card.key]}
            </Title>
          </Box>
        ))}
      </Box>

      <Box className="mb-4 flex flex-wrap gap-3">
        <Box className="min-w-40">
          <Label htmlFor="engagement-office-filter" className="sr-only">
            Office
          </Label>
          <Select
            id="engagement-office-filter"
            options={officeOptions}
            value={officeFilter}
            onChange={setOfficeFilter}
            size="sm"
          />
        </Box>
        <Box className="min-w-40">
          <Label htmlFor="engagement-priority-filter" className="sr-only">
            Priority
          </Label>
          <Select
            id="engagement-priority-filter"
            options={priorityOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            size="sm"
          />
        </Box>
      </Box>

      <AnalyticsDataTable
        rows={filtered}
        rowKey={(agent) => agent.agent_id}
        emptyMessage="No agents match the current filters."
        columns={[
          {
            key: "agent",
            header: "Agent",
            render: (agent) => (
              <Box>
                <BodyText className="font-medium">{agent.name}</BodyText>
                <BodyText size="xs" muted className="mt-0.5">
                  {agent.suggested_action}
                </BodyText>
              </Box>
            ),
          },
          {
            key: "office",
            header: "Office",
            render: (agent) => agent.office,
          },
          {
            key: "deals",
            header: "Deals",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => agent.total_transactions,
          },
          ...(["title", "lending", "escrow", "home_warranty"] as const).map((svc) => ({
            key: svc,
            header: ANCILLARY_SERVICE_LABELS[svc] ?? svc,
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent: FlaggedAgent) => (
              <BodyText
                as="span"
                className={
                  agent.attach_rates[svc] === 0
                    ? "font-semibold text-red-600"
                    : agent.service_gaps.includes(svc)
                      ? "text-yellow-600"
                      : undefined
                }
              >
                {agent.attach_rates[svc]}%
              </BodyText>
            ),
          })),
          {
            key: "leakage",
            header: "Leakage",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right font-medium",
            render: (agent) => `$${agent.estimated_leakage_dollars.toLocaleString()}`,
          },
          {
            key: "priority",
            header: "Priority",
            cellClassName: "py-2",
            render: (agent) => (
              <BodyText
                as="span"
                size="xs"
                className={`inline-flex rounded-full px-2 py-0.5 font-medium ${PRIORITY_STYLES[agent.priority]}`}
              >
                {agent.priority}
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

      <Box className="mt-4">
        <Box className="mb-3 flex items-center gap-1.5">
          <Icon name="alert-circle" className="text-text-secondary h-3.5 w-3.5 shrink-0" />
          <BodyText size="xs" muted className="font-medium uppercase tracking-wide">
            Most Common Service Gaps
          </BodyText>
        </Box>
        <Box className="flex flex-wrap gap-3">
          {data.by_service_gap.map((g) => (
            <Box key={g.service} className="border-border rounded-lg border px-3 py-2 text-sm">
              <BodyText as="span" className="font-medium">
                {ANCILLARY_SERVICE_LABELS[g.service] ?? g.service}
              </BodyText>
              <BodyText as="span" muted className="ml-2">
                {g.agents_with_gap} agent{g.agents_with_gap !== 1 ? "s" : ""}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </SectionCard>
  );
}
