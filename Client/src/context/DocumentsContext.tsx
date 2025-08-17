import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Document,
  DocumentCategory,
  BASE_URL,
} from "./utils";
import {
  fetchJson,
  logHttp,
  createAuthHeaders,
  createAbortManager,
  isAbortError,
  getAuthToken,
  routeStartsWith,
} from "../lib/fetchUtils";
import { useAuthState } from "../lib/authUtils";

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
  uploadDocument: (file: File, category: string, propertyId?: string, offerId?: string) => Promise<Document>;
  deleteDocument: (docId: string) => Promise<void>;
  updateDocumentStatus: (docId: string, status: Document['status']) => Promise<void>;
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

const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

interface DocumentsProviderProps {
  children: ReactNode;
}

export function DocumentsProvider({ children }: DocumentsProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuthState();
  
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

  const fetchDocuments = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;
    
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      const json = await fetchJson<{ success: boolean; documents?: Document[]; error?: string }>(
        `${BASE_URL}/api/v1/documents`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404] // Treat 404 as empty documents
        }
      );
      
      if (json?.success && json.documents) {
        setDocuments(json.documents);
      } else if (json === undefined) {
        // 404 response, treat as empty
        setDocuments([]);
      } else {
        throw new Error(json?.error || "Failed to fetch documents");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('documents', e);
        setDocumentsError(e?.message ?? "Failed to fetch documents");
        setDocuments([]); // Safe fallback
      }
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setCategoriesLoading(true);
    setCategoriesError(null);

    try {
      const json = await fetchJson<{ success: boolean; categories?: DocumentCategory[]; error?: string }>(
        `${BASE_URL}/api/v1/documents/categories`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404] // Treat 404 as empty categories
        }
      );

      if (json?.success && json.categories) {
        setCategories(json.categories);
      } else if (json === undefined) {
        // 404 response, treat as empty
        setCategories([]);
      } else {
        throw new Error(json?.error || "Failed to fetch document categories");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('categories', e);
        setCategoriesError(e?.message ?? "Failed to fetch document categories");
        setCategories([]); // Safe fallback
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const performUploadDocument = useCallback(async (
    file: File, 
    category: string, 
    propertyId?: string, 
    offerId?: string, 
    signal?: AbortSignal
  ): Promise<Document> => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token");

    // Create upload tracking entry
    const uploadId = `${Date.now()}-${file.name}`;
    const uploadEntry: any = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading',
    };
    setUploadedFiles(prev => [...prev, uploadEntry]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (propertyId) formData.append('property_id', propertyId);
      if (offerId) formData.append('offer_id', offerId);

      const response = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
        signal,
      });

      const json = await response.json();

      if (json.success && json.document) {
        const newDocument = {
          ...json.document,
          uploaded_at: new Date(json.document.uploaded_at),
          expiry_date: json.document.expiry_date ? new Date(json.document.expiry_date) : undefined,
        };
        
        setDocuments(prev => [...prev, newDocument]);
        
        // Update upload status
        setUploadedFiles(prev => prev.map(upload => 
          upload.id === uploadId 
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        ));

        return newDocument;
      } else {
        throw new Error(json.error || "Failed to upload document");
      }
    } catch (e: any) {
      // Update upload status to failed
      setUploadedFiles(prev => prev.map(upload => 
        upload.id === uploadId 
          ? { ...upload, status: 'failed', error: e.message }
          : upload
      ));
      
      if (!isAbortError(e)) {
        logHttp('upload', e);
        throw e;
      }
      throw e;
    }
  }, []);

  const performDeleteDocument = useCallback(async (docId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; error?: string }>(
        `${BASE_URL}/api/v1/documents/${docId}`,
        {
          method: "DELETE",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal,
        }
      );

      if (json.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
      } else {
        throw new Error(json.error || "Failed to delete document");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('delete', e);
        throw e;
      }
    }
  }, []);

  const performUpdateDocumentStatus = useCallback(async (docId: string, status: Document['status'], signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; document?: Document; error?: string }>(
        `${BASE_URL}/api/v1/documents/${docId}/status`,
        {
          method: "PUT",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify({ status }),
          signal,
        }
      );

      if (json.success && json.document) {
        const updatedDocument = {
          ...json.document,
          uploaded_at: new Date(json.document.uploaded_at),
          expiry_date: json.document.expiry_date ? new Date(json.document.expiry_date) : undefined,
        };
        
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? updatedDocument : doc
        ));
      } else {
        throw new Error(json.error || "Failed to update document status");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('update', e);
        throw e;
      }
    }
  }, []);

  const performSignDocument = useCallback(async (docId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; document?: Document; error?: string }>(
        `${BASE_URL}/api/v1/documents/${docId}/sign`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal,
        }
      );

      if (json.success && json.document) {
        const signedDocument = {
          ...json.document,
          uploaded_at: new Date(json.document.uploaded_at),
          expiry_date: json.document.expiry_date ? new Date(json.document.expiry_date) : undefined,
        };
        
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? signedDocument : doc
        ));
      } else {
        throw new Error(json.error || "Failed to sign document");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('sign', e);
        throw e;
      }
    }
  }, []);

  const performDownloadDocument = useCallback(async (docId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/documents/${docId}/download`, {
        method: 'GET',
        headers: createAuthHeaders(token),
        credentials: 'include',
        signal,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const json = await response.json();
        throw new Error(json.error || "Failed to download document");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('download', e);
        throw e;
      }
    }
  }, []);

  /* =========================
     Public functions
     ========================= */

  const uploadDocument = useCallback((file: File, category: string, propertyId?: string, offerId?: string) => 
    withAbort((s) => performUploadDocument(file, category, propertyId, offerId, s)), 
    [withAbort, performUploadDocument]
  );

  const deleteDocument = useCallback((docId: string) => 
    withAbort((s) => performDeleteDocument(docId, s)), 
    [withAbort, performDeleteDocument]
  );

  const updateDocumentStatus = useCallback((docId: string, status: Document['status']) => 
    withAbort((s) => performUpdateDocumentStatus(docId, status, s)), 
    [withAbort, performUpdateDocumentStatus]
  );

  const signDocument = useCallback((docId: string) => 
    withAbort((s) => performSignDocument(docId, s)), 
    [withAbort, performSignDocument]
  );

  const downloadDocument = useCallback((docId: string) => 
    withAbort((s) => performDownloadDocument(docId, s)), 
    [withAbort, performDownloadDocument]
  );

  const refreshDocuments = useCallback(() => 
    withAbort((s) => fetchDocuments(s)), 
    [withAbort, fetchDocuments]
  );

  const refreshCategories = useCallback(() => 
    withAbort((s) => fetchCategories(s)), 
    [withAbort, fetchCategories]
  );

  // Helper functions
  const getDocumentsByCategory = useCallback((category: string) => 
    documents.filter(doc => doc.category === category), 
    [documents]
  );

  const getDocumentsByProperty = useCallback((propertyId: string) => 
    documents.filter(doc => doc.property_id === propertyId), 
    [documents]
  );

  const getDocumentsByOffer = useCallback((offerId: string) => 
    documents.filter(doc => doc.offer_id === offerId), 
    [documents]
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const enabled = authReady && !!user?.id && (
      routeStartsWith('/dashboard/documents') ||
      routeStartsWith('/documents') ||
      routeStartsWith('/dashboard/negotiation') || // Negotiation may need documents
      routeStartsWith('/negotiation')
    );
    
    if (enabled) {
      refreshDocuments();
      refreshCategories();
    }
  }, [authReady, user?.id, refreshDocuments, refreshCategories]);

  // Cross-tab auth changes - only refresh if on relevant routes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // Only refresh if on relevant routes
          const enabled = routeStartsWith('/dashboard/documents') ||
                          routeStartsWith('/documents') ||
                          routeStartsWith('/dashboard/negotiation') ||
                          routeStartsWith('/negotiation');
          
          if (enabled) {
            refreshDocuments();
            refreshCategories();
          }
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
      setUploadedFiles(prev => prev.filter(upload => 
        upload.status === 'uploading' || 
        (Date.now() - parseInt(upload.id.split('-')[0])) < 5 * 60 * 1000
      ));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<DocumentsContextType>(() => ({
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
  }), [
    documents, categories, uploadedFiles,
    documentsLoading, categoriesLoading,
    documentsError, categoriesError,
    uploadDocument, deleteDocument, updateDocumentStatus,
    signDocument, downloadDocument, refreshDocuments,
    refreshCategories, getDocumentsByCategory,
    getDocumentsByProperty, getDocumentsByOffer,
  ]);

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function useDocuments() {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within a DocumentsProvider");
  return ctx;
}
