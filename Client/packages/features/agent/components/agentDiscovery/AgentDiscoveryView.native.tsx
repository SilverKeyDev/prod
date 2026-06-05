/// <reference types="nativewind/types" />
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CommonActions, useNavigation } from "@react-navigation/native";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore, useUIStore } from "packages/store";
import { Button } from "packages/ui";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { openAgentPublicProfileExternal } from "packages/utils/growth/agent";

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

export function AgentDiscoveryView({
  isActive = true,
  profileTarget = "navigate",
  onOpenAgentProfile: onOpenAgentProfileProp,
  onConnectionSuccess,
}: AgentDiscoveryViewProps) {
  const navigation = useNavigation();
  const { t } = useLocalization();
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
      navigation.dispatch(
        CommonActions.navigate({
          name: "AgentProfile",
          params: { agentUserId: agent.id, displayName: agent.name },
        })
      );
    },
    [navigation, onOpenAgentProfileProp, profileTarget]
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

  return (
    <Box className="flex flex-col gap-6 text-left">
      <Box>
        <Text className="text-text-primary mb-3 text-lg font-semibold">
          {t("agent.discovery_recommended_section")}
        </Text>
        {error ? (
          <Box className="flex flex-col gap-2">
            <Text className="text-text-secondary text-sm">{error}</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => void refetch()}
              className="self-start"
            >
              {t("agent.retry")}
            </Button>
          </Box>
        ) : isLoading ? (
          <Box className="flex justify-start py-6">
            <Loading />
          </Box>
        ) : recommendedAgentsToShow.length === 0 ? (
          <Text className="text-text-secondary text-sm">
            {t("agent.discovery_no_recommendations")}
          </Text>
        ) : (
          <Box className="gap-2">
            {recommendedAgentsToShow.map((agent: RecommendedAgentResult) => (
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
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Text className="text-text-primary mb-3 text-lg font-semibold">
          {t("agent.discovery_search_section")}
        </Text>
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
