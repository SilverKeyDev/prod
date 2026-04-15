import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Loading from "@ui/asset/loading/Loading";
import Input from "@ui/form/Input";
import PdfModal from "@ui/modals/PdfModal";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import WebView from "react-native-webview";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import { useAgentClients } from "packages/features/agent/hooks/data/useAgentClients";
import {
  DocuSignLegalNotice,
  EmbeddedSigning,
  useDocumentActions,
  useDocumentsDataIntegration,
  ViewSignedDocument,
} from "packages/features/documents";
import { useIsAgent } from "packages/features/homeauth";
import { useAgentChats, useMessaging } from "packages/features/messaging";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { showErrorToast, useMessagingHandlers } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";
import { BaseModal } from "packages/ui/components/modals";
import { Portal } from "packages/ui/components/portal";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

import { MessagingAgentListSubview } from "@/features/agent/components/messaging/MessagingAgentListSubview.native";
import { MessagingAttachmentMenu } from "@/features/agent/components/messaging/MessagingAttachmentMenu.native";
import { MessagingClientEmptyState } from "@/features/agent/components/messaging/MessagingClientEmptyState.native";
import { getMessagingConfig } from "@/features/agent/components/messagingConfig";
import { MessagingMessageRowNative } from "@/features/agent/components/MessagingMessageRow.native";
import CalendarEventRequestModal from "@/features/agent/components/modals/CalendarEventRequestModal";
import ClientSearchModal from "@/features/agent/components/modals/ClientSearchModal";
import SelectDocumentModal from "@/features/agent/components/modals/SelectDocumentModal";
import SelectHomeModal from "@/features/agent/components/modals/SelectHomeModal";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";
import { resolvePrimaryAgentId } from "@/features/messaging/utils";

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: color("border"),
    backgroundColor: color("background-base"),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});

export function MessagingScreenNative() {
  const { t } = useLocalization();
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
  const { userProfile } = useUserData();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations: agentConversations } = useAgentChats();

  const agentId = useMemo(
    () => resolvePrimaryAgentId(userProfile?.agent_id),
    [userProfile?.agent_id],
  );

  const clientMessaging = useMessaging({
    mode: "client",
    conversationSelector: userProfile?.id ?? null,
    agentId,
  });

  const [selectedClientId, setSelectedClientId] = useAgentAutoSelectClient(
    clients,
    agentConversations,
    isLoadingClients,
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
    [handleViewDocument, handleDownloadDocument, handleShareDocument],
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
    [openAgreementPdfViewer],
  );

  const handleMessagingAgreementSignNow = useCallback(
    (agreementId: string) => {
      const row = documents.find(
        (d) => d.id === agreementId && d.library_kind === "agreement",
      );
      if (!row) {
        showErrorToast(
          "This agreement is not in your documents yet. Open Saved and try again.",
        );
        return;
      }
      void signAgreementNow(row).catch((err: unknown) => {
        showErrorToast(
          err instanceof Error ? err.message : "Failed to open signing",
        );
      });
    },
    [documents, signAgreementNow],
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
  } = messaging;

  const config = useMemo(
    () => getMessagingConfig(isAgent ? "agent" : "client"),
    [isAgent],
  );

  const [inputText, setInputText] = useState("");
  const [inboxMode, setInboxMode] = useState<"conversations" | "requests">(
    "conversations",
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<
    string | null
  >(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const listRef = useRef<FlatList>(null);

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
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendSharedHome: clientMessaging.sendSharedHome,
    sendSharedDocument: clientMessaging.sendSharedDocument,
  });

  const agentHandlers = useMessagingHandlers({
    mode: "agent",
    selectedClientId,
    activeConversationId: activeConversationId ?? null,
    activeConversation,
    setShowSelectHomeModal,
    setShowSelectDocumentModal,
    setShowCalendarEventModal,
    setAcceptingEventRequestId,
    refreshActiveConversationHistory,
    refreshChats,
    sendSharedHome: agentMessaging.sendSharedHome,
    sendSharedDocument: agentMessaging.sendSharedDocument,
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
    [conversations],
  );

  const selectedClient = useMemo(
    () =>
      isAgent
        ? clients.find((client) => client.id === selectedClientId) ?? null
        : null,
    [clients, isAgent, selectedClientId],
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
      <Box className="border-border bg-background-base flex-row items-center justify-between border-b px-4 py-3">
        <Text className="text-text-primary text-base font-semibold">
          {isAgent && selectedClient
            ? `Chat with ${
                selectedClient.name ?? selectedClient.email ?? "Client"
              }`
            : !isAgent && activeConversation?.agent_name
              ? `Chat with ${activeConversation.agent_name}`
              : config.header.chatTitle}
        </Text>
        <Pressable
          onPress={refreshChats}
          className="border-border bg-background-surface rounded-lg border px-3 py-2"
        >
          <Text className="text-text-primary text-sm font-medium">
            {t("agent.refresh")}
          </Text>
        </Pressable>
      </Box>
      {isAgent && selectedClientId && (
        <Pressable
          onPress={() => setSelectedClientId(null)}
          className="border-border bg-background-base border-b px-4 py-2"
        >
          <Text className="text-primary">
            {t("agent.back_to_conversations")}
          </Text>
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
              <Text className="text-text-primary text-base font-medium">
                {config.emptyStates.noMessages.title}
              </Text>
              <Text className="text-text-secondary mt-1 text-center text-sm">
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
              onAgreementViewDocument={handleMessagingAgreementView}
              onAgreementSignNow={handleMessagingAgreementSignNow}
            />
          )}
        />
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={() => setShowAttachmentMenu(true)}
          disabled={!canSendMessage}
          className="border-border bg-background-surface mr-2 rounded-lg border p-3"
        >
          <Text className="text-text-secondary text-sm font-medium">+</Text>
        </Pressable>
        <Input
          value={inputText}
          onValueChange={setInputText}
          placeholder={config.input.placeholder}
          className="border-border bg-background-surface flex-1 rounded-lg border px-4 py-3"
          editable={canSendMessage}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || !canSendMessage}
          className="bg-primary ml-2 rounded-lg px-4 py-3"
        >
          <Text className="font-medium text-white">{t("agent.send")}</Text>
        </Pressable>
      </View>

      <MessagingAttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onShareHome={() => setShowSelectHomeModal(true)}
        onShareDocument={() => setShowSelectDocumentModal(true)}
        onCalendarEvent={() => setShowCalendarEventModal(true)}
      />

      <ClientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
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
        sendCalendarEventMessage={sendMessage}
      />

      {currentPdf ? (
        <Portal>
          <PdfModal
            currentPdf={currentPdf}
            currentReportAddress={currentDocumentName}
            reportId={currentDocumentId}
            onClose={closePdfModal}
          />
        </Portal>
      ) : null}
      {agreementSigningSession?.kind === "embedded" ? (
        <BaseModal
          isOpen
          onClose={dismissAgreementSigning}
          title="Sign document"
          size="full"
          showCloseButton
          closeOnBackdropClick={false}
        >
          <EmbeddedSigning
            agreementId={agreementSigningSession.agreementId}
            participantId={agreementSigningSession.participantId}
            onComplete={onAgreementSigningComplete}
            pdfViewerTitle={agreementSigningSession.pdfViewerTitle}
          />
        </BaseModal>
      ) : agreementSigningSession?.kind === "sender_url" ? (
        <BaseModal
          isOpen
          onClose={dismissAgreementSigning}
          title="Sign or correct document"
          size="full"
          showCloseButton
          closeOnBackdropClick={false}
        >
          <DocuSignLegalNotice variant="sender_url_iframe" />
          <View style={{ minHeight: spacing(100), flex: 1 }}>
            <WebView
              source={{ uri: agreementSigningSession.url }}
              style={{ flex: 1, minHeight: spacing(100) }}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        </BaseModal>
      ) : null}
      {viewSignedAgreement ? (
        <BaseModal
          isOpen
          onClose={dismissViewSignedAgreement}
          title={viewSignedAgreement.title}
          size="full"
          showCloseButton
        >
          <ViewSignedDocument
            agreementId={viewSignedAgreement.agreementId}
            title={viewSignedAgreement.title}
            onClose={dismissViewSignedAgreement}
          />
        </BaseModal>
      ) : null}
    </KeyboardAvoidingView>
  );
}
