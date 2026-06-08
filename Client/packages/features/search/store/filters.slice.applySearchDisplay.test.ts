import { describe, expect, it } from "vitest";
import { create } from "zustand";

import type { SearchDisplayPayload } from "packages/features/search/types/domain/searchDisplay";

import { buildFiltersSliceActions, buildLiveIsHomeSaved } from "./filters.slice.actions";
import { filtersSliceInitialState } from "./filters.slice.initialState";
import type { FiltersState } from "./filters.slice.types";

function createTestFiltersStore() {
  return create<FiltersState>((set, get) => ({
    ...filtersSliceInitialState(),
    ...buildFiltersSliceActions(set, get, buildLiveIsHomeSaved(get)),
  }));
}

describe("applySearchDisplayFromApi", () => {
  it("hydrates commute overlay, order by, strict filter, and map cards from API payload", () => {
    const store = createTestFiltersStore();
    const payload: SearchDisplayPayload = {
      show_commute_overlay: false,
      map_home_cards_count: 3,
      results_order_by: "price",
      preferences_strict_filter: true,
    };

    store.getState().applySearchDisplayFromApi(payload);

    const state = store.getState();
    expect(state.showCommuteOverlay).toBe(false);
    expect(state.mapHomeCardsCount).toBe(3);
    expect(state.resultsOrderBy).toBe("price");
    expect(state.preferencesStrictFilter).toBe(true);
  });

  it("restores last search context map camera and search source when present", () => {
    const store = createTestFiltersStore();
    const payload: SearchDisplayPayload = {
      show_commute_overlay: true,
      map_home_cards_count: 1,
      results_order_by: "match_score",
      last_search_context: {
        search_source: "location",
        map_center: { lat: 40.1, lng: -74.2 },
        map_zoom: 12,
      },
    };

    store.getState().applySearchDisplayFromApi(payload);

    const state = store.getState();
    expect(state.searchSource).toBe("location");
    expect(state.webMapCamera).toEqual({ lat: 40.1, lng: -74.2, zoom: 12 });
  });
});
