import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useFocusEffect } from "@react-navigation/native";
import type { FlatList } from "react-native";

import { getMessagingConfig } from "packages/features/agent/components/messaging/screen/messagingConfig";
import { useAgentClients } from "packages/features/agent/hooks/data/clients/useAgentClients";
import { useDocumentActions, useDocumentsDataIntegration } from "packages/features/documents";
import { useIsAgent } from "packages/features/homeauth";
import { useAgentChats, useMessaging } from "packages/features/messaging";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { showErrorToast, useMessagingHandlers } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";

import { useAgentAutoSelectClient } from "@/features/agent/hooks/ui/useAgentAutoSelectClient";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";

export function useMessagingScreenNativeController() {
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useIsAgent();
  const { userProfile } = useUserData();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations: agentConversations } = useAgentChats();

  const agentId = useMemo(() => null, []);

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
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
  } = messaging;

  const config = useMemo(() => getMessagingConfig(isAgent ? "agent" : "client"), [isAgent]);

  const [inputText, setInputText] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

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

  const prevListLenRef = useRef(0);
  const prevFirstMessageIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const len = localMessages.length;
    const firstId = localMessages[0]?.id;
    const prevLen = prevListLenRef.current;
    const prevFirst = prevFirstMessageIdRef.current;

    const isPrepend =
      len > prevLen &&
      prevLen > 0 &&
      firstId !== undefined &&
      prevFirst !== undefined &&
      firstId !== prevFirst;

    prevListLenRef.current = len;
    prevFirstMessageIdRef.current = firstId;

    if (isPrepend) {
      return;
    }
    if (len > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [localMessages]);

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

  const isAgentWithoutSelection = isAgent && !selectedClientId;

  return {
    authReady,
    isAgent,
    isAgentWithoutSelection,
    canSendMessage,
    config,
    clients,
    isLoadingClients,
    selectedClientId,
    setSelectedClientId,
    conversationMap,
    refreshChats,
    selectedClient,
    listRef,
    localMessages,
    isLoadingHistory,
    formatTime,
    retryMessage,
    handlers,
    acceptedEventRequestIds,
    acceptingEventRequestId,
    handleMessagingAgreementView,
    handleMessagingAgreementSignNow,
    hasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
    inputText,
    setInputText,
    handleSend,
    showAttachmentMenu,
    setShowAttachmentMenu,
    showSearchModal,
    setShowSearchModal,
    showSelectHomeModal,
    setShowSelectHomeModal,
    showSelectDocumentModal,
    setShowSelectDocumentModal,
    showCalendarEventModal,
    setShowCalendarEventModal,
    sendMessage,
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    activeConversation,
    activeConversationId,
  };
}
