import { useEffect, useRef } from "react";

import { useDocumentsStore } from "../../store/documents.slice";
import { useDocuments as useDocumentsHook } from "../data/useDocuments";

/**
 * Hook that integrates useDocuments with useDocumentsStore
 * This replaces the DocumentsContext functionality
 */
export function useDocumentsStoreIntegration() {
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
  } = useDocumentsHook();

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
  }, [documents, setDocuments]);

  useEffect(() => {
    if (lastDocumentCategoriesRef.current !== documentCategories) {
      lastDocumentCategoriesRef.current = documentCategories;
      setDocumentCategories(documentCategories);
    }
  }, [documentCategories, setDocumentCategories]);

  useEffect(() => {
    if (lastUploadedFilesRef.current !== uploadedFiles) {
      lastUploadedFilesRef.current = uploadedFiles;
      setUploadedFiles(uploadedFiles);
    }
  }, [uploadedFiles, setUploadedFiles]);

  useEffect(() => {
    if (lastDocumentsLoadingRef.current !== documentsLoading) {
      lastDocumentsLoadingRef.current = documentsLoading;
      setDocumentsLoading(documentsLoading);
    }
  }, [documentsLoading, setDocumentsLoading]);

  useEffect(() => {
    if (lastCategoriesLoadingRef.current !== categoriesLoading) {
      lastCategoriesLoadingRef.current = categoriesLoading;
      setCategoriesLoading(categoriesLoading);
    }
  }, [categoriesLoading, setCategoriesLoading]);

  useEffect(() => {
    if (lastDocumentsErrorRef.current !== documentsError) {
      lastDocumentsErrorRef.current = documentsError;
      setDocumentsError(documentsError);
    }
  }, [documentsError, setDocumentsError]);

  useEffect(() => {
    if (lastCategoriesErrorRef.current !== categoriesError) {
      lastCategoriesErrorRef.current = categoriesError;
      setCategoriesError(categoriesError);
    }
  }, [categoriesError, setCategoriesError]);

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
