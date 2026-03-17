/**
 * Checklists (close) feature barrel. Use this instead of feature internals.
 */
export {
  type ChecklistType,
  getTaskChecklist,
  getTransactionAddress,
  saveTransactionAddress,
  type TaskChecklistApiResponse,
  type TaskChecklistItem,
  type TaskChecklistResponse,
  type TransactionAddressData,
  updateTaskChecklist,
} from "./api/checklists";
export { default as AddDocumentToStepModal } from "./components/AddDocumentToStepModal";
export { default as AddFromSkySlopeModal } from "./components/AddFromSkySlopeModal";
export { default as ChecklistIntegrationSlot } from "./components/ChecklistIntegrationSlot";
export { default as ChecklistItemDocuments } from "./components/ChecklistItemDocuments";
export { default as ChecklistLayout } from "./components/ChecklistLayout";
export { default as CloseLayout } from "./components/CloseLayout";
export { default as ChooseAreasSection } from "./components/integrations/ChooseAreasSection"; // eslint-disable-line import/no-unresolved -- Platform-specific: .web.tsx | .native.tsx
export { default as FindingHome } from "./components/integrations/FindingHome";
export { default as HomeConcierge } from "./components/integrations/HomeConcierge";
export { default as ReviewComparablesSection } from "./components/integrations/ReviewComparablesSection";
export { default as ClosingMovingIn } from "./components/subheaders/ClosingMovingIn";
export { default as EscrowLegalLogistics } from "./components/subheaders/EscrowLegalLogistics";
export { default as FinancingInsurance } from "./components/subheaders/FinancingInsurance";
export { default as InspectionsDueDiligence } from "./components/subheaders/InspectionsDueDiligence";
export { default as OfferSection } from "./components/subheaders/OfferSection";
export { default as SearchSection } from "./components/subheaders/SearchSection";
export { useChecklistData, type UseChecklistDataReturn } from "./hooks/data/useChecklistData";
export {
  useChecklistProgress,
  type UseChecklistProgressReturn,
} from "./hooks/useChecklistProgress";
export {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistComponentKey,
  type ChecklistIntegrationComponentProps,
  type ChecklistTab,
} from "./types/checklists";
export { CHECKLISTS_TRANSLATIONS } from "./types/translations";
export { SECTION_CONFIG, SECTION_ORDER } from "./utils/sectionConfig";
