import { useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { AgreementDetailModal } from "packages/features/documents";
import { Box } from "packages/ui/components/primitives";

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
      <Box className={`max-w-${compact ? "sm" : "md"}`}>
        <Box
          role="button"
          tabIndex={0}
          className="border-border bg-background-base cursor-pointer rounded-lg border p-3"
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <Box className="flex items-center gap-2">
            <Icon name="file-signature" className="text-text-secondary h-5 w-5" />
            <BodyText size="sm" className="text-text-primary">
              {t("documents.agreement_not_available", {
                defaultValue: "Agreement details are not available yet.",
              })}
            </BodyText>
          </Box>
        </Box>
      </Box>
      <AgreementDetailModal
        agreementId={agreementId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
