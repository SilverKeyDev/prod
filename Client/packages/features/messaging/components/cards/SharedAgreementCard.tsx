import { useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { AgreementDetailModal } from "packages/features/documents";

import { BodyText } from "@/components/ui";
type SharedAgreementCardProps = {
  agreementId: string;
  compact?: boolean;
};
/**
 * SharedAgreementCard Component
 *
 * Displays a shared agreement in chat messages.
 * Shows when an agent shares an agreement with a client in messaging
 * Clicking opens the AgreementDetailModal stub for more context.
 */
export default function SharedAgreementCard({
  agreementId,
  compact = false,
}: SharedAgreementCardProps) {
  const { t } = useLocalization();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleClick = () => {
    setIsModalOpen(true);
  };
  // Agreement fetching is disabled while the signing provider is migrated;
  // always show a generic "not available" card that still lets users open
  // the detail stub for context.
  return (
    <>
      <div className={`max-w-${compact ? "sm" : "md"}`}>
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3"
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="flex items-center gap-2">
            <Icon name="file-signature" className="h-5 w-5 text-gray-600" />
            <BodyText size="sm" className="text-gray-900">
              {t("documents.agreement_not_available", {
                defaultValue: "Agreement details are not available yet.",
              })}
            </BodyText>
          </div>
        </div>
      </div>
      <AgreementDetailModal
        agreementId={agreementId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
