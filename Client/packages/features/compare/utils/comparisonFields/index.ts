import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/features/compare/utils/types";

import { addAnalysisFields } from "./analysisFields";
import { addCommuteFields } from "./commuteFields";
import { getCoreFields } from "./coreFields";
import { addFeatureFields } from "./featureFields";

export type { CompareHomesComparisonField } from "packages/features/compare/utils/types";

export function getAllComparisonFields(
  comparisonData: CompareHomesPropertyDetails[],
  loadingStates?: Record<string, boolean>,
  orderedSections?: Array<{ key: string; label: string }>
): CompareHomesComparisonField[] {
  const fields: CompareHomesComparisonField[] = [...getCoreFields()];

  addFeatureFields(fields, comparisonData);
  addCommuteFields(fields, comparisonData);
  addAnalysisFields(fields, comparisonData, loadingStates, orderedSections);

  return fields;
}
