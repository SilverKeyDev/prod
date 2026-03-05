/**
 * Documents feature barrel. Export public API for apps without importing internals.
 */
export { default as AgreementCard } from "./components/AgreementCard";
export { default as AgreementListItem } from "./components/AgreementListItem";
export { AgreementDetailModal, CreateAgreementModal } from "./components/modals";
export { useDocumentActions } from "./hooks/data/useDocumentActions";
export { useDocuments } from "./hooks/data/useDocuments";
export type { DocumentData } from "./hooks/data/useDocumentsData";
export { useDocumentsData } from "./hooks/data/useDocumentsData";
export { useSavedPageDocumentHandlers } from "./hooks/data/useSavedPageDocumentHandlers";
export { useDocumentsDataIntegration } from "./hooks/store/useDocumentsDataIntegration";
export { useDocumentsStoreIntegration } from "./hooks/store/useDocumentsStoreIntegration";
export { useHomeComparison } from "./hooks/store/useHomeComparison";
export { useReportsStoreIntegration } from "./hooks/store/useReportsStoreIntegration";
export type { SavedPageViewType } from "./hooks/store/useSavedPageView";
export { useSavedPageView } from "./hooks/store/useSavedPageView";
