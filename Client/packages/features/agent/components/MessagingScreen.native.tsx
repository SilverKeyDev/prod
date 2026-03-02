import React, { useCallback, useMemo, useState } from "react";

import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useAuthStore } from "packages/store";
import { Pressable } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

export function MessagingScreenNative() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => !!s.user?.is_agent);
  const { userProfile } = useUserData();
  const { clients, isLoading: isLoadingClients } = useAgentClients();

  const agentId = useMemo(() => {
    let id: string | undefined;
    const raw = userProfile?.agent_id;
    if (raw) {
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          id = Array.isArray(parsed) ? parsed[0] : parsed;
        } catch {
          id = raw.split(",")[0]?.trim();
        }
      } else if (Array.isArray(raw)) {
        id = raw[0];
      }
    }
    return id ?? null;
  }, [userProfile?.agent_id]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const clientMessaging = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id ?? null,
    agentId,
  });

  const agentMessaging = useMessaging({
    mode: "agent",
    conversationSelector: selectedClientId,
    clientIdForSending: selectedClientId ?? undefined,
  });

  const messaging = isAgent ? agentMessaging : clientMessaging;
  const {
    conversations,
    localMessages,
    isLoadingHistory,
    activeConversation,
    sendMessage,
    formatTime,
    canSendMessage,
    refreshChats,
  } = messaging;

  const [inputText, setInputText] = useState("");

  const conversationMap = useMemo(
    () => new Map(conversations.map((conv) => [conv.client_id, conv])),
    [conversations]
  );

  const selectedClient = useMemo(
    () => (isAgent ? (clients.find((client) => client.id === selectedClientId) ?? null) : null),
    [clients, isAgent, selectedClientId]
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !canSendMessage) return;
    setInputText("");
    await sendMessage(text);
  }, [inputText, canSendMessage, sendMessage]);

  if (!authReady) {
    return (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  const isAgentWithoutSelection = isAgent && !selectedClientId;

  if (isAgentWithoutSelection) {
    if (isLoadingClients) {
      return (
        <View style={styles.centered}>
          <Loading />
        </View>
      );
    }

    if (!isLoadingClients && clients.length === 0) {
      return (
        <View style={styles.centered}>
          <Text className="text-gray-600">No clients yet.</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Box className="flex-row items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <Text className="text-base font-semibold text-gray-900">Conversations</Text>
          <Pressable
            onPress={refreshChats}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <Text className="text-sm font-medium text-gray-800">Refresh</Text>
          </Pressable>
        </Box>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const conversation = conversationMap.get(item.id);
            return (
              <Pressable
                onPress={() => {
                  setSelectedClientId(item.id);
                }}
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
      </View>
    );
  }

  if (!isAgent && !canSendMessage) {
    return (
      <View style={styles.centered}>
        <Text className="text-gray-600">No agent assigned yet.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      /* eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform; useFeature is for product rollout, not layout */
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Box className="flex-row items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <Text className="text-base font-semibold text-gray-900">
          {isAgent && selectedClient
            ? `Messaging · ${selectedClient.name ?? selectedClient.email ?? "Client"}`
            : !isAgent && activeConversation?.agent_name
              ? `Messaging · ${activeConversation.agent_name}`
              : "Messaging"}
        </Text>
        <Pressable
          onPress={refreshChats}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2"
        >
          <Text className="text-sm font-medium text-gray-800">Refresh</Text>
        </Pressable>
      </Box>
      {isAgent && selectedClientId && (
        <Pressable
          onPress={() => setSelectedClientId(null)}
          className="border-b border-gray-100 bg-gray-50 px-4 py-2"
        >
          <Text className="text-brand-accent">← Back to conversations</Text>
        </Pressable>
      )}

      {isLoadingHistory ? (
        <View style={styles.centered}>
          <Loading />
        </View>
      ) : (
        <FlatList
          data={localMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text className="text-gray-500">No messages yet. Say hello!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAgent,
              ]}
            >
              <Text className={item.role === "user" ? "text-white" : "text-gray-900"} selectable>
                {item.content}
              </Text>
              <Text
                className={
                  item.role === "user" ? "mt-1 text-xs text-white/80" : "mt-1 text-xs text-gray-500"
                }
              >
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputRow}>
        <Input
          value={inputText}
          onValueChange={setInputText}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3"
          editable={canSendMessage}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || !canSendMessage}
          className="bg-brand-accent ml-2 rounded-lg px-4 py-3"
        >
          <Text className="font-medium text-white">Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  messageBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: color("brand.accent"),
  },
  messageBubbleAgent: {
    alignSelf: "flex-start",
    backgroundColor: color("neutral.100"),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
