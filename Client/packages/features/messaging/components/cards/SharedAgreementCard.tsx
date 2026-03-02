import { useState } from "react";

import { FileSignature } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useDocusignAgreement } from "packages/features/documents";
import { AgreementCard, AgreementDetailModal } from "packages/features/documents";
import { BodyText, KeyTurnLoader } from "packages/ui/components/index.web";

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
  const { t } = useLocalization();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { agreement, isLoading, error } = useDocusignAgreement(agreementId);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center gap-2">
          <KeyTurnLoader />
          <BodyText size="sm" muted>
            {t("documents.loading_agreement")}
          </BodyText>
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-red-600" />
          <BodyText size="sm" className="text-red-600">
            {t("documents.agreement_not_available")}
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
