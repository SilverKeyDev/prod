import React from "react";

import { FlatList, View } from "react-native";

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
        <Text className="text-center text-gray-600">{config.emptyStates.noSelection.message}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Box className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <Box className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">{config.sidebar.title}</Text>
          <Pressable
            onPress={refreshChats}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <Text className="text-sm font-medium text-gray-800">Refresh</Text>
          </Pressable>
        </Box>
        <Box className="mt-1 flex-row rounded-lg bg-neutral-100 p-1">
          <Pressable
            onPress={() => setInboxMode("conversations")}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              inboxMode === "conversations" ? "bg-white" : "bg-transparent"
            }`}
          >
            <Text
              className={
                inboxMode === "conversations"
                  ? "text-sm font-semibold text-gray-900"
                  : "text-sm font-medium text-gray-600"
              }
            >
              Conversations
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setInboxMode("requests")}
            className={`flex-1 rounded-md px-3 py-1.5 ${
              inboxMode === "requests" ? "bg-white" : "bg-transparent"
            }`}
          >
            <Text
              className={
                inboxMode === "requests"
                  ? "text-sm font-semibold text-gray-900"
                  : "text-sm font-medium text-gray-600"
              }
            >
              Requests
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
                className="border-b border-gray-100 px-4 py-4"
              >
                <Text className="font-medium text-gray-900">
                  {item.name ?? item.email ?? "Client"}
                </Text>
                {conversation?.last_message && (
                  <Text className="mt-1 text-sm text-gray-500" numberOfLines={1}>
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
          <Text className="text-center text-gray-600">No pending connection requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={listContentStyle}
          renderItem={({ item }) => (
            <Box className="mb-3 rounded-lg border border-gray-200 bg-white p-4">
              <Text className="text-base font-semibold text-gray-900">
                {item.other_party_name ?? "Unknown"}
              </Text>
              {!!item.other_party_email && (
                <Text className="mt-1 text-sm text-gray-600">{item.other_party_email}</Text>
              )}
              {!!item.message && <Text className="mt-2 text-sm text-gray-800">{item.message}</Text>}
              <Text className="mt-1 text-xs text-gray-500">
                {item.requested_by_agent
                  ? "Agent requested to connect"
                  : "Client requested to connect"}
              </Text>
              <Box className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={() => respondToRequest(item.id, true)}
                  disabled={isResponding}
                  className="bg-brand-accent flex-1 items-center rounded-lg px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-white">Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => respondToRequest(item.id, false)}
                  disabled={isResponding}
                  className="flex-1 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <Text className="text-sm font-semibold text-gray-900">Reject</Text>
                </Pressable>
              </Box>
            </Box>
          )}
        />
      )}
    </View>
  );
}
