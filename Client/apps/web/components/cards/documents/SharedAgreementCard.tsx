import { useState } from "react";
import { FileSignature } from "lucide-react";
import { useDocusignAgreement } from "../../../../../packages/hooks/data/documents/useDocusignAgreement";
import AgreementCard from "../../../features/documents/docusign/components/AgreementCard";
import { AgreementDetailModal } from "../../../features/documents/docusign/modals";
import { KeyTurnLoader, BodyText } from "../../ui";

type SharedAgreementCardProps = {
  agreementId: string;
  compact?: boolean;
};

/**
 * SharedAgreementCard Component
 *
 * Displays a DocuSign agreement in chat messages
 * Shows when an agent shares an agreement with a client in messaging
 * Clicking opens the AgreementDetailModal for full details
 */
export default function SharedAgreementCard({
  agreementId,
  compact = false,
}: SharedAgreementCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { agreement, isLoading, error } = useDocusignAgreement(agreementId);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-sm p-3 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <KeyTurnLoader />
          <BodyText size="sm" muted>
            Loading agreement...
          </BodyText>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="max-w-sm p-3 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-red-600" />
          <BodyText size="sm" className="text-red-600">
            Agreement not available
          </BodyText>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`max-w-${compact ? "sm" : "md"}`}>
        <AgreementCard
          agreement={agreement}
          onClick={handleClick}
          compact={compact}
          showActions={false}
        />
      </div>
      <AgreementDetailModal
        agreementId={agreementId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
