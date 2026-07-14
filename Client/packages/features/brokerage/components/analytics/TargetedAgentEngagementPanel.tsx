/**
 * TargetedAgentEngagementPanel — SIL-279
 *
 * Agents with low in-house ancillary attach rates, prioritized by recoverable revenue.
 */
import { useState } from "react";

import { Icon } from "@ui/icons";

import { color } from "packages/design-tokens";
import { useTargetedAgentEngagement } from "packages/features/brokerage/hooks/useTargetedAgentEngagement";
import type { TargetedAgentEngagement } from "packages/features/brokerage/types/analytics";
import { exportAnalyticsCsv } from "packages/features/brokerage/utils/analytics/exportCsv";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { ANCILLARY_SERVICE_LABELS } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { Button, Label, Select } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import type { IconName } from "packages/ui/types/icons";

import { AgentRowActions } from "./AgentRowActions";
import { AnalyticsDataTable } from "./AnalyticsDataTable";
import { KpiCard, SectionCard } from "./AnalyticsShellShared";

type FlaggedAgent = TargetedAgentEngagement["flagged_agents"][number];
type AncillaryServiceKey = "title" | "lending" | "escrow" | "home_warranty";

const ATTACH_SERVICES: AncillaryServiceKey[] = ["title", "lending", "escrow", "home_warranty"];

const SHORT_SERVICE_LABELS: Record<AncillaryServiceKey, string> = {
  title: "Title",
  lending: "Lending",
  escrow: "Escrow",
  home_warranty: "Warranty",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
};

const SUMMARY_CARDS: { key: string; label: string; iconName: IconName }[] = [
  { key: "analyzed", label: "Agents Analyzed", iconName: "users" },
  { key: "flagged", label: "Flagged Agents", iconName: "flag" },
  { key: "recoverable", label: "Recoverable Revenue", iconName: "dollar-sign" },
];

function attachRateTone(rate: number, isGap: boolean): "danger" | "warning" | "default" {
  if (rate === 0) return "danger";
  if (isGap) return "warning";
  return "default";
}

function AttachRateCell({ agent }: { agent: FlaggedAgent }) {
  const dangerColor = color("state.danger.DEFAULT");
  const warningColor = color("state.warning.DEFAULT");

  return (
    <Box className="grid min-w-[11rem] grid-cols-2 gap-x-4 gap-y-1.5">
      {ATTACH_SERVICES.map((svc) => {
        const rate = agent.attach_rates[svc];
        const tone = attachRateTone(rate, agent.service_gaps.includes(svc));
        const valueColor =
          tone === "danger" ? dangerColor : tone === "warning" ? warningColor : undefined;

        return (
          <Box key={svc} className="flex items-baseline justify-between gap-2">
            <BodyText size="xs" muted className="truncate">
              {SHORT_SERVICE_LABELS[svc]}
            </BodyText>
            <BodyText
              as="span"
              size="xs"
              className={tone === "default" ? "tabular-nums" : "font-semibold tabular-nums"}
              style={valueColor ? { color: valueColor } : undefined}
              title={`${ANCILLARY_SERVICE_LABELS[svc]} attach rate`}
            >
              {rate}%
            </BodyText>
          </Box>
        );
      })}
    </Box>
  );
}

function ServiceGapChips({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) return null;

  return (
    <Box className="mt-1.5 flex flex-wrap gap-1">
      {gaps.map((gap) => (
        <BodyText
          key={gap}
          as="span"
          size="xs"
          className="bg-background-muted text-text-secondary inline-flex rounded-md px-1.5 py-0.5 font-medium capitalize"
        >
          {SHORT_SERVICE_LABELS[gap as AncillaryServiceKey] ?? gap.replace(/_/g, " ")}
        </BodyText>
      ))}
    </Box>
  );
}

function ServiceGapDistribution({
  gaps,
  flaggedAgents,
}: {
  gaps: readonly { service: string; agents_with_gap: number }[];
  flaggedAgents: number;
}) {
  const warningColor = color("state.warning.DEFAULT");
  const maxCount = Math.max(...gaps.map((g) => g.agents_with_gap), 1);
  const ranked = [...gaps].sort((a, b) => b.agents_with_gap - a.agents_with_gap);

  return (
    <Box className="border-border bg-background-surface mt-5 rounded-xl border p-4">
      <Box className="mb-1 flex items-center justify-between gap-3">
        <Box className="flex items-center gap-1.5">
          <Icon name="alert-circle" className="text-text-secondary h-3.5 w-3.5 shrink-0" />
          <BodyText size="xs" muted className="font-medium uppercase tracking-wide">
            Most Common Service Gaps
          </BodyText>
        </Box>
        <BodyText size="xs" muted className="tabular-nums">
          Among {flaggedAgents} flagged agent{flaggedAgents !== 1 ? "s" : ""}
        </BodyText>
      </Box>
      <BodyText size="xs" muted className="mb-4">
        Share of flagged agents missing in-house attach for each ancillary.
      </BodyText>

      <Box className="flex flex-col gap-3">
        {ranked.map((g, index) => {
          const label = ANCILLARY_SERVICE_LABELS[g.service] ?? g.service;
          const short = SHORT_SERVICE_LABELS[g.service as AncillaryServiceKey] ?? label;
          const sharePct =
            flaggedAgents > 0 ? Math.round((g.agents_with_gap / flaggedAgents) * 100) : 0;
          const barPct = Math.max(8, Math.round((g.agents_with_gap / maxCount) * 100));
          const isTop = index === 0;

          return (
            <Box key={g.service} className="min-w-0">
              <Box className="mb-1.5 flex items-baseline justify-between gap-3">
                <Box className="flex min-w-0 items-baseline gap-2">
                  <BodyText as="span" size="xs" muted className="w-4 shrink-0 tabular-nums">
                    {index + 1}
                  </BodyText>
                  <BodyText
                    as="span"
                    size="sm"
                    className={isTop ? "font-semibold" : "font-medium"}
                    title={label}
                  >
                    {short}
                  </BodyText>
                </Box>
                <Box className="flex shrink-0 items-baseline gap-2">
                  <BodyText
                    as="span"
                    size="xs"
                    className="font-semibold tabular-nums"
                    style={isTop ? { color: warningColor } : undefined}
                  >
                    {g.agents_with_gap} agent{g.agents_with_gap !== 1 ? "s" : ""}
                  </BodyText>
                  <BodyText as="span" size="xs" muted className="tabular-nums">
                    {sharePct}%
                  </BodyText>
                </Box>
              </Box>
              <Box className="bg-background-muted h-2 overflow-hidden rounded-full">
                <Box
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: isTop ? warningColor : color("text-secondary"),
                    opacity: isTop ? 1 : 0.45,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

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
  const dangerColor = color("state.danger.DEFAULT");
  const warningColor = color("state.warning.DEFAULT");

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
      <Box className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <BodyText size="sm" muted className="max-w-2xl">
          Agents with low in-house ancillary attach rates, prioritized by estimated recoverable
          revenue.
        </BodyText>
        <Button
          type="button"
          variant="outline"
          size="sm"
          iconName="download"
          onPress={() => exportEngagementCsv(filtered)}
          className="shrink-0 self-start"
        >
          Export CSV
        </Button>
      </Box>

      <Box className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUMMARY_CARDS.map((card) => (
          <KpiCard
            key={card.key}
            label={card.label}
            value={summaryValues[card.key]!}
            iconName={card.iconName}
            valueColor={card.key === "recoverable" ? dangerColor : undefined}
          />
        ))}
      </Box>

      <Box className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <Box className="flex flex-wrap gap-3">
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
        <Box className="flex flex-wrap items-center gap-3">
          <Box className="flex items-center gap-1.5">
            <Box
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: warningColor }}
            />
            <BodyText size="xs" muted>
              Below target
            </BodyText>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Box
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: dangerColor }}
            />
            <BodyText size="xs" muted>
              Zero attach
            </BodyText>
          </Box>
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
            headerClassName: "py-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 align-top",
            render: (agent) => (
              <Box className="min-w-[10rem] max-w-[14rem]">
                <BodyText className="font-medium leading-snug">{agent.name}</BodyText>
                <BodyText size="xs" muted className="mt-0.5">
                  {agent.office}
                </BodyText>
                <ServiceGapChips gaps={agent.service_gaps} />
              </Box>
            ),
          },
          {
            key: "deals",
            header: "Deals",
            headerClassName: "py-2.5 pr-4 text-right text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 text-right align-top tabular-nums",
            render: (agent) => agent.total_transactions,
          },
          {
            key: "attach",
            header: "Attach rates",
            headerClassName: "py-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 align-top",
            render: (agent) => <AttachRateCell agent={agent} />,
          },
          {
            key: "leakage",
            header: "Leakage",
            headerClassName: "py-2.5 pr-4 text-right text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 text-right align-top",
            render: (agent) => (
              <BodyText
                as="span"
                className="font-semibold tabular-nums"
                style={{ color: dangerColor }}
              >
                ${agent.estimated_leakage_dollars.toLocaleString()}
              </BodyText>
            ),
          },
          {
            key: "priority",
            header: "Priority",
            headerClassName: "py-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 align-top",
            render: (agent) => (
              <BodyText
                as="span"
                size="xs"
                className={`inline-flex rounded-full px-2.5 py-0.5 font-medium capitalize ${
                  PRIORITY_STYLES[agent.priority] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {PRIORITY_LABELS[agent.priority] ?? agent.priority}
              </BodyText>
            ),
          },
          {
            key: "next_step",
            header: "Next step",
            headerClassName: "py-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 pr-4 align-top",
            render: (agent) => (
              <BodyText size="xs" className="text-text-secondary max-w-[16rem] leading-relaxed">
                {agent.suggested_action}
              </BodyText>
            ),
          },
          {
            key: "actions",
            header: "",
            headerClassName: "py-2.5 text-right text-xs font-medium uppercase tracking-wide",
            cellClassName: "py-3 align-top",
            stopRowPress: true,
            render: (agent) => <AgentRowActions agentId={agent.agent_id} agentName={agent.name} />,
          },
        ]}
      />

      <ServiceGapDistribution
        gaps={data.by_service_gap}
        flaggedAgents={data.summary.agents_flagged}
      />
    </SectionCard>
  );
}
