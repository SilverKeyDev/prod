import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { getWindow } from "packages/utils/core/platform";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

/** Custom event dispatched when mode changes - feed listens to mute all videos */
export const SEARCH_VIEW_MODE_CHANGED_EVENT = "search-view-mode-changed";

export type SearchViewMode = "map" | "reels";

export type SearchViewState = {
  mode: SearchViewMode;
  toggleMode: () => void;
  setMode: (mode: SearchViewMode) => void;
  showAllHomesOnMap: boolean;
  setShowAllHomesOnMap: (show: boolean) => void;
};

const initialState = (): Pick<
  SearchViewState,
  "mode" | "showAllHomesOnMap"
> => ({
  mode: "map",
  showAllHomesOnMap: false,
});

const baseCreator: import("zustand").StateCreator<SearchViewState> = (set) => ({
  ...initialState(),

  setShowAllHomesOnMap: (showAllHomesOnMap) => set({ showAllHomesOnMap }),

  toggleMode: () =>
    set((s) => {
      const nextMode: SearchViewMode = s.mode === "map" ? "reels" : "map";
      const win = getWindow();
      if (win)
        win.dispatchEvent(new CustomEvent(SEARCH_VIEW_MODE_CHANGED_EVENT));
      return { ...s, mode: nextMode };
    }),

  setMode: (mode) =>
    set((s) => {
      const win = getWindow();
      if (win)
        win.dispatchEvent(new CustomEvent(SEARCH_VIEW_MODE_CHANGED_EVENT));
      return { ...s, mode };
    }),
});

const withPersist = persistSafe<SearchViewState>(baseCreator, {
  name: "sk_search_preference",
  version: 2,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: SearchViewState) => ({
    mode: state.mode,
    showAllHomesOnMap: state.showAllHomesOnMap,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as SearchViewState,
}) as unknown as import("zustand").StateCreator<SearchViewState>;

const withDev = withDevtools<SearchViewState>("searchView")(
  withPersist,
) as unknown as import("zustand").StateCreator<SearchViewState>;

export const useSearchViewStore = create<SearchViewState>()(withDev);
