import { create } from "zustand";

import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

export type ActiveTab = "results" | "saved";

export type FiltersState = {
  // Search UI filters and selection controls
  activeTab: ActiveTab;
  currentPage: number;
  favoriteAddresses: string[];
  searchStage: string;
  isSearching: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  setSearchStage: (stage: string) => void;
  setIsSearching: (searching: boolean) => void;

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
  | "isHomeSaved"
  | "reset"
> => ({
  activeTab: "results",
  currentPage: 0,
  favoriteAddresses: [],
  searchStage: "",
  isSearching: false,
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
    isHomeSaved: () => false,
    reset: () => {},
  }),
) as unknown as import("zustand").StateCreator<FiltersState>;

const withPersist = persistSafe<FiltersState>(withReset, {
  name: "filters-store",
  version: 1,
  storage: localStorage,
  // Persist only benign UI filters; no PII
  partialize: (state: FiltersState) => ({
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    searchStage: state.searchStage,
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
