import { useCallback } from "react";

import { getWindow } from "packages/utils/core/platform";

import { useSavedHomesDocuSignCore } from "./useSavedHomesDocuSignCore";

type EnqueueToast = (params: { type: "success" | "error"; message: string }) => void;

type SendAgreementFn = (params: { agreementId: string }) => Promise<unknown>;

type VoidAgreementFn = (params: { agreementId: string; reason?: string }) => Promise<unknown>;

/**
 * DocuSign agreement state and handlers for SavedHomes (web).
 * Uses window.confirm for void confirmation; native uses Alert.alert via useSavedHomesDocuSign.native.
 */
export function useSavedHomesDocuSign(
  sendAgreement: SendAgreementFn,
  voidAgreement: VoidAgreementFn,
  refetchAgreements: () => Promise<unknown>,
  enqueueToast: EnqueueToast
) {
  const confirmVoid = useCallback((message: string) => {
    return Promise.resolve(getWindow()?.confirm?.(message) ?? false);
  }, []);

  return useSavedHomesDocuSignCore({
    sendAgreement,
    voidAgreement,
    refetchAgreements,
    enqueueToast,
    confirmVoid,
    voidReason: "Voided from SavedPage",
  });
}
