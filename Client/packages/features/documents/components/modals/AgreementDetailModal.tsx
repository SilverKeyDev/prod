import { BodyText, CloseButton, Title } from "packages/ui/components/index.web";

import BaseModal from "@/components/modals/BaseModal";

type AgreementDetailModalProps = {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * AgreementDetailModal Component
 *
 * Full agreement management modal with tabs:
 * - Overview: metadata and status
 * - Revisions: version history
 * - Participants: signing status
 * - Sign: embedded signing (if applicable)
 */
export default function AgreementDetailModal({
  agreementId,
  isOpen,
  onClose,
}: AgreementDetailModalProps) {
  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex h-[60vh] flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <Title size="lg" className="truncate">
            Agreement Details
          </Title>
          <CloseButton onClick={onClose} className="ml-4" />
        </div>
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <BodyText size="sm" muted>
            Agreement details and signing are temporarily unavailable while we migrate to a new
            signing provider. Your existing documents remain safe.
          </BodyText>
        </div>
      </div>
    </BaseModal>
  );
}
