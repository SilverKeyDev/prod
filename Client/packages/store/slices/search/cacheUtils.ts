/**
 * Placeholder cache utils for search results
 */

import type { SearchResult } from "packages/schemas/search";

export const cacheUtils = {
  getCachedSearchResults: (
    _preferencesVersion: string,
  ): SearchResult[] | null => null,
  cacheSearchResults: (
    _results: SearchResult[],
    _preferencesVersion: string,
  ) => {},
  clearSearchCache: () => {},
};
