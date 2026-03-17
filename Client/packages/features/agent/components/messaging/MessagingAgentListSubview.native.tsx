import React from "react";

import { FlatList, View } from "react-native";

import { useLocalization } from "packages/contexts";
import type { AgentClient, AgentConnectionRequest } from "packages/features/agent/api/agent";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import type { MessagingConfig } from "@/features/agent/components/messagingConfig";

type MessagingAgentListSubviewProps = {
  config: MessagingConfig;
  clients: AgentClient[];
  requests: AgentConnectionRequest[];
  isLoadingClients: boolean;
  isLoadingRequests: boolean;
  isResponding: boolean;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  refreshChats: () => void;
  setSelectedClientId: (id: string) => void;
  inboxMode: "conversations" | "requests";
  setInboxMode: (mode: "conversations" | "requests") => void;
  conversationMap: Map<string, { last_message?: string }>;
  listContentStyle: { padding: number; paddingBottom: number; flexGrow: number };
  centeredStyle: {
    flex: number;
    justifyContent: "center";
    alignItems: "center";
    padding: number;
  };
  containerStyle: { flex: number };
};

export function MessagingAgentListSubview({
  config,
  clients,
  requests,
  isLoadingClients,
  isLoadingRequests,
  isResponding,
  respondToRequest,
  refreshChats,
  setSelectedClientId,
  inboxMode,
  setInboxMode,
  conversationMap,
  listContentStyle,
  centeredStyle,
  containerStyle,
}: MessagingAgentListSubviewProps) {
  const { t } = useLocalization();
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
      <Box className="border-border bg-background-base border-b px-4 py-3">
        <Box className="mb-2 flex-row items-center justify-between">
          <Text className="text-text-primary text-base font-semibold">{config.sidebar.title}</Text>
          <Pressable
            onPress={refreshChats}
            className="border-border bg-background-surface rounded-lg border px-3 py-2"
          >
            <Text className="text-text-primary text-sm font-medium">{t("agent.refresh")}</Text>
          </Pressable>
        </Box>
        <Box className="bg-primary-muted mt-1 flex-row rounded-lg p-1">
          <Pressable
            onPress={() => setInboxMode("conversations")}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              inboxMode === "conversations" ? "bg-background-surface" : "bg-transparent"
            }`}
          >
            <Text
              className={
                inboxMode === "conversations"
                  ? "text-text-primary text-sm font-semibold"
                  : "text-text-secondary text-sm font-medium"
              }
            >
              {t("agent.conversations")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setInboxMode("requests")}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              inboxMode === "requests" ? "bg-background-surface" : "bg-transparent"
            }`}
          >
            <Text
              className={
                inboxMode === "requests"
                  ? "text-text-primary text-sm font-semibold"
                  : "text-text-secondary text-sm font-medium"
              }
            >
              {t("agent.requests")}
            </Text>
          </Pressable>
        </Box>
      </Box>
      {inboxMode === "conversations" ? (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const conversation = conversationMap.get(item.id);
            return (
              <Pressable
                onPress={() => setSelectedClientId(item.id)}
                className="border-border border-b px-4 py-4"
              >
                <Text className="text-text-primary font-medium">
                  {item.name ?? item.email ?? "Client"}
                </Text>
                {conversation?.last_message && (
                  <Text className="text-text-secondary mt-1 text-sm" numberOfLines={1}>
                    {conversation.last_message}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      ) : isLoadingRequests ? (
        <View style={centeredStyle}>
          <Loading />
        </View>
      ) : requests.length === 0 ? (
        <View style={centeredStyle}>
          <Text className="text-text-secondary text-center">
            {t("agent.no_pending_connection_requests")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={listContentStyle}
          renderItem={({ item }) => (
            <Box className="border-border bg-background-surface mb-3 rounded-lg border p-4">
              <Text className="text-text-primary text-base font-semibold">
                {item.other_party_name ?? "Unknown"}
              </Text>
              {!!item.other_party_email && (
                <Text className="text-text-secondary mt-1 text-sm">{item.other_party_email}</Text>
              )}
              {!!item.message && (
                <Text className="text-text-primary mt-2 text-sm">{item.message}</Text>
              )}
              <Text className="text-text-secondary mt-1 text-xs">
                {item.requested_by_agent
                  ? t("agent.agent_requested_to_connect")
                  : t("agent.client_requested_to_connect")}
              </Text>
              <Box className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={() => respondToRequest(item.id, true)}
                  disabled={isResponding}
                  className="bg-primary flex-1 items-center rounded-lg px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-white">{t("agent.accept")}</Text>
                </Pressable>
                <Pressable
                  onPress={() => respondToRequest(item.id, false)}
                  disabled={isResponding}
                  className="border-border bg-background-base flex-1 items-center rounded-lg border px-3 py-2"
                >
                  <Text className="text-text-primary text-sm font-semibold">
                    {t("agent.reject")}
                  </Text>
                </Pressable>
              </Box>
            </Box>
          )}
        />
      )}
    </View>
  );
}
