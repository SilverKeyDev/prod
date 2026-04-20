import React from "react";

import PdfModal from "@ui/modals/PdfModal";
import { View } from "react-native";
import WebView from "react-native-webview";

import { spacing } from "packages/design-tokens";
import {
  DocuSignLegalNotice,
  EmbeddedSigning,
  ViewSignedDocument,
} from "packages/features/documents";
import type { SavedHome } from "packages/types";
import type { DocumentData } from "packages/ui/components/cards/document/types";
import { BaseModal } from "packages/ui/components/modals";
import { Portal } from "packages/ui/components/portal";

import { MessagingAttachmentMenu } from "@/features/agent/components/messaging/menus/MessagingAttachmentMenu.native";
import CalendarEventRequestModal from "@/features/agent/components/modals/calendarEventRequest/CalendarEventRequestModal";
import ClientSearchModal from "@/features/agent/components/modals/search/ClientSearchModal";
import SelectDocumentModal from "@/features/agent/components/modals/search/SelectDocumentModal";
import SelectHomeModal from "@/features/agent/components/modals/search/SelectHomeModal";

type AgreementSigningSession =
  | {
      kind: "embedded";
      agreementId: string;
      participantId: string;
      pdfViewerTitle?: string;
    }
  | { kind: "sender_url"; url: string };

type ViewSignedState = {
  agreementId: string;
  title: string;
};

type MessagingScreenNativeOverlaysProps = {
  showAttachmentMenu: boolean;
  onCloseAttachmentMenu: () => void;
  onShareHome: () => void;
  onShareDocument: () => void;
  onCalendarEvent: () => void;
  showSearchModal: boolean;
  onCloseSearchModal: () => void;
  showSelectHomeModal: boolean;
  onCloseSelectHomeModal: () => void;
  onSelectHomes: (homes: SavedHome[]) => Promise<void>;
  showSelectDocumentModal: boolean;
  onCloseSelectDocumentModal: () => void;
  onSelectDocument: (document: DocumentData) => Promise<void>;
  showCalendarEventModal: boolean;
  onCloseCalendarEventModal: () => void;
  onCalendarEventSuccess: () => void;
  sendMessage: (text: string) => Promise<void>;
  currentPdf: string | null;
  currentDocumentId: string | null;
  currentDocumentName: string | null;
  onClosePdfModal: () => void;
  agreementSigningSession: AgreementSigningSession | null;
  onDismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
  viewSignedAgreement: ViewSignedState | null;
  onDismissViewSignedAgreement: () => void;
};

export function MessagingScreenNativeOverlays({
  showAttachmentMenu,
  onCloseAttachmentMenu,
  onShareHome,
  onShareDocument,
  onCalendarEvent,
  showSearchModal,
  onCloseSearchModal,
  showSelectHomeModal,
  onCloseSelectHomeModal,
  onSelectHomes,
  showSelectDocumentModal,
  onCloseSelectDocumentModal,
  onSelectDocument,
  showCalendarEventModal,
  onCloseCalendarEventModal,
  onCalendarEventSuccess,
  sendMessage,
  currentPdf,
  currentDocumentId,
  currentDocumentName,
  onClosePdfModal,
  agreementSigningSession,
  onDismissAgreementSigning,
  onAgreementSigningComplete,
  viewSignedAgreement,
  onDismissViewSignedAgreement,
}: MessagingScreenNativeOverlaysProps) {
  return (
    <>
      <MessagingAttachmentMenu
        visible={showAttachmentMenu}
        onClose={onCloseAttachmentMenu}
        onShareHome={onShareHome}
        onShareDocument={onShareDocument}
        onCalendarEvent={onCalendarEvent}
      />

      <ClientSearchModal isOpen={showSearchModal} onClose={onCloseSearchModal} />
      <SelectHomeModal
        isOpen={showSelectHomeModal}
        onClose={onCloseSelectHomeModal}
        onSelect={onSelectHomes}
      />
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={onCloseSelectDocumentModal}
        onSelect={onSelectDocument}
      />
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={onCloseCalendarEventModal}
        onSuccess={onCalendarEventSuccess}
        sendCalendarEventMessage={sendMessage}
      />

      {currentPdf ? (
        <Portal>
          <PdfModal
            currentPdf={currentPdf}
            currentReportAddress={currentDocumentName}
            reportId={currentDocumentId}
            onClose={onClosePdfModal}
          />
        </Portal>
      ) : null}
      {agreementSigningSession?.kind === "embedded" ? (
        <BaseModal
          isOpen
          onClose={onDismissAgreementSigning}
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
          onClose={onDismissAgreementSigning}
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
          onClose={onDismissViewSignedAgreement}
          title={viewSignedAgreement.title}
          size="full"
          showCloseButton
        >
          <ViewSignedDocument
            agreementId={viewSignedAgreement.agreementId}
            title={viewSignedAgreement.title}
            onClose={onDismissViewSignedAgreement}
          />
        </BaseModal>
      ) : null}
    </>
  );
}
