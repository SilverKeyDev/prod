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

  const {
    setDocuments,
    setDocumentCategories,
    setUploadedFiles,
    setDocumentsLoading,
    setCategoriesLoading,
    setDocumentsError,
    setCategoriesError,
    setUploadDocumentImpl,
    setDeleteDocumentImpl,
    setUpdateDocumentStatusImpl,
    setSignDocumentImpl,
    setDownloadDocumentImpl,
    setRefreshDocumentsImpl,
    setRefreshCategoriesImpl,
  } = useDocumentsStore();

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
