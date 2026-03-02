/**
 * Compare feature barrel. Export public API for other features/apps.
 */
export { CompareFloatingBar } from "./components";
export { default as CompareHomesModal } from "./components/CompareHomesModal";
export { renderSectionIcon } from "./components/CompareHomesModal/sectionIcons";
export { exportToCSV, generateCSVContent, getAllComparisonFields, shareCSV } from "./utils";
export type { CompareHomesComparisonField, CompareHomesPropertyDetails } from "./utils/types";
