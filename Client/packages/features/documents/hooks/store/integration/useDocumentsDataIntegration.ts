import { useCallback, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import {
  type DocumentData,
  useDocumentsData,
} from "packages/features/documents/hooks/data/useDocumentsData";
import type { DocusignRevisionUploadBody } from "packages/features/documents/types/docusign";
import { prepareAgreementSigningSession } from "packages/features/documents/utils/signAgreementNowFlow";
import { showErrorToast, showInfoToast } from "packages/hooks/ui";
import { apiDownloadBlob } from "packages/services/http/fileTransfer";
import { useAuthStore } from "packages/store";
import { createBlob } from "packages/utils/core/platform";

import {
  canSendForSignature,
  getDefaultAgreementTitle,
  sendForSignatureDisabledReason,
} from "@/features/documents/hooks/store/signature/documentSignature";
import { sendDocumentForSignatureFlow } from "@/features/documents/hooks/store/signature/documentsSendForSignature";

import type {
  DocumentsDataIntegrationHandlers,
  SendForSignatureParams,
} from "./documentsDataIntegrationTypes";
import { useDocumentsLibraryMutations } from "./useDocumentsLibraryMutations";

/**
 * Hook that integrates useDocumentsData with document actions
 * Specifically for PDF documents/reports displayed on the Saved page
 * @param clientId - Optional client ID for agents to view client's documents
 * @param handlers - Optional document handlers. If provided, these will be used instead of creating a new instance.
 *                   This ensures the modal state is shared between components.
 */
export function useDocumentsDataIntegration(
  clientId?: string,
  handlers?: DocumentsDataIntegrationHandlers
) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { handleDelete } = useDocumentsLibraryMutations(clientId);
  const {
    documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetchDocuments,
  } = useDocumentsData(clientId);

  const defaultHandlers = useDocumentActions();
  const handleViewDocument = handlers?.handleViewDocument ?? defaultHandlers.handleViewDocument;
  const handleDownloadDocument =
    handlers?.handleDownloadDocument ?? defaultHandlers.handleDownloadDocument;
  const handleShareDocument = handlers?.handleShareDocument ?? defaultHandlers.handleShareDocument;
  const [isSendingForSignature, setIsSendingForSignature] = useState(false);
  const [agreementSigningSession, setAgreementSigningSession] = useState<
    | {
        kind: "embedded";
        agreementId: string;
        participantId: string;
        pdfViewerTitle?: string;
      }
    | { kind: "sender_url"; url: string }
    | null
  >(null);
  const [viewSignedAgreement, setViewSignedAgreement] = useState<{
    agreementId: string;
    title: string;
  } | null>(null);

  const dismissAgreementSigning = useCallback(() => {
    setAgreementSigningSession(null);
  }, []);

  const dismissViewSignedAgreement = useCallback(() => {
    setViewSignedAgreement(null);
  }, []);

  const openViewSignedAgreement = useCallback((doc: DocumentData) => {
    if (doc.library_kind !== "agreement") return;
    setViewSignedAgreement({
      agreementId: doc.id,
      title: doc.filename ?? "Signed document",
    });
  }, []);

  const openAgreementPdfViewer = useCallback((agreementId: string, documentName: string) => {
    const name = documentName.trim();
    setViewSignedAgreement({
      agreementId,
      title: name.length > 0 ? name : "Agreement document",
    });
  }, []);

  const onAgreementSigningComplete = useCallback(() => {
    setAgreementSigningSession(null);
    void refetchDocuments();
  }, [refetchDocuments]);

  const resolveAgreementId = useCallback((document: DocumentData): string | null => {
    if (document.library_kind !== "agreement") return null;
    return document.id ?? document.library_item_id ?? null;
  }, []);

  const beginInAppAgreementSigning = useCallback(
    async (document: DocumentData) => {
      const agreementId = resolveAgreementId(document);
      if (!agreementId) {
        throw new Error("Unable to resolve agreement id");
      }
      const session = await prepareAgreementSigningSession(agreementId, user);
      if (session.type === "sender_iframe") {
        setAgreementSigningSession({ kind: "sender_url", url: session.url });
      } else {
        setAgreementSigningSession({
          kind: "embedded",
          agreementId: session.agreementId,
          participantId: session.participantId,
          pdfViewerTitle:
            document.filename?.trim() && document.filename.trim().length > 0
              ? document.filename.trim()
              : undefined,
        });
      }
    },
    [resolveAgreementId, user]
  );

  const getSigningFileFromDocument = useCallback(
    async (
      document: DocumentData
    ): Promise<{ body: DocusignRevisionUploadBody; fileName: string }> => {
      const blob = await apiDownloadBlob(`/api/v1/report/${document.id}/view`, {
        includeAuth: true,
        includeCredentials: true,
      });
      const inferredFileName =
        document.filename && document.filename.trim().length > 0
          ? document.filename
          : "document.pdf";
      return {
        body: createBlob([blob], {
          type: blob.type && blob.type.length > 0 ? blob.type : "application/pdf",
        }),
        fileName: inferredFileName,
      };
    },
    []
  );

  const sendDocumentForSignature = useCallback(
    async (params: SendForSignatureParams): Promise<string> => {
      setIsSendingForSignature(true);
      try {
        return await sendDocumentForSignatureFlow(params, {
          queryClient,
          resolveAgreementId,
          getSigningFileFromDocument,
        });
      } finally {
        setIsSendingForSignature(false);
      }
    },
    [getSigningFileFromDocument, queryClient, resolveAgreementId]
  );

  const signAgreementNow = useCallback(
    async (document: DocumentData): Promise<void> => {
      if (document.library_kind !== "agreement") {
        throw new Error("Sign is only available for agreements");
      }
      await beginInAppAgreementSigning(document);
    },
    [beginInAppAgreementSigning]
  );

  const handleViewDocumentForList = useCallback(
    (documentId: string, documentName: string) => {
      const row = documents.find((d) => d.id === documentId);
      if (row?.library_kind === "agreement") {
        const st = (row.status ?? "").toLowerCase();
        if (st === "completed") {
          setViewSignedAgreement({
            agreementId: row.id,
            title: row.filename || documentName,
          });
          return;
        }
        void beginInAppAgreementSigning(row).catch((err) => {
          showErrorToast(err instanceof Error ? err.message : "Failed to open signing");
        });
        return;
      }
      handleViewDocument(documentId, documentName);
    },
    [documents, handleViewDocument, beginInAppAgreementSigning]
  );

  const handleDownloadDocumentForList = useCallback(
    async (documentId: string, documentName: string) => {
      const row = documents.find((d) => d.id === documentId);
      if (row?.library_kind === "agreement") {
        showInfoToast("Download is not available for signing agreements in this list.");
        return;
      }
      await handleDownloadDocument(documentId, documentName);
    },
    [documents, handleDownloadDocument]
  );

  const handleShareDocumentForList = useCallback(
    async (documentId: string, documentName: string) => {
      const row = documents.find((d) => d.id === documentId);
      if (row?.library_kind === "agreement") {
        showInfoToast("Share is not available for signing agreements in this list.");
        return { success: false, message: "Not available for agreements" };
      }
      return handleShareDocument(documentId, documentName);
    },
    [documents, handleShareDocument]
  );

  return {
    documents,
    documentsLoading,
    documentsError,
    refetchDocuments,
    handleViewDocument: handleViewDocumentForList,
    handleDownloadDocument: handleDownloadDocumentForList,
    handleShareDocument: handleShareDocumentForList,
    handleDelete,
    isSendingForSignature,
    sendDocumentForSignature,
    signAgreementNow,
    getDefaultAgreementTitle,
    canSendForSignature,
    sendForSignatureDisabledReason,
    signingRecipientLabel: "Buyer",
    agreementSigningSession,
    dismissAgreementSigning,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    openViewSignedAgreement,
    openAgreementPdfViewer,
    onAgreementSigningComplete,
  };
}
