import { useMemo, useState } from "react";

import { AgentRetentionRiskPanel } from "packages/features/brokerage/components/analytics/AgentRetentionRiskPanel";
import { AgentRowActions } from "packages/features/brokerage/components/analytics/AgentRowActions";
import { AnalyticsDataTable } from "packages/features/brokerage/components/analytics/AnalyticsDataTable";
import { SectionCard } from "packages/features/brokerage/components/analytics/AnalyticsShellShared";
import { TargetedAgentEngagementPanel } from "packages/features/brokerage/components/analytics/TargetedAgentEngagementPanel";
import { ViewAllAgentsModal } from "packages/features/brokerage/components/analytics/ViewAllAgentsModal";
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  AnalyticsLineChart,
} from "packages/features/brokerage/components/charts";
import { useAncillaryAnalytics } from "packages/features/brokerage/hooks/useAncillaryAnalytics";
import { useBrokerageAnalytics } from "packages/features/brokerage/hooks/useBrokerageAnalytics";
import {
  selectAgentStatusDonut,
  selectBrokerageClosingsTrend,
  selectTopAgentsByClosings,
  selectTopAgentsByGciBars,
} from "packages/features/brokerage/utils/analytics/agentPerformanceChartSelectors";
import {
  agentStatusColor,
  momentumColor,
} from "packages/features/brokerage/utils/analytics/rateColor";
import { formatCompactCurrency } from "packages/features/brokerage/utils/analyticsFormat";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Subtitle from "packages/ui/components/structure/text/Subtitle";

type Props = {
  timePeriod: TimePeriod;
};

export function AnalyticsAgentsTab({ timePeriod }: Props) {
  const [showAllAgents, setShowAllAgents] = useState(false);
  const { agents, isLoading } = useBrokerageAnalytics(timePeriod);
  const { data: ancillary } = useAncillaryAnalytics(timePeriod);

  const statusDonut = useMemo(() => selectAgentStatusDonut(agents), [agents]);
  const topGciBars = useMemo(() => selectTopAgentsByGciBars(agents, 10), [agents]);
  const closingsTrend = useMemo(
    () => selectBrokerageClosingsTrend(agents, timePeriod),
    [agents, timePeriod]
  );
  const leaderboard = useMemo(() => selectTopAgentsByClosings(agents, 15), [agents]);

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
        <Box className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Box data-testid="agent-status-donut">
            <Subtitle size="xs" className="mb-2">
              Status mix
            </Subtitle>
            <AnalyticsDonutChart
              data={statusDonut}
              centerLabel={String(agents.length)}
              centerSub="agents"
              height={240}
            />
          </Box>
          <Box data-testid="agent-gci-bars">
            <Subtitle size="xs" className="mb-2">
              Top 10 by GCI ($k)
            </Subtitle>
            <AnalyticsBarChart data={topGciBars} unit="k" height={240} orientation="vertical" />
          </Box>
          <Box data-testid="agent-closings-trend">
            <Subtitle size="xs" className="mb-2">
              Closings trend
            </Subtitle>
            <AnalyticsLineChart data={closingsTrend} height={240} showConfidenceBand={false} />
          </Box>
        </Box>
        <Box className="mb-2 flex items-center justify-between">
          <BodyText size="xs" muted>
            Charts and leaderboard use the full {agents.length}-agent roster. Showing top 15 by
            closings.
          </BodyText>
          <Button type="button" variant="ghost" size="sm" onPress={() => setShowAllAgents(true)}>
            View all agents
          </Button>
        </Box>
        <AnalyticsDataTable
          rows={leaderboard}
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
              key: "stall",
              header: "Stall Stage",
              cellClassName: "py-2 pr-4 font-mono text-xs",
              render: (agent) => agent.stall ?? "-",
            },
            {
              key: "status",
              header: "Status",
              cellClassName: "py-2",
              render: (agent) => (
                <BodyText
                  as="span"
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
              key: "actions",
              header: "Actions",
              render: (agent) => <AgentRowActions agentId={agent.id} agentName={agent.name} />,
            },
          ]}
        />
      </SectionCard>
      <TargetedAgentEngagementPanel period={timePeriod} />
      <AgentRetentionRiskPanel period={timePeriod} />
      {showAllAgents ? (
        <ViewAllAgentsModal
          open
          onClose={() => setShowAllAgents(false)}
          agents={agents}
          ancillaryByAgent={ancillary.by_agent}
          initialSort="closings"
        />
      ) : null}
    </Box>
  );
}
