import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

export type ActiveTab = "results" | "saved";

export type FiltersState = {
  // Search UI filters and selection controls
  activeTab: ActiveTab;
  currentPage: number;
  favoriteAddresses: string[];
  searchStage: string;
  isSearching: boolean;
  hasSearched: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  setSearchStage: (stage: string) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;

  // Utils
  isHomeSaved: (propertyId: string) => boolean;

  reset: () => void;
};

const initialState = (): Omit<
  FiltersState,
  | "setActiveTab"
  | "setCurrentPage"
  | "setFavoriteAddresses"
  | "setSearchStage"
  | "setIsSearching"
  | "setHasSearched"
  | "isHomeSaved"
  | "reset"
> => ({
  activeTab: "results",
  currentPage: 0,
  favoriteAddresses: [],
  searchStage: "",
  isSearching: false,
  hasSearched: false,
});

const baseCreator: import("zustand").StateCreator<FiltersState> = (
  set,
  get,
) => ({
  ...initialState(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setFavoriteAddresses: (addresses) =>
    set({ favoriteAddresses: [...addresses] }),
  setSearchStage: (stage) => set({ searchStage: stage }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  isHomeSaved: (propertyId: string) => {
    const state = get();
    return state.favoriteAddresses.includes(propertyId);
  },
  // placeholder; will be overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<FiltersState>(
  baseCreator,
  (set, _get, _store) => ({
    ...initialState(),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setFavoriteAddresses: (addresses) =>
      set({ favoriteAddresses: [...addresses] }),
    setSearchStage: (stage) => set({ searchStage: stage }),
    setIsSearching: (searching) => set({ isSearching: searching }),
    setHasSearched: (searched) => set({ hasSearched: searched }),
    isHomeSaved: () => false,
    reset: () => {},
  }),
) as unknown as import("zustand").StateCreator<FiltersState>;

const withPersist = persistSafe<FiltersState>(withReset, {
  name: "filters-store",
  version: 1,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  // Persist only benign UI filters; no PII
  partialize: (state: FiltersState) => ({
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    searchStage: state.searchStage,
    hasSearched: state.hasSearched,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as FiltersState,
}) as unknown as import("zustand").StateCreator<FiltersState>;

const withDev = withDevtools<FiltersState>("filters")(
  withPersist,
) as unknown as import("zustand").StateCreator<FiltersState>;

export const useFiltersStore = create<FiltersState>()(withDev);

// Helper to map filters → query key params (pure function)
export function toQueryParams(
  state: Pick<
    FiltersState,
    "searchStage" | "favoriteAddresses" | "currentPage"
  >,
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length
      ? state.favoriteAddresses
      : undefined,
    page: state.currentPage,
  } as const;
}
