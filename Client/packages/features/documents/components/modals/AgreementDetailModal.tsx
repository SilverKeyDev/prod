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
      <Box className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <Text className="mb-1 text-sm font-semibold text-gray-900">
          {t("documents.agreement_not_available", {
            defaultValue: "Agreement details are not available yet.",
          })}
        </Text>
        <Text className="text-xs text-gray-700">
          {t("documents.agreement_not_available_body", {
            defaultValue:
              "We are migrating to a new signing provider. You can still access your documents from the Documents section on web.",
          })}
        </Text>
      </Box>
    </BaseModal>
  );
}
