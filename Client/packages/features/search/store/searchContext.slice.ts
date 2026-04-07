import { create } from "zustand";

import type { IsochroneData } from "packages/features/search/types/isochrone";
import { withDevtools } from "packages/store/middleware/devtools";
import type { ViewportPolygonPoint } from "packages/types/api";

export type SearchContextAnchor = {
  listingId?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
};

/** Non-persisted filter overrides sent with search request (e.g. range sliders before DB save) */
export type SearchFilterOverrides = {
  preferred_bedrooms_min?: number;
  preferred_bedrooms_max?: number;
  preferred_bathrooms_min?: number;
  preferred_bathrooms_max?: number;
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
  /** Merged into polygon search `user_preferences` for this request (session-only until saved). */
  must_have?: string[];
  preferred_home_features?: string[];
};

export type SearchContextState = {
  anchor: SearchContextAnchor;
  filtersHash: string;
  feedCursor?: string;
  /** Overrides merged into user_preferences for this request only (not persisted) */
  searchFilterOverrides: SearchFilterOverrides;
  /**
   * Last Google Places viewport ring (location bar). Used for polygon search instead of padded map bounds.
   */
  locationPlaceViewportRing: ViewportPolygonPoint[] | null;
  /** Formatted address label for the selected place (overlay center). */
  locationPlaceLabel: string | null;
  /** Synthetic IsochroneData for map/native overlay (place bounds or last viewport search). */
  locationSearchOverlayData: IsochroneData | null;

  setAnchor: (anchor: Partial<SearchContextAnchor>) => void;
  setFiltersHash: (hash: string) => void;
  setFeedCursor: (cursor: string | undefined) => void;
  setSearchFilterOverrides: (
    overrides:
      | Partial<SearchFilterOverrides>
      | ((prev: SearchFilterOverrides) => Partial<SearchFilterOverrides>)
  ) => void;
  clearAnchor: () => void;
  setLocationPlaceViewportFromBar: (payload: {
    ring: ViewportPolygonPoint[];
    label: string;
    overlay: IsochroneData;
  }) => void;
  setLocationSearchOverlayData: (overlay: IsochroneData | null) => void;
  clearLocationPlaceSearchArea: () => void;
};

const initialAnchor: SearchContextAnchor = {};

const baseCreator: import("zustand").StateCreator<SearchContextState> = (set) => ({
  anchor: initialAnchor,
  filtersHash: "",
  feedCursor: undefined,
  searchFilterOverrides: {},
  locationPlaceViewportRing: null,
  locationPlaceLabel: null,
  locationSearchOverlayData: null,

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

  setLocationPlaceViewportFromBar: ({ ring, label, overlay }) =>
    set({
      locationPlaceViewportRing: ring,
      locationPlaceLabel: label,
      locationSearchOverlayData: overlay,
    }),

  setLocationSearchOverlayData: (overlay) => set({ locationSearchOverlayData: overlay }),

  clearLocationPlaceSearchArea: () =>
    set({
      locationPlaceViewportRing: null,
      locationPlaceLabel: null,
      locationSearchOverlayData: null,
    }),
});

export const useSearchContextStore = create<SearchContextState>()(
  withDevtools<SearchContextState>("searchContext")(baseCreator)
);
