import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Loading from "@ui/asset/loading/Loading";
import Input from "@ui/form/Input";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { useMessaging } from "packages/hooks/data/chat/useMessaging";
import { useAuthStore } from "packages/store";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import { MessagingAgentListSubview } from "@/features/agent/components/messaging/MessagingAgentListSubview.native";
import { MessagingAttachmentMenu } from "@/features/agent/components/messaging/MessagingAttachmentMenu.native";
import { MessagingClientEmptyState } from "@/features/agent/components/messaging/MessagingClientEmptyState.native";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import { MessagingMessageRowNative } from "@/features/agent/components/MessagingMessageRow.native";
import CalendarEventRequestModal from "@/features/agent/components/modals/CalendarEventRequestModal";
import ClientSearchModal from "@/features/agent/components/modals/ClientSearchModal";
import SelectAgreementModal from "@/features/agent/components/modals/SelectAgreementModal";
import SelectDocumentModal from "@/features/agent/components/modals/SelectDocumentModal";
import SelectHomeModal from "@/features/agent/components/modals/SelectHomeModal";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";
import { useAgentMessagingHandlers } from "@/features/messaging/components/AgentMessaging/useAgentMessagingHandlers";
import { useClientMessagingHandlers } from "@/features/messaging/components/ClientMessaging/useClientMessagingHandlers";
import { resolvePrimaryAgentId } from "@/features/messaging/utils";

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
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

export function MessagingScreenNative() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => !!s.user?.is_agent);
  const { userProfile } = useUserData();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations: agentConversations } = useAgentChats();

  const agentId = useMemo(
    () => resolvePrimaryAgentId(userProfile?.agent_id),
    [userProfile?.agent_id]
  );

  const clientMessaging = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id ?? null,
    agentId,
  });

  const [selectedClientId, setSelectedClientId] = useAgentAutoSelectClient(
    clients,
    agentConversations,
    isLoadingClients
  );

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
    activeConversationId,
    sendMessage,
    retryMessage,
    formatTime,
    canSendMessage,
    refreshChats,
    refreshActiveConversationHistory,
  } = messaging;

  const config = useMemo(() => getMessagingConfig(isAgent ? "agent" : "client"), [isAgent]);

  const [inputText, setInputText] = useState("");
  const [inboxMode, setInboxMode] = useState<"conversations" | "requests">("conversations");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showSelectAgreementModal, setShowSelectAgreementModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const listRef = useRef<FlatList>(null);

  const {
    requests,
    isLoading: isLoadingRequests,
    respondToRequest,
    isResponding,
  } = useConnectionRequests();

  const clientHandlers = useClientMessagingHandlers({
    activeConversationId: activeConversationId ?? null,
    agentId,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
  });

  const agentHandlers = useAgentMessagingHandlers({
    selectedClientId,
    activeConversationId: activeConversationId ?? null,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowSelectAgreementModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendMessageApi: sendMessage,
  });

  const handlers = isAgent ? agentHandlers : clientHandlers;
  const acceptedEventRequestIds = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    if (localMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [localMessages.length]);

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
    return (
      <MessagingAgentListSubview
        config={config}
        clients={clients}
        requests={requests}
        isLoadingClients={isLoadingClients}
        isLoadingRequests={isLoadingRequests}
        isResponding={isResponding}
        respondToRequest={respondToRequest}
        refreshChats={refreshChats}
        setSelectedClientId={setSelectedClientId}
        inboxMode={inboxMode}
        setInboxMode={setInboxMode}
        conversationMap={conversationMap}
        listContentStyle={styles.listContent}
        centeredStyle={styles.centered}
        containerStyle={styles.container}
      />
    );
  }

  if (!isAgent && !canSendMessage) {
    return (
      <MessagingClientEmptyState
        title={config.emptyStates.noAgent.title}
        message={config.emptyStates.noAgent.message}
        actionLabel={config.emptyStates.noAgent.actionLabel}
        onAction={() => setShowSearchModal(true)}
        centeredStyle={styles.centered}
      />
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
            ? `Chat with ${selectedClient.name ?? selectedClient.email ?? "Client"}`
            : !isAgent && activeConversation?.agent_name
              ? `Chat with ${activeConversation.agent_name}`
              : config.header.chatTitle}
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
          ref={listRef}
          data={localMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text className="text-base font-medium text-gray-900">
                {config.emptyStates.noMessages.title}
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-500">
                {config.emptyStates.noMessages.message}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <MessagingMessageRowNative
              message={item}
              previousMessage={index > 0 ? localMessages[index - 1] : null}
              mode={isAgent ? "agent" : "client"}
              formatTime={formatTime}
              isMostRecentMessage={index === localMessages.length - 1}
              onRetryMessage={retryMessage}
              onAcceptEventRequest={handlers.handleAcceptEventRequest}
              onCancelEventRequest={handlers.handleCancelEventRequest}
              acceptedEventRequestIds={acceptedEventRequestIds}
              acceptingEventRequestId={acceptingEventRequestId}
            />
          )}
        />
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={() => setShowAttachmentMenu(true)}
          disabled={!canSendMessage}
          className="mr-2 rounded-lg border border-gray-200 bg-white p-3"
        >
          <Text className="text-sm font-medium text-gray-700">+</Text>
        </Pressable>
        <Input
          value={inputText}
          onValueChange={setInputText}
          placeholder={config.input.placeholder}
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

      <MessagingAttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onShareHome={() => setShowSelectHomeModal(true)}
        onShareDocument={() => setShowSelectDocumentModal(true)}
        onCalendarEvent={() => setShowCalendarEventModal(true)}
        onShareAgreement={isAgent ? () => setShowSelectAgreementModal(true) : undefined}
        isAgent={isAgent}
      />

      <ClientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <SelectHomeModal
        isOpen={showSelectHomeModal}
        onClose={() => setShowSelectHomeModal(false)}
        onSelect={handlers.handleSelectHome}
      />
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={() => setShowSelectDocumentModal(false)}
        onSelect={handlers.handleSelectDocument}
      />
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={handlers.handleCalendarEventSuccess}
      />
      {isAgent && (
        <SelectAgreementModal
          isOpen={showSelectAgreementModal}
          onClose={() => setShowSelectAgreementModal(false)}
          onSelect={handlers.handleSelectAgreement}
          clientId={selectedClientId ?? undefined}
        />
      )}
    </KeyboardAvoidingView>
  );
}
