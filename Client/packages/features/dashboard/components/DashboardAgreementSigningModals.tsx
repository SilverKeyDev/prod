import { DocuSignLegalNotice, EmbeddedSigning } from "packages/features/documents";
import { BaseModal } from "packages/ui/components/modals";

export type DashboardAgreementSigningSession =
  | {
      kind: "embedded";
      agreementId: string;
      participantId: string;
      pdfViewerTitle?: string;
    }
  | { kind: "sender_url"; url: string };

type DashboardAgreementSigningModalsProps = {
  agreementSigningSession: DashboardAgreementSigningSession;
  dismissAgreementSigning: () => void;
  onAgreementSigningComplete: () => void;
};

export default function DashboardAgreementSigningModals({
  agreementSigningSession,
  dismissAgreementSigning,
  onAgreementSigningComplete,
}: DashboardAgreementSigningModalsProps) {
  if (agreementSigningSession.kind === "embedded") {
    return (
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
    );
  }

  return (
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
  );
}
