import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

export type SearchContextAnchor = {
  listingId?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
};

/** Non-persisted filter overrides sent with search request (e.g. max beds/baths from range sliders) */
export type SearchFilterOverrides = {
  preferred_bedrooms_max?: number;
  preferred_bathrooms_max?: number;
};

export type SearchContextState = {
  anchor: SearchContextAnchor;
  filtersHash: string;
  feedCursor?: string;
  /** Overrides merged into user_preferences for this request only (not persisted) */
  searchFilterOverrides: SearchFilterOverrides;

  setAnchor: (anchor: Partial<SearchContextAnchor>) => void;
  setFiltersHash: (hash: string) => void;
  setFeedCursor: (cursor: string | undefined) => void;
  setSearchFilterOverrides: (
    overrides:
      | Partial<SearchFilterOverrides>
      | ((prev: SearchFilterOverrides) => Partial<SearchFilterOverrides>)
  ) => void;
  clearAnchor: () => void;
};

const initialAnchor: SearchContextAnchor = {};

const baseCreator: import("zustand").StateCreator<SearchContextState> = (set) => ({
  anchor: initialAnchor,
  filtersHash: "",
  feedCursor: undefined,
  searchFilterOverrides: {},

  setAnchor: (anchor) =>
    set((s) => ({
      anchor: { ...s.anchor, ...anchor },
    })),

  setFiltersHash: (filtersHash) => set({ filtersHash }),

  setFeedCursor: (feedCursor) => set({ feedCursor }),

  setSearchFilterOverrides: (overrides) =>
    set((s) => ({
      searchFilterOverrides:
        typeof overrides === "function"
          ? {
              ...s.searchFilterOverrides,
              ...overrides(s.searchFilterOverrides),
            }
          : { ...s.searchFilterOverrides, ...overrides },
    })),

  clearAnchor: () => set({ anchor: initialAnchor }),
});

export const useSearchContextStore = create<SearchContextState>()(
  withDevtools<SearchContextState>("searchContext")(baseCreator)
);
