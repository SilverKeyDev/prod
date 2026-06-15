import {
  DocuSignLegalNotice,
  EmbeddedSigning,
  ViewSignedDocument,
} from "packages/features/documents";
import { BaseModal } from "packages/ui/components/surfaces/modals";

type AgreementSigningEmbedded = {
  kind: "embedded";
  agreementId: string;
  participantId: string;
  pdfViewerTitle?: string;
};

type AgreementSigningSenderUrl = { kind: "sender_url"; url: string };

type SavedFeatureSigningModalsProps = {
  agreementSigningSession: AgreementSigningEmbedded | AgreementSigningSenderUrl | null;
  onDismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
  viewSignedAgreement: { agreementId: string; title: string } | null;
  onDismissViewSignedAgreement: () => void;
};

export function SavedFeatureSigningModals({
  agreementSigningSession,
  onDismissAgreementSigning,
  onAgreementSigningComplete,
  viewSignedAgreement,
  onDismissViewSignedAgreement,
}: SavedFeatureSigningModalsProps) {
  return (
    <>
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
            height="min(72vh, 820px)"
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
          onClose={onDismissViewSignedAgreement}
          title={viewSignedAgreement.title}
          size="full"
          showCloseButton
        >
          <ViewSignedDocument
            agreementId={viewSignedAgreement.agreementId}
            title={viewSignedAgreement.title}
            height="min(80vh, 900px)"
            onClose={onDismissViewSignedAgreement}
          />
        </BaseModal>
      ) : null}
    </>
  );
}
