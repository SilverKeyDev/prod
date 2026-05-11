/// <reference types="nativewind/types" />
import { useCallback } from "react";

import { CommonActions, useNavigation } from "@react-navigation/native";

import { useLocalization } from "packages/contexts";
import { Button } from "packages/ui";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { ProfileAvatar } from "packages/ui/components/avatar";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";

import type { AgentSearchResult, RecommendedAgentResult } from "@/features/agent/api/agent";
import { AgentSearchContent } from "@/features/agent/components/search/AgentSearchContent";
import { useAgentDiscoveryContext } from "@/features/agent/hooks/data/useAgentDiscoveryContext";
import { useRecommendedAgents } from "@/features/agent/hooks/data/useRecommendedAgents";

import type { AgentDiscoveryViewProps } from "./agentDiscoveryView.types";

export function AgentDiscoveryView({
  isActive = true,
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

  const openProfile = useCallback(
    (agent: Pick<AgentSearchResult, "id" | "name">) => {
      if (onOpenAgentProfileProp) {
        onOpenAgentProfileProp(agent);
        return;
      }
      navigation.dispatch(
        CommonActions.navigate({
          name: "AgentProfile",
          params: { agentUserId: agent.id, displayName: agent.name },
        })
      );
    },
    [navigation, onOpenAgentProfileProp]
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
        ) : recommendedAgents.length === 0 ? (
          <Text className="text-text-secondary text-sm">
            {t("agent.discovery_no_recommendations")}
          </Text>
        ) : (
          <Box className="gap-2">
            {recommendedAgents.map((agent: RecommendedAgentResult) => (
              <Box
                key={agent.id}
                className="border-border flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <TouchableBox
                  onPress={() => openProfile(agent)}
                  label={agent.name}
                  className="flex-row items-start gap-3 rounded-lg py-0 active:bg-neutral-50"
                >
                  <Box className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                    <ProfileAvatar
                      imageUrl={agent.profile_picture}
                      label={agent.name?.trim() || "Agent"}
                      imageClassName="h-full w-full"
                    />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Text className="font-medium text-black">{agent.name}</Text>
                    <Text className="text-text-secondary text-sm" numberOfLines={2}>
                      {agent.description?.trim() || agent.email}
                    </Text>
                    {agent.match_reasons?.length ? (
                      <Text className="text-text-disabled mt-1 text-xs">
                        {agent.match_reasons.join(" · ")}
                      </Text>
                    ) : null}
                  </Box>
                </TouchableBox>
              </Box>
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
            connectButtonLabel={t("agent.discovery_connect")}
            onSuccess={onConnectionSuccess}
          />
        </Box>
      </Box>
    </Box>
  );
}
