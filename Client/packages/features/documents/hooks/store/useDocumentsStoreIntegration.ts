import { useCallback, useEffect } from "react";

import { useDocuments as useDocumentsHook } from "packages/features/documents/hooks/data/useDocuments";
import { useDocumentsStore } from "packages/store";

import { useDocumentsStoreSync } from "./documentsStoreSync";

/**
 * Hook that integrates useDocuments with useDocumentsStore
 * This replaces the DocumentsContext functionality
 */
export function useDocumentsStoreIntegration() {
  const documentsResult = useDocumentsHook();

  const {
    documents,
    documentCategories,
    uploadedFiles,
    documentsLoading,
    categoriesLoading,
    documentsError,
    categoriesError,
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocuments,
    refreshCategories,
    getDocumentsByCategory,
    getDocumentsByProperty,
    getDocumentsByOffer,
  } = documentsResult;

  // Select stable action references only. Subscribing to the full store would
  // re-run this hook on every set({ uploadDocument }) from the effect below,
  // which recreates useDocuments callbacks and causes an infinite loop.
  const setDocuments = useDocumentsStore((s) => s.setDocuments);
  const setDocumentCategories = useDocumentsStore((s) => s.setDocumentCategories);
  const setUploadedFiles = useDocumentsStore((s) => s.setUploadedFiles);
  const setDocumentsLoading = useDocumentsStore((s) => s.setDocumentsLoading);
  const setCategoriesLoading = useDocumentsStore((s) => s.setCategoriesLoading);
  const setDocumentsError = useDocumentsStore((s) => s.setDocumentsError);
  const setCategoriesError = useDocumentsStore((s) => s.setCategoriesError);
  const setUploadDocumentImpl = useDocumentsStore((s) => s.setUploadDocumentImpl);
  const setDeleteDocumentImpl = useDocumentsStore((s) => s.setDeleteDocumentImpl);
  const setUpdateDocumentStatusImpl = useDocumentsStore((s) => s.setUpdateDocumentStatusImpl);
  const setSignDocumentImpl = useDocumentsStore((s) => s.setSignDocumentImpl);
  const setDownloadDocumentImpl = useDocumentsStore((s) => s.setDownloadDocumentImpl);
  const setRefreshDocumentsImpl = useDocumentsStore((s) => s.setRefreshDocumentsImpl);
  const setRefreshCategoriesImpl = useDocumentsStore((s) => s.setRefreshCategoriesImpl);

  const refreshDocumentsWrapped = useCallback(async (): Promise<void> => {
    await refreshDocuments();
  }, [refreshDocuments]);

  const refreshCategoriesWrapped = useCallback(async (): Promise<void> => {
    await refreshCategories();
  }, [refreshCategories]);

  useDocumentsStoreSync(
    documents,
    setDocuments,
    documentCategories,
    setDocumentCategories,
    uploadedFiles,
    setUploadedFiles,
    documentsLoading,
    setDocumentsLoading,
    categoriesLoading,
    setCategoriesLoading,
    documentsError,
    setDocumentsError,
    categoriesError,
    setCategoriesError
  );

  useEffect(() => {
    setUploadDocumentImpl(uploadDocument);
    setDeleteDocumentImpl(deleteDocument);
    setUpdateDocumentStatusImpl(updateDocumentStatus);
    setSignDocumentImpl(signDocument);
    setDownloadDocumentImpl(downloadDocument);
    setRefreshDocumentsImpl(refreshDocumentsWrapped);
    setRefreshCategoriesImpl(refreshCategoriesWrapped);
  }, [
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocumentsWrapped,
    refreshCategoriesWrapped,
    setUploadDocumentImpl,
    setDeleteDocumentImpl,
    setUpdateDocumentStatusImpl,
    setSignDocumentImpl,
    setDownloadDocumentImpl,
    setRefreshDocumentsImpl,
    setRefreshCategoriesImpl,
  ]);

  return {
    documents,
    documentCategories,
    uploadedFiles,
    documentsLoading,
    categoriesLoading,
    documentsError,
    categoriesError,
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocuments: refreshDocumentsWrapped,
    refreshCategories: refreshCategoriesWrapped,
    getDocumentsByCategory,
    getDocumentsByProperty,
    getDocumentsByOffer,
  };
}
