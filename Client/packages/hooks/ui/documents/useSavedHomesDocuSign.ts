import { useCallback, useState } from "react";

import { getWindow } from "packages/utils/core/platform";

type EnqueueToast = (params: {
  type: "success" | "error";
  message: string;
}) => void;

type SendAgreementFn = (params: {
  agreementId: string;
  signingMethod?: "embedded" | "email";
}) => Promise<unknown>;

type VoidAgreementFn = (params: {
  agreementId: string;
  reason?: string;
}) => Promise<unknown>;

/**
 * DocuSign agreement state and handlers for SavedHomes (agreement list, send, void, create modal).
 * Extracted to keep SavedHomes component under max-lines-per-function.
 */
export function useSavedHomesDocuSign(
  sendAgreement: SendAgreementFn,
  voidAgreement: VoidAgreementFn,
  refetchAgreements: () => Promise<unknown>,
  enqueueToast: EnqueueToast,
) {
  const [isCreateAgreementModalOpen, setIsCreateAgreementModalOpen] =
    useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
    null,
  );

  const handleAgreementClick = useCallback((agreementId: string) => {
    setSelectedAgreementId(agreementId);
  }, []);

  const handleAgreementSend = useCallback(
    async (agreementId: string) => {
      try {
        await sendAgreement({
          agreementId,
          signingMethod: "embedded",
        });
        enqueueToast({
          type: "success",
          message: "Agreement sent for signature",
        });
        await refetchAgreements();
      } catch (error) {
        enqueueToast({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to send agreement",
        });
      }
    },
    [sendAgreement, refetchAgreements, enqueueToast],
  );

  const handleAgreementVoid = useCallback(
    async (agreementId: string) => {
      const confirmed =
        getWindow()?.confirm?.(
          "Are you sure you want to void this agreement? This action cannot be undone.",
        ) ?? false;
      if (!confirmed) return;

      try {
        await voidAgreement({
          agreementId,
          reason: "Voided from SavedPage",
        });
        enqueueToast({
          type: "success",
          message: "Agreement voided successfully",
        });
        await refetchAgreements();
      } catch (error) {
        enqueueToast({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to void agreement",
        });
      }
    },
    [voidAgreement, refetchAgreements, enqueueToast],
  );

  const handleCreateAgreementSuccess = useCallback(
    (agreementId: string) => {
      void refetchAgreements();
      setSelectedAgreementId(agreementId);
    },
    [refetchAgreements],
  );

  return {
    isCreateAgreementModalOpen,
    setIsCreateAgreementModalOpen,
    selectedAgreementId,
    setSelectedAgreementId,
    handleAgreementClick,
    handleAgreementSend,
    handleAgreementVoid,
    handleCreateAgreementSuccess,
  };
}
