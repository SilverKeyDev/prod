import { useCallback, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import { reportApi } from "packages/features/documents/api/report";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import {
  type DocumentData,
  useDocumentsData,
} from "packages/features/documents/hooks/data/useDocumentsData";
import {
  canSendForSignature,
  getDefaultAgreementTitle,
  sendForSignatureDisabledReason,
} from "packages/features/documents/hooks/store/documentSignature";
import { prepareAgreementSigningSession } from "packages/features/documents/utils/signAgreementNowFlow";
import { showErrorToast, showInfoToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { apiDownloadBlob } from "packages/services/http/compatibility";
import { useAuthStore } from "packages/store";

type DocumentHandlers = {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<{ success: boolean; message: string }>;
};

export type SendForSignatureParams = {
  document: DocumentData;
  title: string;
  signingMethod?: "embedded" | "email";
  agreementType?: string;
  buyerId?: string;
  recipientUserId?: string;
};

/**
 * Hook that integrates useDocumentsData with document actions
 * Specifically for PDF documents/reports displayed on the Saved page
 * @param clientId - Optional client ID for agents to view client's documents
 * @param handlers - Optional document handlers. If provided, these will be used instead of creating a new instance.
 *                   This ensures the modal state is shared between components.
 */
export function useDocumentsDataIntegration(
  clientId?: string,
  handlers?: DocumentHandlers,
) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const {
    documents,
    isLoading: documentsLoading,
    error: documentsError,
    refetchDocuments,
  } = useDocumentsData(clientId);

  // Use provided handlers or create new instance (for backward compatibility)
  const defaultHandlers = useDocumentActions();
  const handleViewDocument =
    handlers?.handleViewDocument ?? defaultHandlers.handleViewDocument;
  const handleDownloadDocument =
    handlers?.handleDownloadDocument ?? defaultHandlers.handleDownloadDocument;
  const handleShareDocument =
    handlers?.handleShareDocument ?? defaultHandlers.handleShareDocument;
  const [isSendingForSignature, setIsSendingForSignature] = useState(false);
  const [agreementSigningSession, setAgreementSigningSession] = useState<
    | { kind: "embedded"; agreementId: string; participantId: string }
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

  const onAgreementSigningComplete = useCallback(() => {
    setAgreementSigningSession(null);
    void refetchDocuments();
  }, [refetchDocuments]);

  const resolveAgreementId = useCallback(
    (document: DocumentData): string | null => {
      if (document.library_kind !== "agreement") return null;
      return document.id ?? document.library_item_id ?? null;
    },
    [],
  );

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
        });
      }
    },
    [resolveAgreementId, user],
  );

  const getSigningFileFromDocument = useCallback(
    async (document: DocumentData): Promise<File> => {
      // Pull file bytes through backend endpoint to avoid browser CORS issues with direct S3 fetch.
      const blob = await apiDownloadBlob(`/api/v1/report/${document.id}/view`, {
        includeAuth: true,
        includeCredentials: true,
      });
      const inferredFileName =
        document.filename && document.filename.trim().length > 0
          ? document.filename
          : "document.pdf";
      return new File([blob], inferredFileName, {
        type: blob.type && blob.type.length > 0 ? blob.type : "application/pdf",
      });
    },
    [],
  );

  const sendDocumentForSignature = useCallback(
    async ({
      document,
      title,
      signingMethod = "email",
      agreementType = "other",
      buyerId,
      recipientUserId,
    }: SendForSignatureParams): Promise<string> => {
      setIsSendingForSignature(true);
      try {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) {
          throw new Error("Agreement title is required");
        }

        log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature started", {
          documentId: document.id,
          libraryKind: document.library_kind,
          signingMethod,
          agreementType,
          buyerId: buyerId ?? document.user_id ?? null,
          recipientUserId: recipientUserId ?? null,
        });

        if (document.library_kind === "agreement") {
          const agreementId = resolveAgreementId(document);
          if (!agreementId) {
            throw new Error("Unable to resolve agreement id");
          }
          log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature: existing agreement path", {
            agreementId,
            signingMethod,
            participantUserId: recipientUserId ?? buyerId ?? null,
          });
          const sendResponse = await docusignApi.sendAgreement(agreementId, {
            signing_method: signingMethod,
            participant_user_id: recipientUserId ?? buyerId,
          });
          if (!sendResponse.success) {
            throw new Error(sendResponse.error ?? "Failed to send agreement");
          }
          void queryClient.invalidateQueries({
            queryKey: queryKeys.documents.all,
          });
          log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature completed (existing agreement)", {
            agreementId,
          });
          return agreementId;
        }

        const resolvedBuyerId = buyerId ?? document.user_id;
        if (!resolvedBuyerId) {
          throw new Error("Unable to determine buyer for this document");
        }

        const createAgreementResponse = await docusignApi.createAgreement({
          title: normalizedTitle,
          agreement_type: agreementType,
          buyer_id: resolvedBuyerId,
          property_address: document.address ?? undefined,
          description: `Generated from uploaded document: ${getDefaultAgreementTitle(
            document,
          )}`,
        });

        if (
          !createAgreementResponse.success ||
          !createAgreementResponse.agreement
        ) {
          throw new Error(
            createAgreementResponse.error ?? "Failed to create agreement",
          );
        }

        const agreementId = createAgreementResponse.agreement.id;
        log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature: agreement created from upload", {
          agreementId,
          buyerId: resolvedBuyerId,
        });

        const file = await getSigningFileFromDocument(document);
        const revisionResponse = await docusignApi.createRevision(
          agreementId,
          file,
          "Initial revision",
        );
        if (!revisionResponse.success || !revisionResponse.revision) {
          throw new Error(
            revisionResponse.error ?? "Failed to attach revision",
          );
        }
        log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature: revision attached", {
          agreementId,
          revisionId: revisionResponse.revision.id,
        });

        const sendResponse = await docusignApi.sendAgreement(agreementId, {
          signing_method: signingMethod,
          participant_user_id: recipientUserId ?? resolvedBuyerId,
        });
        if (!sendResponse.success) {
          throw new Error(sendResponse.error ?? "Failed to send agreement");
        }

        void queryClient.invalidateQueries({
          queryKey: queryKeys.documents.all,
        });
        log.info(LOG_CATEGORIES.DOCUSIGN, "Send for signature completed (upload → agreement)", {
          agreementId,
        });
        return agreementId;
      } catch (error: unknown) {
        log.error(LOG_CATEGORIES.ERRORS, "Send for signature failed", {
          error,
          documentId: document.id,
          libraryKind: document.library_kind,
        });
        throw error;
      } finally {
        setIsSendingForSignature(false);
      }
    },
    [getSigningFileFromDocument, queryClient, resolveAgreementId],
  );

  const signAgreementNow = useCallback(
    async (document: DocumentData): Promise<void> => {
      if (document.library_kind !== "agreement") {
        throw new Error("Sign is only available for agreements");
      }
      await beginInAppAgreementSigning(document);
    },
    [beginInAppAgreementSigning],
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
          showErrorToast(
            err instanceof Error ? err.message : "Failed to open signing",
          );
        });
        return;
      }
      handleViewDocument(documentId, documentName);
    },
    [documents, handleViewDocument, beginInAppAgreementSigning],
  );

  const handleDownloadDocumentForList = useCallback(
    async (documentId: string, documentName: string) => {
      const row = documents.find((d) => d.id === documentId);
      if (row?.library_kind === "agreement") {
        showInfoToast(
          "Download is not available for signing agreements in this list.",
        );
        return;
      }
      await handleDownloadDocument(documentId, documentName);
    },
    [documents, handleDownloadDocument],
  );

  const handleShareDocumentForList = useCallback(
    async (documentId: string, documentName: string) => {
      const row = documents.find((d) => d.id === documentId);
      if (row?.library_kind === "agreement") {
        showInfoToast(
          "Share is not available for signing agreements in this list.",
        );
        return { success: false, message: "Not available for agreements" };
      }
      return handleShareDocument(documentId, documentName);
    },
    [documents, handleShareDocument],
  );

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
        queryKeys.documents.list(undefined, clientId),
      );
      queryClient.setQueryData(
        queryKeys.documents.list(undefined, clientId),
        (old: DocumentData[] | undefined) => {
          if (!old) return old;
          return old.filter((doc) => doc.id !== docId);
        },
      );
      return { previousDocuments };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      log.error(LOG_CATEGORIES.ERRORS, "Error deleting document", error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          queryKeys.documents.list(undefined, clientId),
          context.previousDocuments,
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

  // Remove from library mutation (for documents from other users)
  const removeFromLibraryMutation = useMutation({
    mutationFn: async (libraryItemId: string) => {
      const response = await reportApi.removeFromLibrary(libraryItemId);
      if (!response.success) {
        const errorMessage =
          response.error ?? "Failed to remove document from library";
        log.error(LOG_CATEGORIES.API, "Failed to remove from library", {
          libraryItemId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return { libraryItemId, response };
    },
    onMutate: async (libraryItemId) => {
      // Optimistic update - remove the document from cache
      const previousDocuments = queryClient.getQueryData<DocumentData[]>(
        queryKeys.documents.list(undefined, clientId),
      );
      queryClient.setQueryData(
        queryKeys.documents.list(undefined, clientId),
        (old: DocumentData[] | undefined) => {
          if (!old) return old;
          return old.filter((doc) => doc.library_item_id !== libraryItemId);
        },
      );
      return { previousDocuments };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      log.error(LOG_CATEGORIES.ERRORS, "Error removing from library", error);
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          queryKeys.documents.list(undefined, clientId),
          context.previousDocuments,
        );
      }
    },
    onSuccess: () => {
      log.info(
        LOG_CATEGORIES.API,
        "Document removed from library successfully",
      );
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });

  const handleDelete = useCallback(
    async (doc: DocumentData) => {
      // Check if document is from another user
      const currentUser = user;
      const currentUserId = currentUser?.id;
      const isFromOtherUser =
        currentUserId && doc.user_id && currentUserId !== doc.user_id;

      // Agreements sent by this agent: void in DocuSign and remove library row (server).
      if (doc.library_kind === "agreement") {
        if (
          currentUserId &&
          doc.agent_id === currentUserId &&
          !["completed", "voided", "declined"].includes(
            (doc.status ?? "").toLowerCase(),
          )
        ) {
          const voidResponse = await docusignApi.voidAgreement(doc.id, {
            reason: "Cancelled by agent from Saved",
          });
          if (!voidResponse.success) {
            throw new Error(
              voidResponse.error ?? "Failed to cancel agreement",
            );
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
        // Remove from library only (doesn't delete the actual document)
        await removeFromLibraryMutation.mutateAsync(doc.library_item_id);
      } else {
        // Full delete (deletes the actual document)
        await deleteDocumentMutation.mutateAsync({
          docId: doc.id,
          s3Key: doc.file_path,
        });
      }
    },
    [
      deleteDocumentMutation,
      removeFromLibraryMutation,
      queryClient,
      user,
    ],
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
    onAgreementSigningComplete,
  };
}
