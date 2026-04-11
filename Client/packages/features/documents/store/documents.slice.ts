import { create } from "zustand";

import type {
  DocumentCategory,
  WorkflowDocument,
} from "packages/features/documents/types/documents";
import { log, LOG_CATEGORIES } from "packages/logger";

type DocumentsData = {
  // Documents data
  documents: WorkflowDocument[];
  documentCategories: DocumentCategory[];
  uploadedFiles: unknown[];
  documentsLoading: boolean;
  categoriesLoading: boolean;
  documentsError: string | null;
  categoriesError: string | null;
};

export type DocumentsState = DocumentsData & {
  // Actions
  setDocuments: (documents: WorkflowDocument[]) => void;
  setDocumentCategories: (categories: DocumentCategory[]) => void;
  setUploadedFiles: (files: unknown[]) => void;
  setDocumentsLoading: (loading: boolean) => void;
  setCategoriesLoading: (loading: boolean) => void;
  setDocumentsError: (error: string | null) => void;
  setCategoriesError: (error: string | null) => void;

  // Async actions (will be implemented with hooks)
  uploadDocument: (
    file: File,
    category: string,
    propertyId?: string,
    offerId?: string,
  ) => Promise<WorkflowDocument>;
  deleteDocument: (docId: string) => Promise<void>;
  updateDocumentStatus: (
    docId: string,
    status: WorkflowDocument["status"],
  ) => Promise<void>;
  signDocument: (docId: string) => Promise<void>;
  downloadDocument: (docId: string) => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshCategories: () => Promise<void>;

  // Helper functions
  getDocumentsByCategory: (category: string) => WorkflowDocument[];
  getDocumentsByProperty: (propertyId: string) => WorkflowDocument[];
  getDocumentsByOffer: (offerId: string) => WorkflowDocument[];

  // Setters for integration hook to inject implementations (no getState)
  setUploadDocumentImpl: (fn: DocumentsState["uploadDocument"]) => void;
  setDeleteDocumentImpl: (fn: DocumentsState["deleteDocument"]) => void;
  setUpdateDocumentStatusImpl: (
    fn: DocumentsState["updateDocumentStatus"],
  ) => void;
  setSignDocumentImpl: (fn: DocumentsState["signDocument"]) => void;
  setDownloadDocumentImpl: (fn: DocumentsState["downloadDocument"]) => void;
  setRefreshDocumentsImpl: (fn: DocumentsState["refreshDocuments"]) => void;
  setRefreshCategoriesImpl: (fn: DocumentsState["refreshCategories"]) => void;

  reset: () => void; // Added by withResettable
};

const initialState = (): Omit<
  DocumentsState,
  | "setDocuments"
  | "setDocumentCategories"
  | "setUploadedFiles"
  | "setDocumentsLoading"
  | "setCategoriesLoading"
  | "setDocumentsError"
  | "setCategoriesError"
  | "uploadDocument"
  | "deleteDocument"
  | "updateDocumentStatus"
  | "signDocument"
  | "downloadDocument"
  | "refreshDocuments"
  | "refreshCategories"
  | "getDocumentsByCategory"
  | "getDocumentsByProperty"
  | "getDocumentsByOffer"
  | "reset"
> => ({
  documents: [],
  documentCategories: [],
  uploadedFiles: [],
  documentsLoading: false,
  categoriesLoading: false,
  documentsError: null,
  categoriesError: null,
});

const arraysShallowEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  ...initialState(),

  // Actions
  setDocuments: (documents: WorkflowDocument[]) =>
    set((state) =>
      arraysShallowEqual(state.documents, documents) ? state : { documents },
    ),
  setDocumentCategories: (categories: DocumentCategory[]) =>
    set((state) =>
      arraysShallowEqual(state.documentCategories, categories)
        ? state
        : { documentCategories: categories },
    ),
  setUploadedFiles: (files: unknown[]) =>
    set((state) =>
      arraysShallowEqual(state.uploadedFiles, files)
        ? state
        : { uploadedFiles: files },
    ),
  setDocumentsLoading: (loading: boolean) =>
    set((state) =>
      state.documentsLoading === loading
        ? state
        : { documentsLoading: loading },
    ),
  setCategoriesLoading: (loading: boolean) =>
    set((state) =>
      state.categoriesLoading === loading
        ? state
        : { categoriesLoading: loading },
    ),
  setDocumentsError: (error: string | null) =>
    set((state) =>
      state.documentsError === error ? state : { documentsError: error },
    ),
  setCategoriesError: (error: string | null) =>
    set((state) =>
      state.categoriesError === error ? state : { categoriesError: error },
    ),

  // Helper functions
  getDocumentsByCategory: (category: string) => {
    const state = get();
    return state.documents.filter(
      (doc: WorkflowDocument) => doc.category === category,
    );
  },
  getDocumentsByProperty: (propertyId: string) => {
    const state = get();
    return state.documents.filter(
      (doc: WorkflowDocument) => doc.property_id === propertyId,
    );
  },
  getDocumentsByOffer: (offerId: string) => {
    const state = get();
    return state.documents.filter(
      (doc: WorkflowDocument) => doc.offer_id === offerId,
    );
  },

  // Async actions will be implemented by hooks that use this store
  uploadDocument: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "uploadDocument should be implemented by useDocuments hook",
    );
    throw new Error("Not implemented");
  },
  deleteDocument: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "deleteDocument should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },
  updateDocumentStatus: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "updateDocumentStatus should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },
  signDocument: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "signDocument should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },
  downloadDocument: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "downloadDocument should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },
  refreshDocuments: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "refreshDocuments should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },
  refreshCategories: () => {
    // This will be implemented by useDocuments hook
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "refreshCategories should be implemented by useDocuments hook",
    );
    return Promise.resolve();
  },

  setUploadDocumentImpl: (fn) =>
    set((state) =>
      state.uploadDocument === fn ? state : { uploadDocument: fn },
    ),
  setDeleteDocumentImpl: (fn) =>
    set((state) =>
      state.deleteDocument === fn ? state : { deleteDocument: fn },
    ),
  setUpdateDocumentStatusImpl: (fn) =>
    set((state) =>
      state.updateDocumentStatus === fn ? state : { updateDocumentStatus: fn },
    ),
  setSignDocumentImpl: (fn) =>
    set((state) => (state.signDocument === fn ? state : { signDocument: fn })),
  setDownloadDocumentImpl: (fn) =>
    set((state) =>
      state.downloadDocument === fn ? state : { downloadDocument: fn },
    ),
  setRefreshDocumentsImpl: (fn) =>
    set((state) =>
      state.refreshDocuments === fn ? state : { refreshDocuments: fn },
    ),
  setRefreshCategoriesImpl: (fn) =>
    set((state) =>
      state.refreshCategories === fn ? state : { refreshCategories: fn },
    ),

  // Reset function
  reset: () => set(initialState()),
}));
