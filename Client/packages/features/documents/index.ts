/**
 * Documents feature barrel. Export public API for apps without importing internals.
 */

// Document library hooks
export { useDocumentActions } from "./hooks/data/useDocumentActions";
export { useDocuments } from "./hooks/data/useDocuments";
export type { DocumentData } from "./hooks/data/useDocumentsData";
export { useDocumentsData } from "./hooks/data/useDocumentsData";
export { useSavedPageDocumentHandlers } from "./hooks/data/useSavedPageDocumentHandlers";

// Document store integration hooks
export type { SendForSignatureParams } from "./hooks/store/useDocumentsDataIntegration";
export { useDocumentsDataIntegration } from "./hooks/store/useDocumentsDataIntegration";
export { useDocumentsStoreIntegration } from "./hooks/store/useDocumentsStoreIntegration";
export { useHomeComparison } from "./hooks/store/useHomeComparison";
export { useReportsStoreIntegration } from "./hooks/store/useReportsStoreIntegration";
export type { SavedPageViewType } from "./hooks/store/useSavedPageView";
export { useSavedPageView } from "./hooks/store/useSavedPageView";

// Document types
export type {
  DocumentLibraryKind,
  DocumentLibraryListItem,
} from "./types/documentLibrary";
export type {
  DocumentCategory,
  UploadedFile,
  WorkflowDocument,
  WorkflowDocumentRecord,
} from "./types/documents";

// DocuSign API
export { docusignApi } from "./api/docusign";

// Forms API and types
export { checklistFormsApi } from "./api/checklistForms";
export type { UseChecklistFormsResult } from "./hooks/data/useChecklistForms";
export { useChecklistForms } from "./hooks/data/useChecklistForms";
export type {
  FormCategory,
  UseFormsLibraryResult,
} from "./hooks/data/useFormsLibrary";
export { useFormsLibrary } from "./hooks/data/useFormsLibrary";
export type {
  ChecklistForm,
  DownloadFormResponse,
  GetFormsResponse,
  SendFormRequest,
  SendFormResponse,
} from "./types/forms";

// DocuSign hooks (data)
export type { UseDocusignActionsReturn } from "./hooks/data/useDocusignActions";
export { useDocusignActions } from "./hooks/data/useDocusignActions";
export { useDocusignAgreement } from "./hooks/data/useDocusignAgreement";
export type { UseDocusignAgreementsReturn } from "./hooks/data/useDocusignAgreements";
export { useDocusignAgreements } from "./hooks/data/useDocusignAgreements";
export type { UseDocusignTemplatesReturn } from "./hooks/data/useDocusignTemplates";
export { useDocusignTemplates } from "./hooks/data/useDocusignTemplates";

// DocuSign hooks (UI)
export { useSavedHomesDocuSign } from "./hooks/ui/useSavedHomesDocuSign";
export type { UseSavedHomesDocuSignCoreOptions } from "./hooks/ui/useSavedHomesDocuSignCore";
export { useSavedHomesDocuSignCore } from "./hooks/ui/useSavedHomesDocuSignCore";

// DocuSign components
export { default as DocuSignWidget } from "./components/DocuSignWidget";
export { default as EmbeddedSigning } from "./components/EmbeddedSigning";
export { default as ViewSignedDocument } from "./components/ViewSignedDocument";

// Forms components
export { default as FormsBrowser } from "./components/FormsBrowser";
export { default as FormsLibraryTab } from "./components/FormsLibraryTab";

// DocuSign types
export type {
  Agreement,
  AgreementEvent,
  AgreementParticipant,
  AgreementRevision,
  AgreementStatus,
  AgreementType,
  CreateAgreementRequest,
  CreateAgreementResponse,
  DocusignTemplate,
  GetAgreementResponse,
  GetSenderViewUrlResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  ListAgreementsResponse,
  ListTemplatesResponse,
  ParticipantRole,
  ParticipantStatus,
  SendAgreementRequest,
  SendAgreementResponse,
  SigningMethod,
  SyncTemplatesResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
} from "./types/docusign";

// DocuSign utilities
export {
  calculateSigningProgress,
  canUserCreateRevision,
  canUserSend,
  canUserSign,
  canUserVoid,
  daysSinceSent,
  formatAgreementDate,
  formatAgreementDateTime,
  formatParticipantRole,
  getAgreementTypeLabel,
  getParticipantStatusColor,
  getStatusColor,
  getStatusLabel,
  getStatusTooltip,
  getUrgencyColor,
  getUrgencyLevel,
} from "./utils/docusignHelpers";
