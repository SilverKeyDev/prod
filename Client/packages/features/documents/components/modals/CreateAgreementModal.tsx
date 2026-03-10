import React, { useCallback, useMemo, useState } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import { useCreateAgreementForm } from "packages/features/documents/hooks/ui/useCreateAgreementForm";
import { getAgreementTypeLabel } from "packages/features/documents/utils/agreements";
import { BaseModal } from "packages/ui/components/modals";
import { Box, PrimitiveInput, ScrollView, Text } from "packages/ui/components/primitives";

type CreateAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedBuyerId?: string;
  onSuccess?: (agreementId: string) => void;
};

/**
 * CreateAgreementModal
 *
 * Modal for configuring new agreements (agent-only). Shared web + native.
 * Form: title, type, buyer selection, property address, description.
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
  const [showBuyerList, setShowBuyerList] = useState(false);

  const selectedBuyerLabel = useMemo(() => {
    if (!selectedBuyerId) return "";
    const buyer = clients.find((c) => c.id === selectedBuyerId);
    if (!buyer) return "";
    return `${buyer.name} - ${buyer.email}`;
  }, [clients, selectedBuyerId]);

  const handleSubmit = useCallback(async () => {
    await submit();
    setShowBuyerList(false);
  }, [submit]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("documents_create.title", { defaultValue: "Create Agreement" })}
      showCloseButton
      closeOnBackdropClick={!isCreatingAgreement}
    >
      {/* maxHeight and paddingBottom: layout constants; RN ScrollView needs numeric px */}
      <ScrollView
        // eslint-disable-next-line silverkey/no-raw-spacing -- RN ScrollView needs numeric px for style and contentContainerStyle
        style={{ maxHeight: 480 }}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Box className="gap-4">
          {/* Title */}
          <Box className="gap-2">
            <Text className="text-sm font-medium text-gray-900">
              {t("documents_create.field_title", { defaultValue: "Agreement Title" })}
              <Text className="text-rose-500"> *</Text>
            </Text>
            <PrimitiveInput
              value={title}
              onValueChange={setTitle}
              placeholder={t("documents_create.field_title_placeholder", {
                defaultValue: "e.g., Buyer Representation Agreement - John Doe",
              })}
              editable={!isCreatingAgreement}
            />
          </Box>

          {/* Agreement Type */}
          <Box className="gap-2">
            <Text className="text-sm font-medium text-gray-900">
              {t("documents_create.field_type", { defaultValue: "Agreement Type" })}
              <Text className="text-rose-500"> *</Text>
            </Text>
            <Box className="flex flex-row flex-wrap gap-2">
              {agreementTypes.map((type) => {
                const isSelected = type === agreementType;
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    disabled={isCreatingAgreement}
                    onPress={() => setAgreementType(type)}
                    className="rounded-full px-3 py-2"
                  >
                    <Text
                      className={`text-xs font-medium ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {getAgreementTypeLabel(type)}
                    </Text>
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Buyer Selection */}
          <Box className="gap-2">
            <Text className="text-sm font-medium text-gray-900">
              {t("documents_create.field_buyer", { defaultValue: "Buyer" })}
              <Text className="text-rose-500"> *</Text>
            </Text>
            <PrimitiveInput
              value={
                selectedBuyerLabel ||
                t("documents_create.field_buyer_placeholder", {
                  defaultValue: "Select a buyer...",
                })
              }
              editable={false}
            />
            {!preselectedBuyerId && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isCreatingAgreement}
                onPress={() => setShowBuyerList((prev) => !prev)}
                className="self-start"
              >
                <Text className="text-xs font-medium text-gray-900">
                  {showBuyerList
                    ? t("documents_create.hide_buyers", { defaultValue: "Hide buyers" })
                    : t("documents_create.show_buyers", { defaultValue: "Choose buyer" })}
                </Text>
              </Button>
            )}
            {showBuyerList && !preselectedBuyerId && (
              <Box className="mt-2 max-h-40 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                {clients.length === 0 ? (
                  <Text className="text-xs text-gray-600">
                    {t("documents_create.no_buyers", { defaultValue: "No buyers available." })}
                  </Text>
                ) : (
                  clients.map((client) => (
                    <Button
                      key={client.id}
                      variant={client.id === selectedBuyerId ? "primary" : "secondary"}
                      size="sm"
                      onPress={() => {
                        setSelectedBuyerId(client.id);
                        setShowBuyerList(false);
                      }}
                      className="mb-1 justify-start"
                    >
                      <Text
                        className={`text-xs ${
                          client.id === selectedBuyerId ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {client.name} — {client.email}
                      </Text>
                    </Button>
                  ))
                )}
              </Box>
            )}
          </Box>

          {/* Property Address */}
          <Box className="gap-2">
            <Text className="text-sm font-medium text-gray-900">
              {t("documents_create.field_address", {
                defaultValue: "Property Address (Optional)",
              })}
            </Text>
            <PrimitiveInput
              value={propertyAddress}
              onValueChange={setPropertyAddress}
              placeholder={t("documents_create.field_address_placeholder", {
                defaultValue: "e.g., 123 Main St, San Francisco, CA 94102",
              })}
              editable={!isCreatingAgreement}
            />
          </Box>

          {/* Description */}
          <Box className="gap-2">
            <Text className="text-sm font-medium text-gray-900">
              {t("documents_create.field_description", {
                defaultValue: "Description (Optional)",
              })}
            </Text>
            <PrimitiveInput
              value={description}
              onValueChange={setDescription}
              placeholder={t("documents_create.field_description_placeholder", {
                defaultValue: "Add any additional details...",
              })}
              editable={!isCreatingAgreement}
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: "top" }}
            />
          </Box>

          {/* Templates tip */}
          {templates && templates.length > 0 && (
            <Box className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Text className="text-xs text-blue-900">
                {t("documents_create.templates_tip", {
                  defaultValue:
                    "Tip: After creating the agreement, you can upload the document PDF as a revision.",
                })}
              </Text>
            </Box>
          )}

          {/* Actions */}
          <Box className="mt-2 flex flex-row justify-end gap-3">
            <Button
              variant="secondary"
              size="md"
              disabled={isCreatingAgreement}
              onPress={handleClose}
            >
              <Text className="text-sm font-medium text-gray-900">
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Text>
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isCreatingAgreement}
              onPress={handleSubmit}
            >
              <Text className="text-sm font-medium text-white">
                {isCreatingAgreement
                  ? t("documents_create.submitting", { defaultValue: "Creating..." })
                  : t("documents_create.submit", { defaultValue: "Create Agreement" })}
              </Text>
            </Button>
          </Box>
        </Box>
      </ScrollView>
    </BaseModal>
  );
}
