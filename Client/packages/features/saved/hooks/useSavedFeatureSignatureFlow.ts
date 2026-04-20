import { useCallback, useMemo, useState } from "react";

import type {
  ChecklistForm,
  DocumentData,
  SendForSignatureParams,
} from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";

type SignatureIntegration = {
  sendDocumentForSignature: (params: SendForSignatureParams) => Promise<string>;
  getDefaultAgreementTitle: (document: DocumentData) => string;
  sendForSignatureDisabledReason: (document: DocumentData) => string | null;
  refetchDocuments: () => Promise<unknown>;
  signAgreementNow: (document: DocumentData) => Promise<void>;
};

export function useSavedFeatureSignatureFlow(
  documents: DocumentData[],
  selectedClientId: string | null,
  enqueueToast: UIState["enqueueToast"],
  integration: SignatureIntegration
) {
  const {
    sendDocumentForSignature,
    getDefaultAgreementTitle,
    sendForSignatureDisabledReason,
    refetchDocuments,
    signAgreementNow,
  } = integration;

  const [isSendForSignatureModalOpen, setIsSendForSignatureModalOpen] = useState(false);
  const [sendForSignatureDocumentId, setSendForSignatureDocumentId] = useState<string | null>(null);
  const [sendForSignatureFormId, setSendForSignatureFormId] = useState<string | null>(null);
  const [sendForSignatureTitle, setSendForSignatureTitle] = useState("");
  const [sendForSignatureRecipientClientId, setSendForSignatureRecipientClientId] = useState<
    string | null
  >(null);

  const sendForSignatureDocument = useMemo(
    () =>
      sendForSignatureDocumentId
        ? (documents.find((document) => document.id === sendForSignatureDocumentId) ?? null)
        : null,
    [documents, sendForSignatureDocumentId]
  );

  const openSendForSignatureModal = useCallback(
    (document: DocumentData) => {
      const disabledReason = sendForSignatureDisabledReason(document);
      if (disabledReason) {
        enqueueToast({ type: "info", message: disabledReason });
        return;
      }
      setSendForSignatureDocumentId(document.id);
      setSendForSignatureFormId(null);
      setSendForSignatureTitle(getDefaultAgreementTitle(document));
      setSendForSignatureRecipientClientId(selectedClientId ?? document.user_id ?? null);
      setIsSendForSignatureModalOpen(true);
    },
    [enqueueToast, getDefaultAgreementTitle, selectedClientId, sendForSignatureDisabledReason]
  );

  const openSendForSignatureModalForForm = useCallback(
    (form: ChecklistForm) => {
      setSendForSignatureFormId(form.id);
      setSendForSignatureDocumentId(null);
      setSendForSignatureTitle(form.title);
      setSendForSignatureRecipientClientId(selectedClientId ?? null);
      setIsSendForSignatureModalOpen(true);
    },
    [selectedClientId]
  );

  const closeSendForSignatureModal = useCallback(() => {
    setIsSendForSignatureModalOpen(false);
    setSendForSignatureDocumentId(null);
    setSendForSignatureFormId(null);
    setSendForSignatureRecipientClientId(null);
  }, []);

  const submitSendForSignature = useCallback(async () => {
    if (!sendForSignatureRecipientClientId) {
      enqueueToast({
        type: "error",
        message: "Select a recipient client before sending",
      });
      return;
    }

    if (sendForSignatureFormId) {
      log.info(LOG_CATEGORIES.API, "Sending form for signature", {
        formId: sendForSignatureFormId,
        title: sendForSignatureTitle,
        recipientClientId: sendForSignatureRecipientClientId,
      });
      closeSendForSignatureModal();
      return;
    }

    if (!sendForSignatureDocument) {
      enqueueToast({
        type: "error",
        message: "No document or form selected for signature",
      });
      return;
    }

    try {
      await sendDocumentForSignature({
        document: sendForSignatureDocument,
        title: sendForSignatureTitle,
        signingMethod: "email",
        buyerId: sendForSignatureRecipientClientId,
        recipientUserId: sendForSignatureRecipientClientId,
      });
      enqueueToast({
        type: "success",
        message: "Successfully sent for signature.",
      });
      await refetchDocuments();
      closeSendForSignatureModal();
    } catch (error) {
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send for signature",
      });
    }
  }, [
    closeSendForSignatureModal,
    enqueueToast,
    refetchDocuments,
    sendDocumentForSignature,
    sendForSignatureDocument,
    sendForSignatureFormId,
    sendForSignatureRecipientClientId,
    sendForSignatureTitle,
  ]);

  const sendForSignatureDirect = useCallback(
    async (document: DocumentData) => {
      const disabledReason = sendForSignatureDisabledReason(document);
      if (disabledReason) {
        enqueueToast({ type: "info", message: disabledReason });
        return;
      }

      try {
        await sendDocumentForSignature({
          document,
          title: getDefaultAgreementTitle(document),
          signingMethod: "email",
          buyerId: selectedClientId ?? document.user_id ?? undefined,
          recipientUserId: selectedClientId ?? document.user_id ?? undefined,
        });
        enqueueToast({
          type: "success",
          message: "Successfully sent for signature.",
        });
        await refetchDocuments();
      } catch (error) {
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to send for signature",
        });
      }
    },
    [
      enqueueToast,
      getDefaultAgreementTitle,
      refetchDocuments,
      selectedClientId,
      sendDocumentForSignature,
      sendForSignatureDisabledReason,
    ]
  );

  const signNowDirect = useCallback(
    async (document: DocumentData) => {
      if (document.library_kind !== "agreement") {
        enqueueToast({
          type: "info",
          message: "Sign now is only available for agreements.",
        });
        return;
      }
      try {
        await signAgreementNow(document);
      } catch (error) {
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to open signing flow",
        });
      }
    },
    [enqueueToast, signAgreementNow]
  );

  return {
    isSendForSignatureModalOpen,
    sendForSignatureTitle,
    setSendForSignatureTitle,
    sendForSignatureRecipientClientId,
    setSendForSignatureRecipientClientId,
    sendForSignatureDocument,
    openSendForSignatureModal,
    openSendForSignatureModalForForm,
    closeSendForSignatureModal,
    submitSendForSignature,
    sendForSignatureDirect,
    signNowDirect,
  };
}
