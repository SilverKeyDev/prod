/**
 * ViewAllAgentsModal — searchable agent leaderboard (production + leakage metrics).
 */
import { useMemo, useState } from "react";

import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";
import {
  type AgentLeaderboardSort,
  type AncillaryAgentMetrics,
  buildAgentLeaderboardRows,
} from "packages/features/brokerage/utils/analytics/agentLeaderboardRows";
import {
  agentStatusColor,
  momentumColor,
  rateColorHighGood,
} from "packages/features/brokerage/utils/analytics/rateColor";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import { formatAncillaryDollars } from "packages/features/brokerage/utils/ancillaryServiceLabels";
import { useNavigation } from "packages/navigation";
import { BaseModal, Button, Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { buildBrokerageAgentAnalyticsPath } from "packages/utils/growth/agent";

import { AgentRowActions } from "./AgentRowActions";
import { AnalyticsDataTable } from "./AnalyticsDataTable";

interface Props {
  open: boolean;
  onClose: () => void;
  agents: readonly BrokerageAnalyticsAgent[];
  ancillaryByAgent?: readonly AncillaryAgentMetrics[];
  initialSort?: AgentLeaderboardSort;
}

function formatAttach(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

function formatOpportunity(value: number | null): string {
  return value == null ? "—" : formatAncillaryDollars(value);
}

export function ViewAllAgentsModal({
  open,
  onClose,
  agents,
  ancillaryByAgent = [],
  initialSort = "closings",
}: Props) {
  const [search, setSearch] = useState("");
  const { navigateToPath } = useNavigation();

  const rows = useMemo(
    () => buildAgentLeaderboardRows(agents, ancillaryByAgent, initialSort),
    [agents, ancillaryByAgent, initialSort]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter((a) => a.name.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title="Agent Leaderboard"
      size="lg"
      footerContent={
        <BodyText size="xs" muted>
          {filtered.length} of {agents.length} agent
          {agents.length !== 1 ? "s" : ""} shown
        </BodyText>
      }
    >
      <Box className="mb-3">
        <Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search agents…"
          label="Search agents"
        />
      </Box>

      <AnalyticsDataTable
        rows={filtered}
        rowKey={(agent) => agent.id}
        emptyMessage="No agents match your search."
        onRowPress={(agent) =>
          navigateToPath(buildBrokerageAgentAnalyticsPath(agent.id, agent.name))
        }
        columns={[
          {
            key: "name",
            header: "Agent",
            cellClassName: "py-2 pr-4 font-medium",
            render: (agent) => agent.name,
          },
          {
            key: "office",
            header: "Office",
            render: (agent) => agent.office,
          },
          {
            key: "closings",
            header: "Closings",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => agent.closings,
          },
          {
            key: "volume",
            header: "Volume",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => formatCompactCurrency(agent.volumeDollars),
          },
          {
            key: "gci",
            header: "GCI",
            headerClassName: "py-2 pr-4 text-right font-medium",
            cellClassName: "py-2 pr-4 text-right",
            render: (agent) => formatCompactCurrency(agent.gci),
          },
          {
            key: "momentum",
            header: "90d momentum",
            render: (agent) => (
              <BodyText
                as="span"
                style={{
                  color: momentumColor(agent.momentum90dPercent),
                  fontWeight: 500,
                }}
              >
                {`${agent.momentum90dPercent >= 0 ? "+" : ""}${agent.momentum90dPercent}%`}
              </BodyText>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (agent) => (
              <BodyText
                as="span"
                size="xs"
                style={{
                  color: agentStatusColor(agent.status),
                  fontWeight: 500,
                }}
              >
                {agent.status === "top"
                  ? "Top Performer"
                  : agent.status === "at_risk"
                    ? "At Risk"
                    : "Healthy"}
              </BodyText>
            ),
          },
          {
            key: "title",
            header: "Title Attach",
            render: (agent) => (
              <BodyText
                as="span"
                style={
                  agent.titleAttach == null
                    ? undefined
                    : { color: rateColorHighGood(agent.titleAttach, 60, 40) }
                }
              >
                {formatAttach(agent.titleAttach)}
              </BodyText>
            ),
          },
          {
            key: "lending",
            header: "Lending Attach",
            render: (agent) => (
              <BodyText
                as="span"
                style={
                  agent.lendingAttach == null
                    ? undefined
                    : { color: rateColorHighGood(agent.lendingAttach, 60, 40) }
                }
              >
                {formatAttach(agent.lendingAttach)}
              </BodyText>
            ),
          },
          {
            key: "opportunity",
            header: "Total opportunity",
            cellClassName: "py-2 pr-4 font-medium",
            render: (agent) => formatOpportunity(agent.totalOpportunityDollars),
          },
          {
            key: "actions",
            header: "Actions",
            stopRowPress: true,
            render: (agent) => <AgentRowActions agentId={agent.id} agentName={agent.name} />,
          },
        ]}
      />

      <Box className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onPress={onClose}>
          Close
        </Button>
      </Box>
    </BaseModal>
  );
}
