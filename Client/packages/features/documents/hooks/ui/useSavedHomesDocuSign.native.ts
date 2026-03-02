import { useCallback } from "react";

import { Alert } from "react-native";

import { useSavedHomesDocuSignCore } from "./useSavedHomesDocuSignCore";

type EnqueueToast = (params: { type: "success" | "error"; message: string }) => void;

type SendAgreementFn = (params: {
  agreementId: string;
  signingMethod?: "embedded" | "email";
}) => Promise<unknown>;

type VoidAgreementFn = (params: { agreementId: string; reason?: string }) => Promise<unknown>;

/**
 * React Native implementation of useSavedHomesDocuSign.
 * Uses Alert.alert for void confirmation; web uses window.confirm via useSavedHomesDocuSign.ts.
 */
export function useSavedHomesDocuSign(
  sendAgreement: SendAgreementFn,
  voidAgreement: VoidAgreementFn,
  refetchAgreements: () => Promise<unknown>,
  enqueueToast: EnqueueToast
) {
  const confirmVoid = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert("Void agreement", message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Void", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
  }, []);

  return useSavedHomesDocuSignCore({
    sendAgreement,
    voidAgreement,
    refetchAgreements,
    enqueueToast,
    confirmVoid,
    voidReason: "Voided from SavedPage (mobile)",
  });
}
