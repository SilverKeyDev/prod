import React, { useCallback, useMemo } from "react";

import type { AgentConversation } from "packages/api";
import { useLocalization } from "packages/contexts";
import {
  useDocumentActions,
  useDocumentsDataIntegration,
} from "packages/features/documents";
import type { SearchResult } from "packages/features/search";
import { useSavedHomesData } from "packages/hooks/data/useSavedHomesData";
import { showErrorToast } from "packages/hooks/ui";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { buildPropertyUrl } from "packages/utils/property/slug";

import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messagingConfig";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";

import {
  UnifiedMessagesListAgentBlockedEmpty,
  UnifiedMessagesListClientNoAgentEmpty,
  UnifiedMessagesListLoadingHistory,
  UnifiedMessagesListNoMessagesYet,
} from "./UnifiedMessagesListEmptyStates";
import { UnifiedMessagesListOverlays } from "./UnifiedMessagesListOverlays";
import { UnifiedMessageThreadRow } from "./UnifiedMessageThreadRow";

type UnifiedMessagesListProps = {
  mode: MessagingMode;
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ChatMessage[];
  isTyping: boolean;
  formatTime: (date: Date) => string;
  onSearchClick?: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  selectedClientName?: string;
  onRetryMessage?: (messageId: string) => void;
  activeConversation?: AgentConversation | null;
  onAcceptEventRequest?: (
    messageId: string,
    payload: EventRequestPayload,
  ) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds?: Set<string>;
  acceptingEventRequestId?: string | null;
};

export default function UnifiedMessagesList({
  mode,
  canSendMessage,
  isLoadingHistory,
  localMessages,
  formatTime: _formatTime,
  isTyping: _isTyping,
  onSearchClick,
  messagesEndRef,
  selectedClientName,
  onRetryMessage,
  activeConversation,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptedEventRequestIds = new Set(),
  acceptingEventRequestId = null,
}: UnifiedMessagesListProps) {
  const { t } = useLocalization();
  const config = getMessagingConfig(mode);
  const { getSavedHome, isHomeSaved, saveHome, removeSavedHome } =
    useSavedHomesData();
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

  const { navigateToPath } = useNavigation();
  const viewerUserId = useAuthStore((s) => s.user?.id ?? null);

  const openSharedHomeDetails = useCallback(
    (property: SearchResult) => {
      const zpid = property.zpid ?? property.id;
      const address =
        typeof property.address === "string"
          ? property.address
          : property.address && typeof property.address === "object"
            ? Object.values(property.address).filter(Boolean).join(" ")
            : "property";
      navigateToPath(buildPropertyUrl(zpid, address));
    },
    [navigateToPath],
  );

  if (!canSendMessage) {
    if (mode === "agent") {
      return <UnifiedMessagesListAgentBlockedEmpty config={config} />;
    }
    return (
      <UnifiedMessagesListClientNoAgentEmpty
        config={config}
        onSearchClick={onSearchClick}
      />
    );
  }
  if (isLoadingHistory) {
    return <UnifiedMessagesListLoadingHistory />;
  }
  if (localMessages.length === 0) {
    return (
      <UnifiedMessagesListNoMessagesYet
        mode={mode}
        config={config}
        selectedClientName={selectedClientName}
      />
    );
  }

  return (
    <>
      {localMessages.map((msg, index) => (
        <UnifiedMessageThreadRow
          key={msg.id}
          msg={msg}
          index={index}
          localMessages={localMessages}
          mode={mode}
          config={config}
          activeConversation={activeConversation}
          onAcceptEventRequest={onAcceptEventRequest}
          onCancelEventRequest={onCancelEventRequest}
          acceptedEventRequestIds={acceptedEventRequestIds}
          acceptingEventRequestId={acceptingEventRequestId}
          viewerUserId={viewerUserId}
          onAgreementView={handleMessagingAgreementView}
          onAgreementSignNow={handleMessagingAgreementSignNow}
          getSavedHome={getSavedHome}
          isHomeSaved={isHomeSaved}
          saveHome={saveHome}
          removeSavedHome={removeSavedHome}
          documents={documents}
          t={t}
          openSharedHomeDetails={openSharedHomeDetails}
          onRetryMessage={onRetryMessage}
        />
      ))}
      <UnifiedMessagesListOverlays
        currentPdf={currentPdf}
        currentDocumentId={currentDocumentId}
        currentDocumentName={currentDocumentName}
        closePdfModal={closePdfModal}
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
        viewSignedAgreement={viewSignedAgreement}
        dismissViewSignedAgreement={dismissViewSignedAgreement}
        messagesEndRef={messagesEndRef}
      />
    </>
  );
}
