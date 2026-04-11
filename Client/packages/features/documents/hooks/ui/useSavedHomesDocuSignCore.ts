import { useCallback, useState } from "react";

type EnqueueToast = (params: {
  type: "success" | "error";
  message: string;
}) => void;

type SendAgreementFn = (params: { agreementId: string }) => Promise<unknown>;

type VoidAgreementFn = (params: {
  agreementId: string;
  reason?: string;
}) => Promise<unknown>;

export type UseSavedHomesDocuSignCoreOptions = {
  sendAgreement: SendAgreementFn;
  voidAgreement: VoidAgreementFn;
  refetchAgreements: () => Promise<unknown>;
  enqueueToast: EnqueueToast;
  /** Platform-specific: resolve true if user confirmed void. */
  confirmVoid: (message: string) => Promise<boolean>;
  /** Reason string for void (e.g. "Voided from SavedPage" or "Voided from SavedPage (mobile)"). */
  voidReason: string;
};

/**
 * Shared DocuSign agreement state and handlers. Platform files pass confirmVoid and voidReason.
 */
export function useSavedHomesDocuSignCore(
  options: UseSavedHomesDocuSignCoreOptions,
) {
  const {
    sendAgreement,
    voidAgreement,
    refetchAgreements,
    enqueueToast,
    confirmVoid,
    voidReason,
  } = options;

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
        await sendAgreement({ agreementId });
        enqueueToast({
          type: "success",
          message: "Successfully sent for signature.",
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
      const confirmed = await confirmVoid(
        "Are you sure you want to void this agreement? This action cannot be undone.",
      );
      if (!confirmed) return;

      try {
        await voidAgreement({
          agreementId,
          reason: voidReason,
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
    [voidAgreement, refetchAgreements, enqueueToast, confirmVoid, voidReason],
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
