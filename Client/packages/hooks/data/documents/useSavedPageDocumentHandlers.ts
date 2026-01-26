import { useCallback } from "react";
import { useUIStore } from "../../../store";
import type { DocumentData } from "./useDocumentsData";

type UseSavedPageDocumentHandlersProps = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string,
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

  const handleDocumentView = useCallback(
    (document: DocumentData) => {
      handleViewDocument(document.id, document.filename);
    },
    [handleViewDocument],
  );

  const handleDocumentDownload = useCallback(
    (document: DocumentData) => {
      void handleDownloadDocument(document.id, document.filename);
    },
    [handleDownloadDocument],
  );

  const handleDocumentShare = useCallback(
    (document: DocumentData) => {
      void handleShareDocument(document.id, document.filename);
    },
    [handleShareDocument],
  );

  const handleDocumentDelete = useCallback(
    async (document: DocumentData) => {
      try {
        await handleDelete(document);
        enqueueToast({
          type: "success",
          message: "Document deleted successfully",
        });
      } catch (error) {
        enqueueToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete document",
        });
      }
    },
    [handleDelete, enqueueToast],
  );

  return {
    handleDocumentView,
    handleDocumentDownload,
    handleDocumentShare,
    handleDocumentDelete,
  };
}
