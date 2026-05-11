/**
 * Placeholder cache utils for search results
 */

import type { SearchResult } from "@/features/search/types/domain/result";

export const cacheUtils = {
  getCachedSearchResults: (_preferencesVersion: string): SearchResult[] | null => null,
  cacheSearchResults: (_results: SearchResult[], _preferencesVersion: string) => {},
  clearSearchCache: () => {},
};
