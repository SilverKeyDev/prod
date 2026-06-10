import { useCallback, useEffect, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  type SavedPageViewType,
  useDocumentActions,
  useDocumentsDataIntegration,
  useSavedPageDocumentHandlers,
} from "packages/features/documents";
import { useSavedFeatureSignatureFlow } from "packages/features/saved/hooks/useSavedFeatureSignatureFlow";
import { log } from "packages/logger";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/transaction/documents";

export type SavedDocumentsCoordinator = ReturnType<typeof useSavedDocumentsCoordinator>;

export function useSavedDocumentsCoordinator(
  selectedClientId: string | null,
  viewType: SavedPageViewType,
  eventTypeFilter: "listed" | "price_change" | "sold" | "withdrawn" | ""
) {
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const {
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  } = useDocumentActions();

  const documentHandlers = useMemo(
    () => ({
      handleViewDocument,
      handleDownloadDocument,
      handleShareDocument,
    }),
    [handleViewDocument, handleDownloadDocument, handleShareDocument]
  );

  const documentsIntegration = useDocumentsDataIntegration(
    selectedClientId ?? undefined,
    documentHandlers
  );

  const {
    documents,
    documentsLoading: documentsLoadingState,
    documentsError: documentsErrorState,
    refetchDocuments,
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
    handleDelete,
    isSendingForSignature,
    sendDocumentForSignature,
    signAgreementNow,
    getDefaultAgreementTitle,
    sendForSignatureDisabledReason,
    agreementSigningSession,
    dismissAgreementSigning,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    openViewSignedAgreement,
    onAgreementSigningComplete,
  } = documentsIntegration;

  const signatureFlow = useSavedFeatureSignatureFlow(documents, selectedClientId, enqueueToast, {
    sendDocumentForSignature,
    getDefaultAgreementTitle,
    sendForSignatureDisabledReason,
    refetchDocuments,
    signAgreementNow,
  });

  const { handleDocumentDelete } = useSavedPageDocumentHandlers({
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
    handleDelete,
    documents,
  });

  useEffect(() => {
    if (currentPdf) {
      log.debug("PAGES", "Library currentPdf updated", {
        currentPdf,
        currentDocumentId,
        currentDocumentName,
        timestamp: dateNow().toISOString(),
      });
    }
  }, [currentPdf, currentDocumentId, currentDocumentName]);

  const refresh = useCallback(async () => {
    if (viewType === "documents" || viewType === "agreements") {
      await refetchDocuments();
    } else if (viewType === "forms-library") {
      await queryClient.invalidateQueries({ queryKey: queryKeys.formsLibrary.list() });
    }
  }, [viewType, refetchDocuments, queryClient]);

  const filteredDocuments = useMemo(() => {
    if (eventTypeFilter === "") return documents;
    return documents.filter((doc) => doc.event_type === eventTypeFilter);
  }, [documents, eventTypeFilter]);

  const documentsTabCount = useMemo(
    () => filterDocumentLibraryExcludingAgreements(filteredDocuments).length,
    [filteredDocuments]
  );
  const agreementsTabCount = useMemo(
    () => filteredDocuments.filter((d) => d.library_kind === "agreement").length,
    [filteredDocuments]
  );

  const documentsErrorForEffects: string | null =
    documentsErrorState != null ? String(documentsErrorState) : null;

  return {
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    documentsLoadingState,
    documentsErrorForEffects,
    refetchDocuments,
    documentListView,
    documentListDownload,
    documentListShare,
    handleDocumentDelete,
    filteredDocuments,
    documentsTabCount,
    agreementsTabCount,
    refresh,
    signatureFlow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    openViewSignedAgreement,
    isSendingForSignature,
    sendForSignatureDisabledReason,
  };
}
