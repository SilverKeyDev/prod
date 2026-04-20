import { warnSearchEmptyResults } from "packages/features/search/utils/outcomes/searchOutcomeToast";
import { transformPropertySearchResult } from "packages/features/search/utils/transform/searchTransform";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { PropertySearchResult, SearchByPolygonResponse } from "packages/types/domain/api";

import type { MapPreviewSearchLifecycleHooks, SearchResult } from "./propertySearchTypes";

export async function handlePolygonSearchResponse(
  searchResult: SearchByPolygonResponse,
  center: { lat: number; lng: number },
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  preferencesStrictFilter: boolean,
  mapPreview?: MapPreviewSearchLifecycleHooks
): Promise<void> {
  if (!searchResult.success) {
    throw new Error(searchResult.error ?? "Search failed");
  }

  const apiPropertyCount = searchResult.properties?.length ?? 0;
  log.info(LOG_CATEGORIES.SEARCH, "Polygon search: raw API homes before client transform", {
    propertiesCount: apiPropertyCount,
    totalCount: searchResult.total_count,
    meta: searchResult.meta,
  });

  if (searchResult.meta?.cached !== undefined) {
    if (searchResult.meta.cached) {
      log.info(LOG_CATEGORIES.SEARCH, "Cache HIT - Using cached results", {
        cacheAge: searchResult.meta.cacheAge ?? "unknown",
      });
    } else {
      log.info(LOG_CATEGORIES.SEARCH, "Cache MISS - Performing new search");
    }
  }

  if (!searchResult.meta?.cached) {
    setSearchStage("Evaluating scores...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setSearchStage("Scoring homes based on your preferences...");
  } else {
    setSearchStage("Loading cached results...");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (searchResult.properties && searchResult.properties.length > 0) {
    const firstProp = searchResult.properties[0];
    if (firstProp) {
      const fp = firstProp as PropertySearchResult | Record<string, unknown>;
      const keys = Object.keys(fp);
      const scoreVal =
        "score" in fp && fp.score != null
          ? fp.score
          : "_score" in fp
            ? (fp as { _score?: number })._score
            : undefined;
      log.debug(LOG_CATEGORIES.SEARCH, "First Property Raw Data", {
        keys,
        score: scoreVal,
        scoreType: typeof scoreVal,
        hasScore: scoreVal !== undefined && scoreVal !== null,
      });
    }
  }

  const transformedResults: SearchResult[] = (searchResult.properties ?? []).map(
    (property, index) => {
      const p = property as PropertySearchResult | Record<string, unknown>;
      const rawScore =
        "score" in p && p.score != null
          ? p.score
          : "_score" in p
            ? (p as { _score?: number })._score
            : undefined;
      if (rawScore === 0 || rawScore === undefined || rawScore === null) {
        const listingId =
          "id" in p && typeof (p as PropertySearchResult).id === "string"
            ? (p as PropertySearchResult).id
            : (p as { zpid?: string }).zpid;
        const addr =
          "location" in p && (p as PropertySearchResult).location != null
            ? (p as PropertySearchResult).location.address
            : (p as { address?: string }).address;
        log.warn(LOG_CATEGORIES.SEARCH, "Property missing score", {
          listingId,
          address: addr,
          rawScore,
          scoreType: typeof rawScore,
        });
      }
      return transformPropertySearchResult(property as PropertySearchResult, index, center);
    }
  );

  setSearchStage("Extracting property images...");
  await new Promise((resolve) => setTimeout(resolve, 800));
  setSearchStage("Finalizing results...");

  setSearchResults(transformedResults);
  setHasSearched(true);
  setIsSearching(false);
  setCurrentPage(0);
  setShowPropertyModals(true);
  mapPreview?.onResultsCommittedEnablePreviews?.();

  if (transformedResults.length === 0) {
    warnSearchEmptyResults({ preferencesStrictFilter });
  }

  log.info(LOG_CATEGORIES.SEARCH, "Successfully found properties (after home matching transform)", {
    rawApiCount: apiPropertyCount,
    transformedCount: transformedResults.length,
    sampleIds: transformedResults.slice(0, 5).map((r) => r.id),
  });
}
