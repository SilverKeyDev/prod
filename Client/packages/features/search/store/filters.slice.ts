import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { buildFiltersSliceActions, buildLiveIsHomeSaved } from "./filters.slice.actions";
import { filtersSliceInitialState } from "./filters.slice.initialState";
import { migrateFiltersStorePersisted } from "./filters.slice.migrate";
import type { FiltersState } from "./filters.slice.types";

export type {
  ActiveTab,
  FiltersState,
  MapRegionSnapshot,
  SearchSource,
  WebMapCameraSnapshot,
} from "./filters.slice.types";

const baseCreator: import("zustand").StateCreator<FiltersState> = (set, get) => ({
  ...filtersSliceInitialState(),
  ...buildFiltersSliceActions(set, get, buildLiveIsHomeSaved(get)),
});

const withReset = withResettable<FiltersState>(baseCreator, (set, get, _store) => ({
  ...filtersSliceInitialState(),
  ...buildFiltersSliceActions(set, get, () => false),
})) as unknown as import("zustand").StateCreator<FiltersState>;

const withPersist = persistSafe<FiltersState>(withReset, {
  name: "filters-store",
  version: 6,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: FiltersState) => ({
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    searchStage: state.searchStage,
    hasSearched: state.hasSearched,
    searchSource: state.searchSource,
    showCommuteOverlay: state.showCommuteOverlay,
    webMapCamera: state.webMapCamera,
    mapHomeCardsCount: state.mapHomeCardsCount,
    resultsOrderBy: state.resultsOrderBy,
    resultsSortDirection: state.resultsSortDirection,
    preferencesStrictFilter: state.preferencesStrictFilter,
  }),
  migrate: migrateFiltersStorePersisted,
}) as unknown as import("zustand").StateCreator<FiltersState>;

const withDev = withDevtools<FiltersState>("filters")(
  withPersist
) as unknown as import("zustand").StateCreator<FiltersState>;

export const useFiltersStore = create<FiltersState>()(withDev);

export function toQueryParams(
  state: Pick<FiltersState, "searchStage" | "favoriteAddresses" | "currentPage">
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length ? state.favoriteAddresses : undefined,
    page: state.currentPage,
  } as const;
}
