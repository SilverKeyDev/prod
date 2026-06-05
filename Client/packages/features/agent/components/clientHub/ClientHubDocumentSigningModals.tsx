import {
  DocuSignLegalNotice,
  EmbeddedSigning,
  ViewSignedDocument,
} from "packages/features/documents";
import { BaseModal } from "packages/ui/components/surfaces/modals";

type AgreementSigningSession =
  | {
      kind: "embedded";
      agreementId: string;
      participantId: string;
      pdfViewerTitle?: string;
    }
  | { kind: "sender_url"; url: string }
  | null;

type ViewSignedState = { agreementId: string; title: string } | null;

type ClientHubDocumentSigningModalsProps = {
  agreementSigningSession: AgreementSigningSession;
  dismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
  viewSignedAgreement: ViewSignedState;
  dismissViewSignedAgreement: () => void;
};

export function ClientHubDocumentSigningModals({
  agreementSigningSession,
  dismissAgreementSigning,
  onAgreementSigningComplete,
  viewSignedAgreement,
  dismissViewSignedAgreement,
}: ClientHubDocumentSigningModalsProps) {
  return (
    <>
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
    </>
  );
}
