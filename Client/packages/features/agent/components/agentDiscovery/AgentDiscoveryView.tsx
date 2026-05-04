import { useCallback } from "react";

import { useLocalization } from "packages/contexts";
import { useNavigation } from "packages/navigation";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { ProfileAvatar } from "packages/ui/components/avatar";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { buildAgentProfileUrl } from "packages/utils/agent";

import { BodyText, Title } from "@/components/ui";
import type { AgentSearchResult, RecommendedAgentResult } from "@/features/agent/api/agent";
import { AgentSearchContent } from "@/features/agent/components/search/AgentSearchContent";
import { useAgentDiscoveryContext } from "@/features/agent/hooks/data/useAgentDiscoveryContext";
import { useRecommendedAgents } from "@/features/agent/hooks/data/useRecommendedAgents";

import type { AgentDiscoveryViewProps } from "./agentDiscoveryView.types";

export type { AgentDiscoveryViewProps } from "./agentDiscoveryView.types";

export function AgentDiscoveryView({
  isActive = true,
  onOpenAgentProfile: onOpenAgentProfileProp,
  onConnectionSuccess,
  className = "",
}: AgentDiscoveryViewProps) {
  const { t } = useLocalization();
  const { getCurrentRoute, navigateToPath } = useNavigation();
  const discoveryContext = useAgentDiscoveryContext();
  const { recommendedAgents, isLoading, error, refetch } = useRecommendedAgents(
    discoveryContext,
    isActive
  );

  const openProfile = useCallback(
    (agent: Pick<AgentSearchResult, "id" | "name">) => {
      if (onOpenAgentProfileProp) {
        onOpenAgentProfileProp(agent);
        return;
      }
      const name = agent.name?.trim() || "Agent";
      const { pathname, search } = getCurrentRoute();
      const returnTo = `${pathname}${search}`;
      navigateToPath(buildAgentProfileUrl(agent.id, name), { state: { returnTo } });
    },
    [getCurrentRoute, navigateToPath, onOpenAgentProfileProp]
  );

  const renderRecommendedRow = (agent: RecommendedAgentResult) => (
    <Box
      key={agent.id}
      className="border-border hover:bg-background-base flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        contentAlign="start"
        onClick={() => openProfile(agent)}
        className="flex h-auto min-h-0 flex-1 items-start justify-start gap-3 py-0 text-left"
      >
        <Box className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
          <ProfileAvatar
            imageUrl={agent.profile_picture}
            label={agent.name?.trim() || "Agent"}
            imageClassName="h-full w-full object-cover"
          />
        </Box>
        <Box className="min-w-0 flex-1">
          <Title as="h3" size="sm" className="font-medium text-black">
            {agent.name}
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary line-clamp-2">
            {agent.description?.trim() || agent.email}
          </BodyText>
          {agent.match_reasons?.length ? (
            <BodyText as="p" size="xs" className="text-text-disabled mt-1">
              {agent.match_reasons.join(" · ")}
            </BodyText>
          ) : null}
        </Box>
      </Button>
    </Box>
  );

  return (
    <Box className={`flex flex-col gap-6 text-left ${className}`.trim()}>
      <Box>
        <Title as="h2" size="lg" className="text-text-primary mb-3 font-semibold">
          {t("agent.discovery_recommended_section")}
        </Title>
        {error ? (
          <Box className="flex flex-col gap-2">
            <BodyText size="sm" className="text-text-secondary">
              {error}
            </BodyText>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t("agent.retry")}
            </Button>
          </Box>
        ) : isLoading ? (
          <Box className="flex justify-start py-6">
            <KeyTurnLoader message={t("agent.discovery_loading_recommendations")} />
          </Box>
        ) : recommendedAgents.length === 0 ? (
          <BodyText size="sm" className="text-text-secondary">
            {t("agent.discovery_no_recommendations")}
          </BodyText>
        ) : (
          <Box className="space-y-2">{recommendedAgents.map(renderRecommendedRow)}</Box>
        )}
      </Box>

      <Box>
        <Title as="h2" size="lg" className="text-text-primary mb-3 font-semibold">
          {t("agent.discovery_search_section")}
        </Title>
        <Box className="border-border bg-background-surface overflow-hidden rounded-xl border shadow-sm">
          <AgentSearchContent
            isActive={isActive}
            primaryAction="openProfile"
            onOpenAgentProfile={openProfile}
            connectButtonLabel={t("agent.discovery_connect")}
            onSuccess={onConnectionSuccess}
          />
        </Box>
      </Box>
    </Box>
  );
}
