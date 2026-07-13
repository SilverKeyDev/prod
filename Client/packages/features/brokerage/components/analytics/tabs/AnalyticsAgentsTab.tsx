import { useMemo, useState } from "react";

import { AgentRetentionRiskPanel } from "packages/features/brokerage/components/analytics/AgentRetentionRiskPanel";
import { AgentRowActions } from "packages/features/brokerage/components/analytics/AgentRowActions";
import { AnalyticsDataTable } from "packages/features/brokerage/components/analytics/AnalyticsDataTable";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { TargetedAgentEngagementPanel } from "packages/features/brokerage/components/analytics/TargetedAgentEngagementPanel";
import { ViewAllAgentsModal } from "packages/features/brokerage/components/analytics/ViewAllAgentsModal";
import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import { selectAgentPerformanceBarsWithZ } from "packages/features/brokerage/utils/analytics/chartSelectors";
import {
  agentStatusColor,
  momentumColor,
} from "packages/features/brokerage/utils/analytics/rateColor";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

type Props = {
  timePeriod: TimePeriod;
};

export function AnalyticsAgentsTab({ timePeriod }: Props) {
  const [showAllAgents, setShowAllAgents] = useState(false);
  const { agents, isLoading } = useBrokerageAnalytics(timePeriod);
  const agentPerformanceBarsWithZ = useMemo(
    () => selectAgentPerformanceBarsWithZ(agents),
    [agents]
  );

  if (isLoading) {
    return (
      <Box className="p-6">
        <BodyText muted>Loading agents…</BodyText>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6" data-testid="analytics-agents-tab">
      <SectionCard title="Agent Performance" iconName="bar-chart-2">
        <Box className="mb-4">
          <AnalyticsBarChart data={agentPerformanceBarsWithZ} unit=" closings" height={260} />
        </Box>
        <Box className="mb-2 flex items-center justify-between">
          <BodyText size="xs" muted>
            Showing top agents by closings
          </BodyText>
          <Button type="button" variant="ghost" size="sm" onPress={() => setShowAllAgents(true)}>
            View all agents
          </Button>
        </Box>
        <AnalyticsDataTable
          rows={agents}
          rowKey={(agent) => agent.id}
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
              render: (agent) => agent.closings,
            },
            {
              key: "volume",
              header: "Volume",
              render: (agent) => formatCompactCurrency(agent.volumeDollars),
            },
            {
              key: "gci",
              header: "GCI",
              render: (agent) => formatCompactCurrency(agent.gci),
            },
            {
              key: "momentum",
              header: "90d momentum",
              render: (agent) => (
                <BodyText
                  as="span"
                  style={{ color: momentumColor(agent.momentum90dPercent), fontWeight: 500 }}
                >
                  {`${agent.momentum90dPercent >= 0 ? "+" : ""}${agent.momentum90dPercent}%`}
                </BodyText>
              ),
            },
            {
              key: "stall",
              header: "Stall Stage",
              cellClassName: "py-2 pr-4 font-mono text-xs",
              render: (agent) => agent.stall ?? "—",
            },
            {
              key: "status",
              header: "Status",
              cellClassName: "py-2",
              render: (agent) => (
                <BodyText
                  as="span"
                  style={{ color: agentStatusColor(agent.status), fontWeight: 500 }}
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
              key: "actions",
              header: "Actions",
              render: (agent) => <AgentRowActions agentId={agent.id} agentName={agent.name} />,
            },
          ]}
        />
      </SectionCard>
      <TargetedAgentEngagementPanel period={timePeriod} />
      <AgentRetentionRiskPanel period={timePeriod} />
      <ViewAllAgentsModal open={showAllAgents} onClose={() => setShowAllAgents(false)} />
    </Box>
  );
}
