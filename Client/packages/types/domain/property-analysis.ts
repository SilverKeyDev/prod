/**
 * Shared property analysis types used across features.
 * Re-exported from the search feature to avoid cross-feature internal imports.
 */

export type { PropertyHighlightsContext } from "./propertyHighlightsContext";
export type {
  PropertyAnalysis,
  PropertyWithAnalysis,
} from "packages/features/search/types/domain/property";
