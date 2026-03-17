import { useLocalization } from "packages/contexts";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text } from "packages/ui/components/primitives";

type AgreementDetailModalProps = {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * AgreementDetailModal
 *
 * Full agreement management modal (stub). Informs the user that agreement
 * details and signing are temporarily unavailable while migrating to a new
 * signing provider. Shared web + native.
 */
export default function AgreementDetailModal({
  agreementId: _agreementId,
  isOpen,
  onClose,
}: AgreementDetailModalProps) {
  const { t } = useLocalization();

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Agreement Details" showCloseButton>
      <Box className="border-border bg-background-base rounded-lg border p-4">
        <Text className="text-text-primary mb-1 text-sm font-semibold">
          {t("documents.agreement_not_available", {
            defaultValue: "Agreement details are not available yet.",
          })}
        </Text>
        <Text className="text-text-secondary text-xs">
          {t("documents.agreement_not_available_body", {
            defaultValue:
              "We are migrating to a new signing provider. You can still access your documents from the Documents section on web.",
          })}
        </Text>
      </Box>
    </BaseModal>
  );
}
