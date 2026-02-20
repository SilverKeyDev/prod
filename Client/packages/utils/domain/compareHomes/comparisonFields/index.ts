import type {
  CompareHomesComparisonField,
  CompareHomesPropertyDetails,
} from "packages/utils/domain/compareHomes/types";

import { addAnalysisFields } from "./analysisFields";
import { addCommuteFields } from "./commuteFields";
import { getCoreFields } from "./coreFields";
import { addFeatureFields } from "./featureFields";

export type { CompareHomesComparisonField } from "packages/utils/domain/compareHomes/types";

export function getAllComparisonFields(
  comparisonData: CompareHomesPropertyDetails[],
  loadingStates?: Record<string, boolean>,
  orderedSections?: Array<{ key: string; label: string }>,
): CompareHomesComparisonField[] {
  const fields: CompareHomesComparisonField[] = [...getCoreFields()];

  addFeatureFields(fields, comparisonData);
  addCommuteFields(fields, comparisonData);
  addAnalysisFields(fields, comparisonData, loadingStates, orderedSections);

  return fields;
}
