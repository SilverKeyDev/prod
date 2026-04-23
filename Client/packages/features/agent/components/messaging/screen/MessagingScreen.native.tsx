import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import Loading from "@ui/asset/loading/Loading";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { messagingScreenNativeStyles } from "packages/features/agent/components/messaging/screenNative/MessagingScreen.native.styles";
import { MessagingScreenNativeComposer } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeComposer.native";
import { MessagingScreenNativeHeader } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeHeader.native";
import { MessagingScreenNativeMessageList } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeMessageList.native";
import { MessagingScreenNativeOverlays } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeOverlays.native";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import { useDocumentActions, useDocumentsDataIntegration } from "packages/features/documents";
import { useIsAgent } from "packages/features/homeauth";
import { useAgentChats, useMessaging } from "packages/features/messaging";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { showErrorToast, useMessagingHandlers } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";

import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";
import { resolvePrimaryAgentId } from "@/features/messaging/utils";

import { MessagingAgentListSubview } from "./MessagingAgentListSubview.native";
import { MessagingClientEmptyState } from "./MessagingClientEmptyState.native";
import { getMessagingConfig } from "./messagingConfig";

const styles = messagingScreenNativeStyles;

export function MessagingScreenNative() {
  const navigation = useNavigation();
  const { t } = useLocalization();
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
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
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  } = useDocumentActions();

  const documentHandlers = useMemo(
    () => ({
      handleViewDocument,
      handleDownloadDocument,
      handleShareDocument,
    }),
    [handleViewDocument, handleDownloadDocument, handleShareDocument]
  );

  const {
    documents,
    agreementSigningSession,
    dismissAgreementSigning,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    onAgreementSigningComplete,
    openAgreementPdfViewer,
    signAgreementNow,
  } = useDocumentsDataIntegration(undefined, documentHandlers);

  const handleMessagingAgreementView = useCallback(
    (agreementId: string, documentName: string) => {
      openAgreementPdfViewer(agreementId, documentName);
    },
    [openAgreementPdfViewer]
  );

  const handleMessagingAgreementSignNow = useCallback(
    (agreementId: string) => {
      const row = documents.find((d) => d.id === agreementId && d.library_kind === "agreement");
      if (!row) {
        showErrorToast("This agreement is not in your documents yet. Open Saved and try again.");
        return;
      }
      void signAgreementNow(row).catch((err: unknown) => {
        showErrorToast(err instanceof Error ? err.message : "Failed to open signing");
      });
    },
    [documents, signAgreementNow]
  );

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
    acknowledgeActiveConversationAsRead,
  } = messaging;

  const config = useMemo(() => getMessagingConfig(isAgent ? "agent" : "client"), [isAgent]);

  const [inputText, setInputText] = useState("");
  const [inboxMode, setInboxMode] = useState<"conversations" | "requests">("conversations");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const {
    requests,
    isLoading: isLoadingRequests,
    respondToRequest,
    isResponding,
  } = useConnectionRequests();

  const clientHandlers = useMessagingHandlers({
    mode: "client",
    activeConversationId: activeConversationId ?? null,
    agentId,
    clientUserId: userProfile?.id ?? null,
    activeConversation: activeConversation ?? null,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendSharedHomes: clientMessaging.sendSharedHomes,
    sendSharedDocument: clientMessaging.sendSharedDocument,
  });

  const agentHandlers = useMessagingHandlers({
    mode: "agent",
    selectedClientId,
    activeConversationId: activeConversationId ?? null,
    activeConversation: activeConversation ?? null,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendSharedHomes: agentMessaging.sendSharedHomes,
    sendSharedDocument: agentMessaging.sendSharedDocument,
  });

  const handlers = isAgent ? agentHandlers : clientHandlers;
  const acceptedEventRequestIds = useMemo(() => new Set<string>(), []);

  useFocusEffect(
    useCallback(() => {
      acknowledgeActiveConversationAsRead();
    }, [acknowledgeActiveConversationAsRead])
  );

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
        secondaryActionLabel={t("agent.discovery_browse_full")}
        onSecondaryAction={() =>
          navigation.dispatch(CommonActions.navigate({ name: "FindAgents" }))
        }
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
      <MessagingScreenNativeHeader
        config={config}
        isAgent={isAgent}
        selectedClient={selectedClient}
        selectedClientId={selectedClientId}
        activeConversation={activeConversation}
        onRefreshChats={refreshChats}
        onBackToConversations={() => setSelectedClientId(null)}
      />

      <MessagingScreenNativeMessageList
        listRef={listRef}
        localMessages={localMessages}
        isLoadingHistory={isLoadingHistory}
        centeredStyle={styles.centered}
        listContentStyle={styles.listContent}
        isAgent={isAgent}
        formatTime={formatTime}
        retryMessage={retryMessage}
        handlers={handlers}
        acceptedEventRequestIds={acceptedEventRequestIds}
        acceptingEventRequestId={acceptingEventRequestId}
        onAgreementViewDocument={handleMessagingAgreementView}
        onAgreementSignNow={handleMessagingAgreementSignNow}
        emptyState={config.emptyStates.noMessages}
      />

      <MessagingScreenNativeComposer
        inputText={inputText}
        onInputTextChange={setInputText}
        canSendMessage={canSendMessage}
        config={config}
        onSend={handleSend}
        onOpenAttachmentMenu={() => setShowAttachmentMenu(true)}
        inputRowStyle={styles.inputRow}
      />

      <MessagingScreenNativeOverlays
        showAttachmentMenu={showAttachmentMenu}
        onCloseAttachmentMenu={() => setShowAttachmentMenu(false)}
        onShareHome={() => setShowSelectHomeModal(true)}
        onShareDocument={() => setShowSelectDocumentModal(true)}
        onCalendarEvent={() => setShowCalendarEventModal(true)}
        showSearchModal={showSearchModal}
        onCloseSearchModal={() => setShowSearchModal(false)}
        showSelectHomeModal={showSelectHomeModal}
        onCloseSelectHomeModal={() => setShowSelectHomeModal(false)}
        onSelectHomes={handlers.handleSelectHomes}
        showSelectDocumentModal={showSelectDocumentModal}
        onCloseSelectDocumentModal={() => setShowSelectDocumentModal(false)}
        onSelectDocument={handlers.handleSelectDocument}
        showCalendarEventModal={showCalendarEventModal}
        onCloseCalendarEventModal={() => setShowCalendarEventModal(false)}
        onCalendarEventSuccess={handlers.handleCalendarEventSuccess}
        sendMessage={sendMessage}
        currentPdf={currentPdf}
        currentDocumentId={currentDocumentId}
        currentDocumentName={currentDocumentName}
        onClosePdfModal={closePdfModal}
        agreementSigningSession={agreementSigningSession}
        onDismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
        viewSignedAgreement={viewSignedAgreement}
        onDismissViewSignedAgreement={dismissViewSignedAgreement}
      />
    </KeyboardAvoidingView>
  );
}
