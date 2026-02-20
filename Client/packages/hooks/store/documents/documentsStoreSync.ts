import { useEffect, useRef } from "react";

/**
 * Syncs documents hook data to store with ref guards.
 * Extracted to satisfy max-lines-per-function in useDocumentsStoreIntegration.
 */
export function useDocumentsStoreSync(
  documents: unknown,
  setDocuments: (v: unknown) => void,
  documentCategories: unknown,
  setDocumentCategories: (v: unknown) => void,
  uploadedFiles: unknown,
  setUploadedFiles: (v: unknown) => void,
  documentsLoading: unknown,
  setDocumentsLoading: (v: unknown) => void,
  categoriesLoading: unknown,
  setCategoriesLoading: (v: unknown) => void,
  documentsError: unknown,
  setDocumentsError: (v: unknown) => void,
  categoriesError: unknown,
  setCategoriesError: (v: unknown) => void,
) {
  const r1 = useRef<unknown>();
  const r2 = useRef<unknown>();
  const r3 = useRef<unknown>();
  const r4 = useRef<unknown>();
  const r5 = useRef<unknown>();
  const r6 = useRef<unknown>();
  const r7 = useRef<unknown>();

  useEffect(() => {
    if (r1.current !== documents) {
      r1.current = documents;
      setDocuments(documents);
    }
  }, [documents, setDocuments]);

  useEffect(() => {
    if (r2.current !== documentCategories) {
      r2.current = documentCategories;
      setDocumentCategories(documentCategories);
    }
  }, [documentCategories, setDocumentCategories]);

  useEffect(() => {
    if (r3.current !== uploadedFiles) {
      r3.current = uploadedFiles;
      setUploadedFiles(uploadedFiles);
    }
  }, [uploadedFiles, setUploadedFiles]);

  useEffect(() => {
    if (r4.current !== documentsLoading) {
      r4.current = documentsLoading;
      setDocumentsLoading(documentsLoading);
    }
  }, [documentsLoading, setDocumentsLoading]);

  useEffect(() => {
    if (r5.current !== categoriesLoading) {
      r5.current = categoriesLoading;
      setCategoriesLoading(categoriesLoading);
    }
  }, [categoriesLoading, setCategoriesLoading]);

  useEffect(() => {
    if (r6.current !== documentsError) {
      r6.current = documentsError;
      setDocumentsError(documentsError);
    }
  }, [documentsError, setDocumentsError]);

  useEffect(() => {
    if (r7.current !== categoriesError) {
      r7.current = categoriesError;
      setCategoriesError(categoriesError);
    }
  }, [categoriesError, setCategoriesError]);
}
