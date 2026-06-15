/**
 * Compare feature barrel. Export public API for other features/apps.
 */
export { CompareFloatingBar } from "./components";
export { default as CardCompareCheckbox } from "./components/CardCompareCheckbox";
export { default as CompareHomesModal } from "./components/CompareHomesModal";
export { useCompareSessionStoreIntegration } from "./hooks/store/useCompareSessionStoreIntegration";
export * from "./store";
export type { CompareHomesComparisonField, CompareHomesPropertyDetails } from "./types";
export { exportToCSV, generateCSVContent, getAllComparisonFields, shareCSV } from "./utils";
export { renderReportSectionIcon as renderSectionIcon } from "packages/ui/components/media/icons/renderReportSectionIcon";
