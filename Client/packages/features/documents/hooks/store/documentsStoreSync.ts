import { useEffect, useRef } from "react";

import type {
  DocumentCategory,
  WorkflowDocument,
} from "packages/features/documents/types/documents";

/**
 * Syncs documents hook data to store with ref guards.
 * Extracted to satisfy max-lines-per-function in useDocumentsStoreIntegration.
 */
export function useDocumentsStoreSync(
  documents: WorkflowDocument[],
  setDocuments: (v: WorkflowDocument[]) => void,
  documentCategories: DocumentCategory[],
  setDocumentCategories: (v: DocumentCategory[]) => void,
  uploadedFiles: unknown[],
  setUploadedFiles: (v: unknown[]) => void,
  documentsLoading: boolean,
  setDocumentsLoading: (v: boolean) => void,
  categoriesLoading: boolean,
  setCategoriesLoading: (v: boolean) => void,
  documentsError: string | null,
  setDocumentsError: (v: string | null) => void,
  categoriesError: string | null,
  setCategoriesError: (v: string | null) => void,
) {
  const r1 = useRef<WorkflowDocument[]>();
  const r2 = useRef<DocumentCategory[]>();
  const r3 = useRef<unknown[]>();
  const r4 = useRef<boolean>();
  const r5 = useRef<boolean>();
  const r6 = useRef<string | null>();
  const r7 = useRef<string | null>();

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
