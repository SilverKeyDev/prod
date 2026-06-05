import {
  clampMapHomeCardsCount,
  DEFAULT_RESULTS_ORDER_BY,
  defaultSortDirectionForOrderBy,
  isResultsOrderBy,
  isResultsSortDirection,
} from "packages/features/search/types/domain/searchDisplay";

import { filtersSliceInitialState } from "./filters.slice.initialState";
import type { FiltersState } from "./filters.slice.types";

export function migrateFiltersStorePersisted(persisted: unknown, oldVersion: number): FiltersState {
  const base = filtersSliceInitialState();
  if (!persisted || typeof persisted !== "object") {
    return { ...base } as FiltersState;
  }
  const p = persisted as Partial<FiltersState>;
  const rawCam = p.webMapCamera;
  const cameraValid =
    oldVersion >= 3 &&
    rawCam &&
    typeof rawCam.lat === "number" &&
    typeof rawCam.lng === "number" &&
    typeof rawCam.zoom === "number";
  const webMapCamera = cameraValid ? rawCam : null;
  const mapHomeCardsCount =
    oldVersion >= 4 && typeof p.mapHomeCardsCount === "number"
      ? clampMapHomeCardsCount(p.mapHomeCardsCount)
      : 1;
  const resultsOrderBy =
    oldVersion >= 4 && typeof p.resultsOrderBy === "string" && isResultsOrderBy(p.resultsOrderBy)
      ? p.resultsOrderBy
      : DEFAULT_RESULTS_ORDER_BY;
  const hasValidSortDirection =
    typeof p.resultsSortDirection === "string" && isResultsSortDirection(p.resultsSortDirection);
  const resultsSortDirection = hasValidSortDirection
    ? p.resultsSortDirection
    : defaultSortDirectionForOrderBy(resultsOrderBy);
  const preferencesStrictFilter =
    oldVersion >= 5 && typeof p.preferencesStrictFilter === "boolean"
      ? p.preferencesStrictFilter
      : false;
  return {
    ...base,
    ...p,
    lastMapRegion: null,
    webMapCamera,
    mapHomeCardsCount,
    resultsOrderBy,
    resultsSortDirection,
    preferencesStrictFilter,
    userGeolocation: null,
    searchSource: p.searchSource === "location" ? "location" : "preferences",
    showCommuteOverlay:
      typeof p.showCommuteOverlay === "boolean"
        ? p.showCommuteOverlay
        : p.searchSource === "location"
          ? false
          : true,
  } as FiltersState;
}
