import { useLocalization } from "packages/contexts";
import {
  BodyText,
  Button,
  CancelButton,
  CloseButton,
  Input,
  Label,
  Select,
  Textarea,
  Title,
} from "packages/ui/components/index.web";

import BaseModal from "@/components/modals/BaseModal";
import { useCreateAgreementForm } from "@/features/documents/hooks/ui/useCreateAgreementForm";

type CreateAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedBuyerId?: string;
  onSuccess?: (agreementId: string) => void;
};

/**
 * CreateAgreementModal Component
 *
 * Modal for configuring new agreements (agent-only).
 * Includes form for title, type, buyer selection, property address.
 */
export default function CreateAgreementModal({
  isOpen,
  onClose,
  preselectedBuyerId,
  onSuccess,
}: CreateAgreementModalProps) {
  const {
    title,
    agreementType,
    selectedBuyerId,
    propertyAddress,
    description,
    setTitle,
    setAgreementType,
    setSelectedBuyerId,
    setPropertyAddress,
    setDescription,
    agreementTypes,
    templates,
    clients,
    isCreatingAgreement,
    submit,
    handleClose,
  } = useCreateAgreementForm({
    preselectedBuyerId,
    onSuccess,
    onClose,
  });

  const { t } = useLocalization();

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Title size="lg">
            {t("documents_create.title", { defaultValue: "Create Agreement" })}
          </Title>
          <CloseButton
            onClick={handleClose}
            size="sm"
            className="text-gray-400 hover:text-gray-600"
            disabled={isCreatingAgreement}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          {/* Title */}
          <div>
            <Label htmlFor="agreement-title" className="mb-2 block font-medium text-gray-700">
              {t("documents_create.field_title", { defaultValue: "Agreement Title *" })}
            </Label>
            <Input
              id="agreement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("documents_create.field_title_placeholder", {
                defaultValue: "e.g., Buyer Representation Agreement - John Doe",
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingAgreement}
              required
            />
          </div>

          {/* Agreement Type */}
          <div>
            <Select
              id="agreement-type"
              label={t("documents_create.field_type", { defaultValue: "Agreement Type *" })}
              options={agreementTypes.map((type) => ({
                value: type,
                label: type,
              }))}
              value={agreementType}
              onChange={(v) => setAgreementType(v)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingAgreement}
              required
            />
          </div>

          {/* Buyer Selection */}
          <div>
            <Select
              id="agreement-buyer"
              label={t("documents_create.field_buyer", { defaultValue: "Buyer *" })}
              placeholder={t("documents_create.field_buyer_placeholder", {
                defaultValue: "Select a buyer...",
              })}
              options={clients.map((client) => ({
                value: client.id,
                label: `${client.name} - ${client.email}`,
              }))}
              value={selectedBuyerId}
              onChange={setSelectedBuyerId}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingAgreement || !!preselectedBuyerId}
              required
            />
          </div>

          {/* Property Address */}
          <div>
            <Label
              htmlFor="agreement-property-address"
              className="mb-2 block font-medium text-gray-700"
            >
              {t("documents_create.field_address", {
                defaultValue: "Property Address (Optional)",
              })}
            </Label>
            <Input
              id="agreement-property-address"
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder={t("documents_create.field_address_placeholder", {
                defaultValue: "e.g., 123 Main St, San Francisco, CA 94102",
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingAgreement}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="agreement-description" className="mb-2 block font-medium text-gray-700">
              {t("documents_create.field_description", {
                defaultValue: "Description (Optional)",
              })}
            </Label>
            <Textarea
              id="agreement-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("documents_create.field_description_placeholder", {
                defaultValue: "Add any additional details...",
              })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              disabled={isCreatingAgreement}
            />
          </div>

          {/* Template Selection (if available) */}
          {templates && templates.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <BodyText size="sm" className="text-blue-900">
                💡{" "}
                {t("documents_create.templates_tip", {
                  defaultValue:
                    "Tip: After creating the agreement, you can upload the document PDF as a revision.",
                })}
              </BodyText>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <CancelButton
              type="button"
              size="md"
              onClick={handleClose}
              disabled={isCreatingAgreement}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </CancelButton>
            <Button type="submit" variant="primary" size="md" disabled={isCreatingAgreement}>
              {isCreatingAgreement
                ? t("documents_create.submitting", { defaultValue: "Creating..." })
                : t("documents_create.submit", { defaultValue: "Create Agreement" })}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
