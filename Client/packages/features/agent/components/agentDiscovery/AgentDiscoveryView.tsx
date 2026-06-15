import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useNavigation } from "packages/navigation";
import { useAuthStore, useUIStore } from "packages/store";
import { Button } from "packages/ui";
import KeyTurnLoader from "packages/ui/components/media/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/structure/primitives";
import { buildAgentProfileUrl, openAgentPublicProfileExternal } from "packages/utils/growth/agent";

import { BodyText, Title } from "@/components/ui";
import type { AgentSearchResult, RecommendedAgentResult } from "@/features/agent/api/agent";
import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { AgentDirectoryRow } from "@/features/agent/components/search/AgentDirectoryRow";
import { AgentSearchContent } from "@/features/agent/components/search/AgentSearchContent";
import { useAgentConnectionDisplayStatus } from "@/features/agent/hooks/data/connections/useAgentConnectionDisplayStatus";
import { useConnectionRequests } from "@/features/agent/hooks/data/connections/useConnectionRequests";
import { useAgentDiscoveryContext } from "@/features/agent/hooks/data/discovery/useAgentDiscoveryContext";
import { useRecommendedAgents } from "@/features/agent/hooks/data/discovery/useRecommendedAgents";
import { hasAgentConnectionRelationship } from "@/features/agent/utils/agentRelationshipSummaries";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

import type { AgentDiscoveryViewProps } from "./agentDiscoveryView.types";

export type { AgentDiscoveryViewProps } from "./agentDiscoveryView.types";

export function AgentDiscoveryView({
  isActive = true,
  profileTarget = "navigate",
  onOpenAgentProfile: onOpenAgentProfileProp,
  onConnectionSuccess,
  className = "",
  suppressRecommendationsLoading = false,
}: AgentDiscoveryViewProps) {
  const { t } = useLocalization();
  const { getCurrentRoute, navigateToPath } = useNavigation();
  const discoveryContext = useAgentDiscoveryContext();
  const { recommendedAgents, isLoading, error, refetch } = useRecommendedAgents(
    discoveryContext,
    isActive
  );
  const { getConnectionStatus } = useAgentConnectionDisplayStatus(isActive);

  const recommendedAgentsToShow = useMemo(
    () =>
      recommendedAgents.filter(
        (agent) => !hasAgentConnectionRelationship(getConnectionStatus(agent.id))
      ),
    [recommendedAgents, getConnectionStatus]
  );
  const config = getMessagingConfig("client").searchModal;
  const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
  const { userProfile } = useUserData();
  const authUser = useAuthStore((s) => s.user);
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const initiatorId = userProfile?.id ?? authUser?.id;

  const [recommendedConnectAgentId, setRecommendedConnectAgentId] = useState<string | null>(null);
  const [recommendedConnectMessage, setRecommendedConnectMessage] = useState("");
  const recommendedConnectMessageRef = useRef("");

  useEffect(() => {
    recommendedConnectMessageRef.current = recommendedConnectMessage;
  }, [recommendedConnectMessage]);

  const openProfile = useCallback(
    (agent: Pick<AgentSearchResult, "id" | "name">) => {
      if (onOpenAgentProfileProp) {
        onOpenAgentProfileProp(agent);
        return;
      }
      if (profileTarget === "external") {
        openAgentPublicProfileExternal(agent);
        return;
      }
      const name = agent.name?.trim() || "Agent";
      const { pathname, search } = getCurrentRoute();
      const returnTo = `${pathname}${search}`;
      navigateToPath(buildAgentProfileUrl(agent.id, name), { state: { returnTo } });
    },
    [getCurrentRoute, navigateToPath, onOpenAgentProfileProp, profileTarget]
  );

  const handleRecommendedSendRequest = useCallback(
    async (agentId: string): Promise<boolean> => {
      if (!initiatorId) {
        enqueueToast({
          type: "error",
          message: "Profile not loaded. Please try again in a moment.",
        });
        return false;
      }
      try {
        const note = recommendedConnectMessageRef.current.trim() || undefined;
        const { alreadyPending } = await createRequestAsInitiator(
          initiatorId,
          agentId,
          false,
          note
        );
        if (alreadyPending) {
          enqueueToast({
            type: "warning",
            message: "A connection request is already pending with this agent.",
          });
          return false;
        }
        enqueueToast({ type: "success", message: "Request sent" });
        setRecommendedConnectMessage("");
        setRecommendedConnectAgentId(null);
        onConnectionSuccess?.();
        return true;
      } catch (err: unknown) {
        enqueueToast({
          type: "error",
          message: connectionRequestApiErrorMessage(err),
        });
        return false;
      }
    },
    [createRequestAsInitiator, enqueueToast, initiatorId, onConnectionSuccess]
  );

  const renderRecommendedRow = (agent: RecommendedAgentResult) => (
    <AgentDirectoryRow
      key={agent.id}
      agent={agent}
      connectionStatus={getConnectionStatus(agent.id)}
      isExpanded={recommendedConnectAgentId === agent.id}
      onExpandConnect={() => setRecommendedConnectAgentId(agent.id)}
      onCollapseConnect={() => {
        setRecommendedConnectAgentId(null);
        setRecommendedConnectMessage("");
      }}
      onOpenProfile={() => openProfile(agent)}
      profileButtonLabel={t("agent.discovery_view_profile")}
      connectButtonLabel={t("agent.discovery_connect")}
      message={recommendedConnectMessage}
      onMessageChange={setRecommendedConnectMessage}
      onSendRequest={() => void handleRecommendedSendRequest(agent.id)}
      isCreatingRequest={isCreatingRequest}
      canSendRequest={Boolean(initiatorId)}
      sendButtonLabel={config.sendButtonLabel}
      cancelButtonLabel="Cancel"
      messageFieldLabel="Message (optional)"
      messagePlaceholder="Add a note (optional)"
    />
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
          suppressRecommendationsLoading ? null : (
            <Box className="flex justify-start py-6">
              <KeyTurnLoader message={t("agent.discovery_loading_recommendations")} />
            </Box>
          )
        ) : recommendedAgentsToShow.length === 0 ? (
          <BodyText size="sm" className="text-text-secondary">
            {t("agent.discovery_no_recommendations")}
          </BodyText>
        ) : (
          <Box className="space-y-2">{recommendedAgentsToShow.map(renderRecommendedRow)}</Box>
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
            profileButtonLabel={t("agent.discovery_view_profile")}
            connectButtonLabel={t("agent.discovery_connect")}
            onSuccess={onConnectionSuccess}
          />
        </Box>
      </Box>
    </Box>
  );
}
