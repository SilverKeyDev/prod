import { useEffect, useRef } from "react";

import { useDocumentsStore } from "../../../store/documents.slice";
import { useDocuments as useDocumentsHook } from "../../data/documents/useDocuments";
import { useAuthStore } from "../../../store/auth.slice";

/**
 * Hook that integrates useDocuments with useDocumentsStore
 * This replaces the DocumentsContext functionality
 */
export function useDocumentsStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Always call useDocuments hook to maintain hook order consistency
  // The hook itself will handle the Router context requirements
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

  // Sync hook data with store (guard against redundant updates)
  const lastDocumentsRef = useRef<typeof documents>();
  const lastDocumentCategoriesRef = useRef<typeof documentCategories>();
  const lastUploadedFilesRef = useRef<typeof uploadedFiles>();
  const lastDocumentsLoadingRef = useRef<typeof documentsLoading>();
  const lastCategoriesLoadingRef = useRef<typeof categoriesLoading>();
  const lastDocumentsErrorRef = useRef<typeof documentsError>();
  const lastCategoriesErrorRef = useRef<typeof categoriesError>();

  // Sync hook data with store
  useEffect(() => {
    if (lastDocumentsRef.current !== documents) {
      lastDocumentsRef.current = documents;
      setDocuments(documents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]); // Zustand setters are stable

  useEffect(() => {
    if (lastDocumentCategoriesRef.current !== documentCategories) {
      lastDocumentCategoriesRef.current = documentCategories;
      setDocumentCategories(documentCategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentCategories]); // Zustand setters are stable

  useEffect(() => {
    if (lastUploadedFilesRef.current !== uploadedFiles) {
      lastUploadedFilesRef.current = uploadedFiles;
      setUploadedFiles(uploadedFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]); // Zustand setters are stable

  useEffect(() => {
    if (lastDocumentsLoadingRef.current !== documentsLoading) {
      lastDocumentsLoadingRef.current = documentsLoading;
      setDocumentsLoading(documentsLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsLoading]); // Zustand setters are stable

  useEffect(() => {
    if (lastCategoriesLoadingRef.current !== categoriesLoading) {
      lastCategoriesLoadingRef.current = categoriesLoading;
      setCategoriesLoading(categoriesLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesLoading]); // Zustand setters are stable

  useEffect(() => {
    if (lastDocumentsErrorRef.current !== documentsError) {
      lastDocumentsErrorRef.current = documentsError;
      setDocumentsError(documentsError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsError]); // Zustand setters are stable

  useEffect(() => {
    if (lastCategoriesErrorRef.current !== categoriesError) {
      lastCategoriesErrorRef.current = categoriesError;
      setCategoriesError(categoriesError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesError]); // Zustand setters are stable

  // Override the store's placeholder methods with real implementations
  useEffect(() => {
    const store = useDocumentsStore.getState();
    // Replace the placeholder methods with real implementations
    store.uploadDocument = uploadDocument;
    store.deleteDocument = deleteDocument;
    store.updateDocumentStatus = updateDocumentStatus;
    store.signDocument = signDocument;
    store.downloadDocument = downloadDocument;
    store.refreshDocuments = refreshDocuments;
    store.refreshCategories = refreshCategories;
  }, [
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    signDocument,
    downloadDocument,
    refreshDocuments,
    refreshCategories,
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
    refreshDocuments,
    refreshCategories,
    getDocumentsByCategory,
    getDocumentsByProperty,
    getDocumentsByOffer,
  };
}
