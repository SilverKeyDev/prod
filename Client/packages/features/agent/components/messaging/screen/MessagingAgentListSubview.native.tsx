import React, { useMemo } from "react";

import { FlatList, View } from "react-native";

import { useLocalization } from "packages/contexts";
import type { AgentClient } from "packages/features/agent/api/agent";
import AgentClientListRow from "packages/features/agent/components/clientList/AgentClientListRow";
import { getMessagePreview } from "packages/features/messaging/utils/messagePreview";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { SIDEBAR_INSET_LIST_ROW_FLAT_NATIVE } from "packages/ui/components/sidebar/sidebarTheme";

import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import {
  type AgentClientSortConversation,
  sortAgentClients,
} from "@/features/agent/utils/agentClientListSort";
import { agentClientActionFromConversation } from "@/features/agent/utils/clientList/agentClientListRowHelpers";

type MessagingAgentListSubviewProps = {
  config: MessagingConfig;
  clients: AgentClient[];
  isLoadingClients: boolean;
  refreshChats: () => void;
  setSelectedClientId: (id: string) => void;
  conversationMap: Map<string, AgentClientSortConversation>;
  listContentStyle: {
    padding: number;
    paddingBottom: number;
    flexGrow: number;
  };
  centeredStyle: {
    flex: number;
    justifyContent: "center";
    alignItems: "center";
    padding: number;
  };
  containerStyle: { flex: number };
};

/** Agent messaging client list. Inbound client connection requests are auto-accepted server-side (no requests tab). */
export function MessagingAgentListSubview({
  config,
  clients,
  isLoadingClients,
  refreshChats,
  setSelectedClientId,
  conversationMap,
  listContentStyle,
  centeredStyle,
  containerStyle,
}: MessagingAgentListSubviewProps) {
  const { t } = useLocalization();
  const sortedClients = useMemo(
    () =>
      sortAgentClients(clients, "recent", conversationMap, (client) =>
        agentClientActionFromConversation(client, conversationMap.get(client.id))
      ),
    [clients, conversationMap]
  );

  if (isLoadingClients) {
    return (
      <View style={centeredStyle}>
        <Loading />
      </View>
    );
  }

  if (clients.length === 0) {
    return (
      <View style={centeredStyle}>
        <Text className="text-text-secondary text-center">
          {config.emptyStates.noSelection.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Box className="border-border bg-background-surface border-b px-4 py-3">
        <Box className="flex-row items-center justify-between">
          <Text className="text-text-primary text-base font-semibold">{config.sidebar.title}</Text>
          <Pressable
            onPress={refreshChats}
            className="border-border bg-background-surface rounded-lg border px-3 py-2"
          >
            <Text className="text-text-primary text-sm font-medium">{t("agent.refresh")}</Text>
          </Pressable>
        </Box>
      </Box>
      <FlatList
        data={sortedClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={listContentStyle}
        renderItem={({ item }) => {
          const conversation = conversationMap.get(item.id);
          const messagePreview = conversation?.last_message
            ? getMessagePreview({ content: conversation.last_message })
            : null;
          return (
            <Pressable
              onPress={() => setSelectedClientId(item.id)}
              className={SIDEBAR_INSET_LIST_ROW_FLAT_NATIVE}
            >
              <AgentClientListRow
                embedded
                client={item}
                conversation={conversation}
                variant="sidebar"
                detailLine={messagePreview ?? item.email ?? undefined}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
