import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { reportApi } from "packages/features/documents/api/report";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import {
  type DocumentData,
  useDocumentsData,
} from "packages/features/documents/hooks/data/useDocumentsData";
import { log, LOG_CATEGORIES } from "packages/logger";

type DocumentHandlers = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (documentId: string, documentName: string) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
};

/**
 * Hook that integrates useDocumentsData with document actions
 * Specifically for PDF documents/reports displayed on the Saved page
 * @param clientId - Optional client ID for agents to view client's documents
 * @param handlers - Optional document handlers. If provided, these will be used instead of creating a new instance.
 *                   This ensures the modal state is shared between components.
 */
export function useDocumentsDataIntegration(clientId?: string, handlers?: DocumentHandlers) {
  const queryClient = useQueryClient();
  const {
    documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetchDocuments,
  } = useDocumentsData(clientId);

  // Use provided handlers or create new instance (for backward compatibility)
  const defaultHandlers = useDocumentActions();
  const { handleViewDocument, handleDownloadDocument, handleShareDocument } =
    handlers ?? defaultHandlers;

  // Delete document mutation with optimistic updates
  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ docId, s3Key }: { docId: string; s3Key?: string }) => {
      const response = await reportApi.delete(docId, s3Key);
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to delete document";
        log.error(LOG_CATEGORIES.API, "Failed to delete document", {
          docId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return { docId, response };
    },
    onMutate: async ({ docId }) => {
      // Optimistic update - remove the document from cache
      const previousDocuments = queryClient.getQueryData<DocumentData[]>(
        queryKeys.documents.list(undefined, clientId)
      );
      queryClient.setQueryData(
        queryKeys.documents.list(undefined, clientId),
        (old: DocumentData[] | undefined) => {
          if (!old) return old;
          return old.filter((doc) => doc.id !== docId);
        }
      );
      return { previousDocuments };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      log.error(LOG_CATEGORIES.ERRORS, "Error deleting document", error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          queryKeys.documents.list(undefined, clientId),
          context.previousDocuments
        );
      }
    },
    onSuccess: () => {
      log.info(LOG_CATEGORIES.API, "Document deleted successfully");
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  const handleDelete = useCallback(
    async (doc: DocumentData) => {
      // file_path contains the S3 key or local path
      await deleteDocumentMutation.mutateAsync({
        docId: doc.id,
        s3Key: doc.file_path,
      });
    },
    [deleteDocumentMutation]
  );

  return {
    documents,
    documentsLoading,
    documentsError,
    refetchDocuments,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    handleDelete,
  };
}
