/**
 * Shared Google Maps API types used across features.
 * Re-exported from the search feature to avoid cross-feature internal imports.
 */

export type {
  AutocompleteRequest,
  AutocompleteSuggestion,
  DocumentWithBody,
  GoogleMapsWindow,
  LocationMarker,
} from "packages/features/search/types/google-maps";
