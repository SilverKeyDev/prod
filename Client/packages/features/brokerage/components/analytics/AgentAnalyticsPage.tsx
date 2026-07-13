/**
 * AgentAnalyticsPage — SIL-300
 * Per-agent analytics page scoped to a single agent's metrics.
 * Fixture-backed for demo — real data when SIL-207 API lands.
 */
import { useMemo } from "react";

import { color } from "packages/design-tokens";
import {
  AnalyticsBarChart,
  AnalyticsLineChart,
} from "packages/features/brokerage/components/charts";
import {
  BROKERAGE_AGENT_RETENTION_FIXTURE,
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANCILLARY_FIXTURE,
  BROKERAGE_DEAL_FAILURE_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { useNavigation, useRouteParams } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: string;
}) {
  return (
    <Box className="border-border bg-background-surface rounded-xl border p-4">
      <BodyText size="xs" muted>
        {label}
      </BodyText>
      <Title size="lg">{value}</Title>
      {delta && (
        <BodyText size="xs" muted className="mt-1">
          {delta}
        </BodyText>
      )}
    </Box>
  );
}

export function AgentAnalyticsPage() {
  const { agentId } = useRouteParams<{ agentId: string }>();
  const { navigateToPath } = useNavigation();

  const agent = useMemo(
    () => BROKERAGE_AGENTS_FIXTURE.find((a) => a.id === agentId) ?? null,
    [agentId]
  );

  const leakageAgent = useMemo(
    () => BROKERAGE_ANCILLARY_FIXTURE.by_agent.find((a) => a.agent_id === agentId) ?? null,
    [agentId]
  );

  const forensicsAgent = useMemo(
    () => BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent.find((a) => a.agent_id === agentId) ?? null,
    [agentId]
  );

  const retentionAgent = useMemo(
    () => BROKERAGE_AGENT_RETENTION_FIXTURE.agents.find((a) => a.agent_id === agentId) ?? null,
    [agentId]
  );

  const closingsTrend = useMemo(() => {
    if (!agent) return [];
    const monthly = Math.round(agent.closings / 12);
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
      (label, i) => ({
        label,
        value: monthly + Math.round(Math.sin(i * 0.7) * 3),
      })
    );
  }, [agent]);

  const dangerColor = color("state.danger.DEFAULT");
  const successColor = color("state.success.DEFAULT");
  const chartColor1 = color("chart.1");

  if (!agent) {
    return (
      <Box className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <Title size="lg">Agent not found</Title>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onPress={() => navigateToPath("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6 p-6">
      <Box>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onPress={() => navigateToPath("/dashboard")}
        >
          ← Brokerage Analytics
        </Button>
      </Box>

      <Box>
        <Title size="md" as="h2">
          {agent.name}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          Per-agent analytics —{" "}
          <BodyText
            as="span"
            style={{
              color:
                agent.status === "top"
                  ? successColor
                  : agent.status === "at_risk"
                    ? dangerColor
                    : chartColor1,
              fontWeight: 500,
            }}
          >
            {agent.status === "top"
              ? "Top Performer"
              : agent.status === "at_risk"
                ? "At Risk"
                : "Healthy"}
          </BodyText>
        </BodyText>
      </Box>

      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Closings" value={agent.closings} />
        <KpiCard label="Active Clients" value={agent.activeClients} />
        <KpiCard
          label="Fall-Through Rate"
          value={forensicsAgent ? `${forensicsAgent.fall_through_rate_percent}%` : "—"}
          delta={
            forensicsAgent
              ? `${forensicsAgent.cancelled} cancelled of ${forensicsAgent.total_deals} deals`
              : undefined
          }
        />
        <KpiCard
          label="Est. Revenue Leakage"
          value={leakageAgent ? `$${(leakageAgent.total_leakage_dollars / 1000).toFixed(0)}K` : "—"}
        />
      </Box>

      <Box className="border-border bg-background-surface rounded-xl border p-5">
        <Title size="sm" as="h3" className="mb-4">
          Closings Trend (12 Months)
        </Title>
        <AnalyticsLineChart data={closingsTrend} height={220} />
      </Box>

      {leakageAgent && (
        <Box className="border-border bg-background-surface rounded-xl border p-5">
          <Title size="sm" as="h3" className="mb-4">
            Ancillary Attach Rates
          </Title>
          <AnalyticsBarChart
            data={[
              { label: "Title", value: leakageAgent.title_attach },
              { label: "Lending", value: leakageAgent.lending_attach },
            ]}
            orientation="vertical"
            color={chartColor1}
            height={180}
            unit="%"
          />
          <BodyText size="xs" muted className="mt-3">
            Total estimated leakage:{" "}
            <BodyText as="span" style={{ color: dangerColor, fontWeight: 600 }}>
              ${(leakageAgent.total_leakage_dollars / 1000).toFixed(0)}K
            </BodyText>
          </BodyText>
        </Box>
      )}

      {retentionAgent && (
        <Box className="border-border bg-background-surface rounded-xl border p-5">
          <Title size="sm" as="h3" className="mb-4">
            Retention Risk
          </Title>
          <Box className="grid gap-4 sm:grid-cols-3">
            <Box className="rounded-lg bg-gray-50 p-4">
              <BodyText size="xs" muted>
                Risk Score
              </BodyText>
              <Title
                size="md"
                style={{
                  color:
                    retentionAgent.risk_score >= 70
                      ? dangerColor
                      : retentionAgent.risk_score >= 40
                        ? color("state.warning.DEFAULT")
                        : successColor,
                }}
              >
                {retentionAgent.risk_score}
              </Title>
            </Box>
            <Box className="rounded-lg bg-gray-50 p-4">
              <BodyText size="xs" muted>
                Current Split
              </BodyText>
              <Title size="md">{retentionAgent.current_split_percent}%</Title>
            </Box>
            <Box className="rounded-lg bg-gray-50 p-4">
              <BodyText size="xs" muted>
                Market Benchmark
              </BodyText>
              <Title size="md">{retentionAgent.market_benchmark_split_percent}%</Title>
            </Box>
          </Box>
          <BodyText size="xs" muted className="mt-3 italic">
            {retentionAgent.recommended_action}
          </BodyText>
        </Box>
      )}
    </Box>
  );
}
