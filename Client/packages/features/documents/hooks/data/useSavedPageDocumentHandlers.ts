import { useCallback } from "react";

import { useAuthStore, useUIStore } from "packages/store";

import type { DocumentData } from "./useDocumentsData";

type UseSavedPageDocumentHandlersProps = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
  handleDelete: (doc: DocumentData) => Promise<void>;
  documents: DocumentData[];
};

type UseSavedPageDocumentHandlersReturn = {
  handleDocumentView: (document: DocumentData) => void;
  handleDocumentDownload: (document: DocumentData) => void;
  handleDocumentShare: (document: DocumentData) => void;
  handleDocumentDelete: (document: DocumentData) => Promise<void>;
};

/**
 * Hook for document action handlers on saved page
 */
export function useSavedPageDocumentHandlers({
  handleViewDocument,
  handleDownloadDocument,
  handleShareDocument,
  handleDelete,
}: UseSavedPageDocumentHandlersProps): UseSavedPageDocumentHandlersReturn {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const user = useAuthStore((s) => s.user);

  const handleDocumentView = useCallback(
    (document: DocumentData) => {
      handleViewDocument(document.id, document.filename);
    },
    [handleViewDocument]
  );

  const handleDocumentDownload = useCallback(
    (document: DocumentData) => {
      void handleDownloadDocument(document.id, document.filename);
    },
    [handleDownloadDocument]
  );

  const handleDocumentShare = useCallback(
    (document: DocumentData) => {
      void handleShareDocument(document.id, document.filename);
    },
    [handleShareDocument]
  );

  const handleDocumentDelete = useCallback(
    async (document: DocumentData) => {
      const voidedAgreementAsAgent =
        document.library_kind === "agreement" &&
        user?.id === document.agent_id &&
        !["completed", "voided", "declined"].includes(
          (document.status ?? "").toLowerCase(),
        );
      try {
        await handleDelete(document);
        enqueueToast({
          type: "success",
          message: voidedAgreementAsAgent
            ? "Agreement cancelled in DocuSign and removed from saved for everyone."
            : "Document deleted successfully",
        });
      } catch (error) {
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to delete document",
        });
      }
    },
    [handleDelete, enqueueToast, user?.id]
  );

  return {
    handleDocumentView,
    handleDocumentDownload,
    handleDocumentShare,
    handleDocumentDelete,
  };
}
