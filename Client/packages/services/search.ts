/**
 * Search service for transforming and managing search results.
 * Implementation lives in the search feature; this module re-exports for callers under packages/services.
 */
export {
  transformPropertySearchResult,
  transformSearchResponse,
} from "packages/features/search/utils/transform/searchTransform";
