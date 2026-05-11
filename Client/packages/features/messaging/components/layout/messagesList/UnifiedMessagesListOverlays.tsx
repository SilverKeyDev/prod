import React from "react";

import PdfModal from "@ui/modals/PdfModal";

import {
  DocuSignLegalNotice,
  EmbeddedSigning,
  ViewSignedDocument,
} from "packages/features/documents";
import { BaseModal } from "packages/ui/components/modals";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";

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

type UnifiedMessagesListOverlaysProps = {
  currentPdf: string | null;
  currentDocumentId: string | null;
  currentDocumentName: string | null;
  closePdfModal: () => void;
  agreementSigningSession: AgreementSigningSession | null;
  dismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
  viewSignedAgreement: ViewSignedState | null;
  dismissViewSignedAgreement: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
};

export function UnifiedMessagesListOverlays({
  currentPdf,
  currentDocumentId,
  currentDocumentName,
  closePdfModal,
  agreementSigningSession,
  dismissAgreementSigning,
  onAgreementSigningComplete,
  viewSignedAgreement,
  dismissViewSignedAgreement,
  messagesEndRef,
}: UnifiedMessagesListOverlaysProps) {
  return (
    <>
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
            height="min(72vh, 820px)"
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
          <iframe
            src={agreementSigningSession.url}
            title="DocuSign signing"
            className="border-border min-h-[72vh] w-full rounded-lg border"
          />
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
            height="min(80vh, 900px)"
            onClose={dismissViewSignedAgreement}
          />
        </BaseModal>
      ) : null}
      <Box ref={messagesEndRef} />
    </>
  );
}
