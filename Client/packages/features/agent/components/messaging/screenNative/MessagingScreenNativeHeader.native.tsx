import React from "react";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";

type ClientRow = { id: string; name?: string | null; email?: string | null };

type MessagingScreenNativeHeaderProps = {
  config: MessagingConfig;
  isAgent: boolean;
  selectedClient: ClientRow | null;
  selectedClientId: string | null;
  activeConversation: AgentConversation | null | undefined;
  onRefreshChats: () => void;
  onBackToConversations: () => void;
};

export function MessagingScreenNativeHeader({
  config,
  isAgent,
  selectedClient,
  selectedClientId,
  activeConversation,
  onRefreshChats,
  onBackToConversations,
}: MessagingScreenNativeHeaderProps) {
  const { t } = useLocalization();

  return (
    <>
      <Box className="border-border bg-background-base flex-row items-center justify-between border-b px-4 py-3">
        <Text className="text-text-primary text-base font-semibold">
          {isAgent && selectedClient
            ? `Chat with ${selectedClient.name ?? selectedClient.email ?? "Client"}`
            : !isAgent && activeConversation?.agent_name
              ? `Chat with ${activeConversation.agent_name}`
              : config.header.chatTitle}
        </Text>
        <Pressable
          onPress={onRefreshChats}
          className="border-border bg-background-surface rounded-lg border px-3 py-2"
        >
          <Text className="text-text-primary text-sm font-medium">{t("agent.refresh")}</Text>
        </Pressable>
      </Box>
      {isAgent && selectedClientId && (
        <Pressable
          onPress={onBackToConversations}
          className="border-border bg-background-base border-b px-4 py-2"
        >
          <Text className="text-primary">{t("agent.back_to_conversations")}</Text>
        </Pressable>
      )}
    </>
  );
}
