import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import { reportApi } from "packages/features/documents/api/report";
import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

export function useDocumentsLibraryMutations(clientId?: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ docId, s3Key }: { docId: string; s3Key?: string }) => {
      const response = await reportApi.delete(docId, s3Key);
      if (!response.success) {
        const errorMessage = resolveApiResultErrorMessage(response, "Failed to delete document");
        log.error(LOG_CATEGORIES.API, "Failed to delete document", {
          docId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return { docId, response };
    },
    onMutate: async ({ docId }) => {
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  const removeFromLibraryMutation = useMutation({
    mutationFn: async (libraryItemId: string) => {
      const response = await reportApi.removeFromLibrary(libraryItemId);
      if (!response.success) {
        const errorMessage = resolveApiResultErrorMessage(
          response,
          "Failed to remove document from library"
        );
        log.error(LOG_CATEGORIES.API, "Failed to remove from library", {
          libraryItemId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return { libraryItemId, response };
    },
    onMutate: async (libraryItemId) => {
      const previousDocuments = queryClient.getQueryData<DocumentData[]>(
        queryKeys.documents.list(undefined, clientId)
      );
      queryClient.setQueryData(
        queryKeys.documents.list(undefined, clientId),
        (old: DocumentData[] | undefined) => {
          if (!old) return old;
          return old.filter((doc) => doc.library_item_id !== libraryItemId);
        }
      );
      return { previousDocuments };
    },
    onError: (error, _variables, context) => {
      log.error(LOG_CATEGORIES.ERRORS, "Error removing from library", error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          queryKeys.documents.list(undefined, clientId),
          context.previousDocuments
        );
      }
    },
    onSuccess: () => {
      log.info(LOG_CATEGORIES.API, "Document removed from library successfully");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  const handleDelete = useCallback(
    async (doc: DocumentData) => {
      const currentUser = user;
      const currentUserId = currentUser?.id;
      const isFromOtherUser = currentUserId && doc.user_id && currentUserId !== doc.user_id;

      if (doc.library_kind === "agreement") {
        if (currentUserId && doc.agent_id === currentUserId) {
          const discardResponse = await docusignApi.discardAgreement(doc.id, {
            reason: "Removed by agent from Saved",
          });
          if (!discardResponse.success) {
            throw new Error(discardResponse.error ?? "Failed to discard agreement");
          }
          void queryClient.invalidateQueries({
            queryKey: queryKeys.documents.all,
          });
          return;
        }
        if (doc.library_item_id) {
          await removeFromLibraryMutation.mutateAsync(doc.library_item_id);
        }
        return;
      }

      if (isFromOtherUser && doc.library_item_id) {
        await removeFromLibraryMutation.mutateAsync(doc.library_item_id);
      } else {
        await deleteDocumentMutation.mutateAsync({
          docId: doc.id,
          s3Key: doc.file_path,
        });
      }
    },
    [deleteDocumentMutation, removeFromLibraryMutation, queryClient, user]
  );

  return { handleDelete };
}
