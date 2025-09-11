import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Document, DocumentCategory } from "../types";
import { createAbortManager, isAbortError } from "../api/utils/index";
import { useAuth } from "../app/providers";
import { dashboardApi, secureUploadApi } from "../api";

/* =========================
   Types
   ========================= */

interface DocumentsContextType {
  documents: Document[];
  documentCategories: DocumentCategory[];
  uploadedFiles: any[];
  documentsLoading: boolean;
  categoriesLoading: boolean;
  documentsError: string | null;
  categoriesError: string | null;
  uploadDocument: (
    file: File,
    category: string,
    propertyId?: string,
    offerId?: string,
  ) => Promise<Document>;
  deleteDocument: (docId: string) => Promise<void>;
  updateDocumentStatus: (
    docId: string,
    status: Document["status"],
  ) => Promise<void>;
  signDocument: (docId: string) => Promise<void>;
  downloadDocument: (docId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  getDocumentsByCategory: (category: string) => Document[];
  getDocumentsByProperty: (propertyId: string) => Document[];
  getDocumentsByOffer: (offerId: string) => Document[];
}

/* =========================
   Context
   ========================= */

const DocumentsContext = createContext<DocumentsContextType | undefined>(
  undefined,
);

interface DocumentsProviderProps {
  children: ReactNode;
}

export function DocumentsProvider({ children }: DocumentsProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuth();

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  /* =========================
     Fetchers
     ========================= */

  const fetchDocuments = useCallback(async (_signal?: AbortSignal) => {
    setDocumentsLoading(true);
    setDocumentsError(null);

    try {
      const response = await dashboardApi.getDocuments();
      if (response.success && response.documents) {
        setDocuments(response.documents);
      } else {
        setDocuments([]);
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch documents", e);
        setDocumentsError(e?.message ?? "Failed to fetch documents");
        setDocuments([]); // Safe fallback
      }
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (_signal?: AbortSignal) => {
    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const response = await dashboardApi.getCategories();
      if (response.success && response.categories) {
        setCategories(response.categories);
      } else {
        setCategories([]);
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch document categories", e);
        setCategoriesError(e?.message ?? "Failed to fetch document categories");
        setCategories([]); // Safe fallback
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const uploadDocument = async (
    file: File,
    category: string,
    propertyId?: string,
    offerId?: string,
  ): Promise<Document> => {
    // Create upload tracking entry
    const uploadId = `${Date.now()}-${file.name}`;
    const uploadEntry: any = {
      id: uploadId,
      file,
      progress: 0,
      status: "uploading",
    };
    setUploadedFiles((prev) => [...prev, uploadEntry]);

    try {
      const metadata = {
        category,
        ...(propertyId && { property_id: propertyId }),
        ...(offerId && { offer_id: offerId }),
      };

      const result = await secureUploadApi.uploadDocument(file, metadata);

      if (result.success && result.file_id) {
        const newDocument: Document = {
          id: result.file_id || `doc-${Date.now()}`,
          name: file.name,
          file_path: result.file_url || "",
          file_size: result.file_size || file.size,
          file_type: result.content_type || file.type,
          category,
          property_id: propertyId,
          offer_id: offerId,
          uploaded_by: "", // Will be set by backend
          uploaded_at: new Date(),
          expiry_date: undefined,
          status: "pending",
        };

        setDocuments((prev) => [...prev, newDocument]);

        // Update upload status to completed
        setUploadedFiles((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "completed", progress: 100 }
              : upload,
          ),
        );

        return newDocument;
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Update upload status to failed
      setUploadedFiles((prev) =>
        prev.map((upload) =>
          upload.id === uploadId
            ? { ...upload, status: "failed", progress: 0 }
            : upload,
        ),
      );

      throw error;
    }
  };

  const performUpdateDocumentStatus = useCallback(
    async (
      docId: string,
      status: Document["status"],
      _signal?: AbortSignal,
    ) => {
      try {
        const response = await dashboardApi.updateDocumentStatus(docId, status);
        if (response.success && response.document) {
          const updatedDocument = {
            ...response.document,
            uploaded_at: new Date(response.document.uploaded_at),
            expiry_date: response.document.expiry_date
              ? new Date(response.document.expiry_date)
              : undefined,
          };

          setDocuments((prev) =>
            prev.map((doc) => (doc.id === docId ? updatedDocument : doc)),
          );
        } else {
          throw new Error(response.error || "Failed to update document status");
        }
      } catch (e: unknown) {
        if (!isAbortError(e)) {
          console.error("Failed to update document status", e);
          throw e;
        }
      }
    },
    [],
  );

  const performSignDocument = useCallback(
    async (docId: string, _signal?: AbortSignal) => {
      try {
        const response = await dashboardApi.signDocument(docId);
        if (response.success && response.document) {
          const signedDocument = {
            ...response.document,
            uploaded_at: new Date(response.document.uploaded_at),
            expiry_date: response.document.expiry_date
              ? new Date(response.document.expiry_date)
              : undefined,
          };

          setDocuments((prev) =>
            prev.map((doc) => (doc.id === docId ? signedDocument : doc)),
          );
        } else {
          throw new Error(response.error || "Failed to sign document");
        }
      } catch (e: unknown) {
        if (!isAbortError(e)) {
          console.error("Failed to sign document", e);
          throw e;
        }
      }
    },
    [],
  );

  const performDownloadDocument = useCallback(async (docId: string) => {
    try {
      await secureUploadApi.downloadDocument(docId);
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to download document", e);
        throw e;
      }
    }
  }, []);

  const performDeleteDocument = useCallback(async (docId: string) => {
    try {
      const json = await secureUploadApi.deleteDocument(docId);

      if (json.success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      } else {
        throw new Error(json.error || "Failed to delete document");
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to delete document", e);
        throw e;
      }
    }
  }, []);

  /* =========================
     Public functions
     ========================= */

  const deleteDocument = useCallback(
    (docId: string) => withAbort(() => performDeleteDocument(docId)),
    [withAbort, performDeleteDocument],
  );

  const updateDocumentStatus = useCallback(
    (docId: string, status: Document["status"]) =>
      withAbort((s) => performUpdateDocumentStatus(docId, status, s)),
    [withAbort, performUpdateDocumentStatus],
  );

  const signDocument = useCallback(
    (docId: string) => withAbort((s) => performSignDocument(docId, s)),
    [withAbort, performSignDocument],
  );

  const downloadDocument = useCallback(
    (docId: string) => withAbort(() => performDownloadDocument(docId)),
    [withAbort, performDownloadDocument],
  );

  const refreshDocuments = useCallback(
    () => withAbort((s) => fetchDocuments(s)),
    [withAbort, fetchDocuments],
  );

  const refreshCategories = useCallback(
    () => withAbort((s) => fetchCategories(s)),
    [withAbort, fetchCategories],
  );

  // Helper functions
  const getDocumentsByCategory = useCallback(
    (category: string) => documents.filter((doc) => doc.category === category),
    [documents],
  );

  const getDocumentsByProperty = useCallback(
    (propertyId: string) =>
      documents.filter((doc) => doc.property_id === propertyId),
    [documents],
  );

  const getDocumentsByOffer = useCallback(
    (offerId: string) => documents.filter((doc) => doc.offer_id === offerId),
    [documents],
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {}, [
    authReady,
    user?.id,
    refreshDocuments,
    refreshCategories,
  ]);

  // Cross-tab auth changes - only refresh if on relevant routes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // DISABLED: Backend endpoints don't exist
          // const enabled =
          //   routeStartsWith("/documents") || routeStartsWith("/negotiation");
          // if (enabled) {
          //   refreshDocuments();
          //   refreshCategories();
          // }
        } else {
          // Clear everything
          setDocuments([]);
          setCategories([]);
          setDocumentsError(null);
          setCategoriesError(null);
          abortAll();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshDocuments, refreshCategories, abortAll]);

  // Cleanup completed uploads after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setUploadedFiles((prev) =>
        prev.filter(
          (upload) =>
            upload.status === "uploading" ||
            Date.now() - parseInt(upload.id.split("-")[0]) < 5 * 60 * 1000,
        ),
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<DocumentsContextType>(
    () => ({
      documents,
      documentCategories: categories,
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
    }),
    [
      documents,
      categories,
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
    ],
  );

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

/* =========================
   Hook
   ========================= */

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx)
    throw new Error("useDocuments must be used within a DocumentsProvider");
  return ctx;
}
