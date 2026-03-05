import { useCallback, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useUIStore } from "packages/store";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";

export type UseCreateAgreementFormParams = {
  preselectedBuyerId?: string;
  onSuccess?: (agreementId: string) => void;
  onClose: () => void;
};

export const useCreateAgreementForm = ({
  preselectedBuyerId,
  onSuccess,
  onClose,
}: UseCreateAgreementFormParams) => {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { clients } = useAgentClients();

  const [title, setTitle] = useState("");
  const [agreementType, setAgreementType] = useState<string>("buyer_representation");
  const [selectedBuyerId, setSelectedBuyerId] = useState(preselectedBuyerId ?? "");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [description, setDescription] = useState("");

  const agreementTypes: string[] = useMemo(
    () => [
      "buyer_representation",
      "offer",
      "inspection_addendum",
      "financing_contingency",
      "closing_disclosure",
      "other",
    ],
    []
  );

  const resetForm = useCallback(() => {
    setTitle("");
    setAgreementType("buyer_representation");
    setSelectedBuyerId(preselectedBuyerId ?? "");
    setPropertyAddress("");
    setDescription("");
  }, [preselectedBuyerId]);

  const submit = useCallback(async () => {
    if (!title.trim()) {
      enqueueToast({
        type: "error",
        message: t("documents_create.validation_title", {
          defaultValue: "Please enter an agreement title",
        }),
      });
      return;
    }

    if (!selectedBuyerId) {
      enqueueToast({
        type: "error",
        message: t("documents_create.validation_buyer", {
          defaultValue: "Please select a buyer",
        }),
      });
      return;
    }

    try {
      // Agreement creation is temporarily disabled while the signature provider
      // is being migrated.
      enqueueToast({
        type: "error",
        message: t("documents_create.unavailable", {
          defaultValue:
            "Creating agreements is temporarily unavailable while we migrate our signing provider.",
        }),
      });
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("documents_create.error_generic", {
                defaultValue: "Failed to create agreement",
              }),
      });
    }
  }, [
    agreementType,
    createAgreement,
    description,
    enqueueToast,
    onClose,
    onSuccess,
    propertyAddress,
    resetForm,
    selectedBuyerId,
    t,
    title,
  ]);

  const handleClose = useCallback(() => {
    if (!isCreatingAgreement) {
      onClose();
    }
  }, [isCreatingAgreement, onClose]);

  return {
    // state
    title,
    agreementType,
    selectedBuyerId,
    propertyAddress,
    description,

    // setters
    setTitle,
    setAgreementType,
    setSelectedBuyerId,
    setPropertyAddress,
    setDescription,

    // data
    agreementTypes,
    templates,
    clients,

    // meta
    isCreatingAgreement,

    // actions
    submit,
    handleClose,
  };
};
