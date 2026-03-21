/**
 * Compare feature barrel. Export public API for other features/apps.
 */
export { CompareFloatingBar } from "./components";
export { default as CardCompareCheckbox } from "./components/CardCompareCheckbox";
export { default as CompareHomesModal } from "./components/CompareHomesModal";
export {
  exportToCSV,
  generateCSVContent,
  getAllComparisonFields,
  shareCSV,
} from "./utils";
export type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "./utils/types";
export { renderReportSectionIcon as renderSectionIcon } from "packages/ui/components/icons/renderReportSectionIcon";
