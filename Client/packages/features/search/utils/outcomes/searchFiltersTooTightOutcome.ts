import { requestOpenSearchPreferencesPanel } from "packages/features/search/store";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import type { SearchByPolygonResponse } from "packages/types/domain/api";

export type PolygonSearchResponseMeta = {
  cached?: boolean;
  cacheAge?: string;
  filtersTooTight?: boolean;
  preFilterCount?: number;
  postFilterCount?: number;
};

type SearchByPolygonResponseWithMeta = SearchByPolygonResponse & {
  meta?: PolygonSearchResponseMeta;
};

export function getPolygonSearchMeta(
  searchResult: SearchByPolygonResponse
): PolygonSearchResponseMeta | undefined {
  return (searchResult as SearchByPolygonResponseWithMeta).meta;
}

/** True when upstream search found listings but preference post-filters removed all of them. */
export function isPolygonSearchFiltersTooTight(searchResult: SearchByPolygonResponse): boolean {
  if ((searchResult.properties?.length ?? 0) > 0) {
    return false;
  }
  return getPolygonSearchMeta(searchResult)?.filtersTooTight === true;
}

function filtersTooTightMessage(): string {
  const msg = SEARCH_TRANSLATIONS["search.filters_too_tight"];
  return typeof msg === "string" ? msg : "Your filters are too tight.";
}

/** Warning toast + open the Preferences panel (desktop popover or mobile sheet). */
export function warnSearchFiltersTooTight(): void {
  showWarningToast(filtersTooTightMessage());
  requestOpenSearchPreferencesPanel();
}

/**
 * When filters eliminated every candidate in the search area, nudge the user to relax preferences.
 * Returns true when the tight-filters outcome was handled (toast + panel open requested).
 */
export function handlePolygonSearchFiltersTooTightOutcome(
  searchResult: SearchByPolygonResponse
): boolean {
  if (!isPolygonSearchFiltersTooTight(searchResult)) {
    return false;
  }
  warnSearchFiltersTooTight();
  return true;
}
