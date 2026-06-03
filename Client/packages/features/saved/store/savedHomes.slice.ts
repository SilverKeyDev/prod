import { create } from "zustand";
import { createJSONStorage } from "zustand/middleware";

import { log } from "packages/logger";
import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import type { SavedHome, SearchResult } from "packages/types";
import { createPersistStorageProxy } from "packages/utils/storage/platformStorage";

export type SavedHomesState = {
  // Saved homes data
  savedHomes: SavedHome[];
  savedHomesLoading: boolean;
  savedHomesError: string | null;

  // Actions
  setSavedHomes: (homes: SavedHome[]) => void;
  setSavedHomesLoading: (loading: boolean) => void;
  setSavedHomesError: (error: string | null) => void;
  addSavedHome: (home: SavedHome) => void;
  removeSavedHome: (homeId: string) => void;

  // Async actions (will be implemented with hooks)
  refreshSavedHomes: () => Promise<void>;
  saveHome: (property: SearchResult) => Promise<{ success: boolean; error?: string }>;
  removeSavedHomeAsync: (propertyId: string) => Promise<{ success: boolean; error?: string }>;

  // Setters for integration hook to inject implementations (no getState)
  setRefreshSavedHomesImpl: (fn: SavedHomesState["refreshSavedHomes"]) => void;
  setSaveHomeImpl: (fn: SavedHomesState["saveHome"]) => void;
  setRemoveSavedHomeAsyncImpl: (fn: SavedHomesState["removeSavedHomeAsync"]) => void;

  reset: () => void; // Added by withResettable
};

const initialState = () => ({
  savedHomes: [],
  savedHomesLoading: false,
  savedHomesError: null,
});

const arraysShallowEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

const baseCreator: import("zustand").StateCreator<SavedHomesState> = (set) => ({
  ...initialState(),

  setSavedHomes: (homes) =>
    set((state) => (arraysShallowEqual(state.savedHomes, homes) ? state : { savedHomes: homes })),
  setSavedHomesLoading: (loading) =>
    set((state) => (state.savedHomesLoading === loading ? state : { savedHomesLoading: loading })),
  setSavedHomesError: (error) =>
    set((state) => (state.savedHomesError === error ? state : { savedHomesError: error })),

  addSavedHome: (home) =>
    set((state) => ({
      savedHomes: [...state.savedHomes, home],
    })),
  removeSavedHome: (homeId) =>
    set((state) => ({
      savedHomes: state.savedHomes.filter((home) => home.home_id !== homeId),
    })),

  // Async actions will be implemented by hooks that use this store
  refreshSavedHomes: () => {
    log.warn("HOOKS", "refreshSavedHomes should be implemented by useSavedHomesData hook");
    return Promise.resolve();
  },
  saveHome: () => {
    log.warn("HOOKS", "saveHome should be implemented by useSavedHomesData hook");
    return Promise.resolve({ success: false, error: "Not implemented" });
  },
  removeSavedHomeAsync: () => {
    log.warn("HOOKS", "removeSavedHomeAsync should be implemented by useSavedHomesData hook");
    return Promise.resolve({ success: false, error: "Not implemented" });
  },

  setRefreshSavedHomesImpl: (fn) => set({ refreshSavedHomes: fn }),
  setSaveHomeImpl: (fn) => set({ saveHome: fn }),
  setRemoveSavedHomeAsyncImpl: (fn) => set({ removeSavedHomeAsync: fn }),

  // placeholder; will be replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<SavedHomesState>(baseCreator, (set) => ({
  ...initialState(),
  setSavedHomes: (homes) =>
    set((state) => (arraysShallowEqual(state.savedHomes, homes) ? state : { savedHomes: homes })),
  setSavedHomesLoading: (loading) =>
    set((state) => (state.savedHomesLoading === loading ? state : { savedHomesLoading: loading })),
  setSavedHomesError: (error) =>
    set((state) => (state.savedHomesError === error ? state : { savedHomesError: error })),
  addSavedHome: (home) => set((state) => ({ savedHomes: [...state.savedHomes, home] })),
  removeSavedHome: (homeId) =>
    set((state) => ({
      savedHomes: state.savedHomes.filter((home) => home.home_id !== homeId),
    })),
  refreshSavedHomes: async () => Promise.resolve(),
  saveHome: async () => ({ success: false, error: "Not implemented" }),
  removeSavedHomeAsync: async () => ({
    success: false,
    error: "Not implemented",
  }),
  setRefreshSavedHomesImpl: (fn) => set({ refreshSavedHomes: fn }),
  setSaveHomeImpl: (fn) => set({ saveHome: fn }),
  setRemoveSavedHomeAsyncImpl: (fn) => set({ removeSavedHomeAsync: fn }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<SavedHomesState>;

const withPersist = persistSafe<SavedHomesState>(withReset, {
  name: "saved-homes-store",
  version: 1,
  storage: createJSONStorage(() => createPersistStorageProxy()),
  partialize: (state: SavedHomesState) => ({
    // Only persist saved homes data (not loading states)
    savedHomes: state.savedHomes,
  }),
}) as unknown as import("zustand").StateCreator<SavedHomesState>;

const withDev = withDevtools<SavedHomesState>("savedHomes")(
  withPersist
) as unknown as import("zustand").StateCreator<SavedHomesState>;

export const useSavedHomesStore = create<SavedHomesState>()(withDev);
