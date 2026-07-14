/**
 * AgentAnalyticsPage — SIL-300
 * Per-agent analytics scorecard with comprehensive brokerage-grade metrics.
 * Fixture-backed for demo — real data when SIL-207 API lands.
 */
import { useEffect, useMemo } from "react";

import { buildAgentDetailView } from "packages/features/brokerage/utils/analytics/agentDetailTransforms";
import { BROKERAGE_AGENTS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { useNavigation, useRouteParams } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";
import {
  buildBrokerageAgentAnalyticsPath,
  getCanonicalAgentSlug,
  isLegacyAgentId,
  resolveBrokerageAgentIdFromSlug,
} from "packages/utils/growth/agent";

import { AgentDetailAncillaryChart } from "./agentDetail/AgentDetailAncillaryChart";
import { AgentDetailForensics } from "./agentDetail/AgentDetailForensics";
import { AgentDetailHeader } from "./agentDetail/AgentDetailHeader";
import { AgentDetailKpis } from "./agentDetail/AgentDetailKpis";
import { AgentDetailPeerBenchmarks } from "./agentDetail/AgentDetailPeerBenchmarks";
import { AgentDetailProductionChart } from "./agentDetail/AgentDetailProductionChart";
import { AgentDetailRetention } from "./agentDetail/AgentDetailRetention";

export function AgentAnalyticsPage() {
  const { agentSlug } = useRouteParams<{ agentSlug: string }>();
  const { navigateToPath } = useNavigation();

  const resolvedAgentId = useMemo(() => {
    if (!agentSlug) return null;
    return resolveBrokerageAgentIdFromSlug(BROKERAGE_AGENTS_FIXTURE, agentSlug);
  }, [agentSlug]);

  const agentDetailView = useMemo(() => {
    if (!resolvedAgentId) return null;
    return buildAgentDetailView(resolvedAgentId);
  }, [resolvedAgentId]);

  // Handle canonical redirects for legacy IDs or stale slugs
  useEffect(() => {
    if (!agentSlug || !agentDetailView) return;

    const canonicalSlug = getCanonicalAgentSlug(agentDetailView.agent.name);
    const needsRedirect = isLegacyAgentId(agentSlug) || agentSlug.toLowerCase() !== canonicalSlug;

    if (needsRedirect) {
      const canonicalPath = buildBrokerageAgentAnalyticsPath(
        agentDetailView.agent.id,
        agentDetailView.agent.name
      );
      navigateToPath(canonicalPath, { replace: true });
    }
  }, [agentSlug, agentDetailView, navigateToPath]);

  if (!agentDetailView) {
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

  const {
    agent,
    kpis,
    productionSeries,
    peerBenchmarks,
    ancillaryAttach,
    forensicsData,
    retentionAgent,
    engagementAgent,
  } = agentDetailView;

  return (
    <Box className="flex flex-col gap-6 p-6">
      <AgentDetailHeader agent={agent} />

      <AgentDetailKpis kpis={kpis} />

      <Box className="grid gap-6 md:grid-cols-2">
        <AgentDetailProductionChart productionSeries={productionSeries} />
        <AgentDetailPeerBenchmarks peerBenchmarks={peerBenchmarks} />
        <AgentDetailAncillaryChart ancillaryData={ancillaryAttach} />
        <AgentDetailForensics forensicsData={forensicsData} />
      </Box>

      <AgentDetailRetention retentionAgent={retentionAgent} engagementAgent={engagementAgent} />
    </Box>
  );
}
