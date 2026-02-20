import { useCallback, useEffect } from "react";

import { useDocuments as useDocumentsHook } from "packages/hooks/data/documents/useDocuments";
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
    setCategoriesError,
  );

  useEffect(() => {
    const store = useDocumentsStore.getState();
    // Replace the placeholder methods with real implementations
    store.uploadDocument = uploadDocument;
    store.deleteDocument = deleteDocument;
    store.updateDocumentStatus = updateDocumentStatus;
    store.signDocument = signDocument;
    store.downloadDocument = downloadDocument;
    store.refreshDocuments = refreshDocumentsWrapped;
    store.refreshCategories = refreshCategoriesWrapped;
  }, [
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocumentsWrapped,
    refreshCategoriesWrapped,
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
