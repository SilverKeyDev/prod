import { create } from "zustand";

import { googleMapsService } from "../services/googleMaps";
import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: typeof google | undefined;
  }
}

export type GoogleMapsState = {
  // Loading state
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  scriptUrl: string | null;

  // Actions
  setLoaded: (loaded: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setScriptUrl: (url: string | null) => void;

  // Service integration
  loadGoogleMaps: () => Promise<void>;
  createMap: (container: HTMLElement) => google.maps.Map | null;
  getServiceState: () => {
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
    scriptUrl: string | null;
  };

  // Reset
  reset: () => void;
};

const initialState = (): Omit<
  GoogleMapsState,
  | "setLoaded"
  | "setLoading"
  | "setError"
  | "setScriptUrl"
  | "loadGoogleMaps"
  | "createMap"
  | "getServiceState"
  | "reset"
> => ({
  isLoaded: false,
  isLoading: false,
  error: null,
  scriptUrl: null,
});

const baseCreator: import("zustand").StateCreator<GoogleMapsState> = (
  set,
  get,
) => ({
  ...initialState(),

  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setScriptUrl: (url) => set({ scriptUrl: url }),

  loadGoogleMaps: async () => {
    const state = get();
    if (state.isLoaded || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await googleMapsService.loadGoogleMapsScript();
      const serviceState = googleMapsService.getState();
      set({
        isLoaded: serviceState.isLoaded,
        isLoading: serviceState.isLoading,
        error: serviceState.error,
        scriptUrl: serviceState.scriptUrl,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load Google Maps";
      set({ error: errorMessage, isLoading: false });
    }
  },

  createMap: (container: HTMLElement) => {
    const map = googleMapsService.createMap(container);
    return map;
  },

  getServiceState: () => {
    return googleMapsService.getState();
  },

  // placeholder; overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<GoogleMapsState>(baseCreator, (set, get) => ({
  ...initialState(),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setScriptUrl: (url) => set({ scriptUrl: url }),

  loadGoogleMaps: async () => {
    const state = get();
    if (state.isLoaded || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await googleMapsService.loadGoogleMapsScript();
      const serviceState = googleMapsService.getState();
      set({
        isLoaded: serviceState.isLoaded,
        isLoading: serviceState.isLoading,
        error: serviceState.error,
        scriptUrl: serviceState.scriptUrl,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load Google Maps";
      set({ error: errorMessage, isLoading: false });
    }
  },

  createMap: (container: HTMLElement) => {
    return googleMapsService.createMap(container);
  },

  getServiceState: () => {
    return googleMapsService.getState();
  },

  reset: () => {},
})) as unknown as import("zustand").StateCreator<GoogleMapsState>;

const withPersist = persistSafe<GoogleMapsState>(withReset, {
  name: "google-maps-store",
  version: 1,
  storage: localStorage,
  partialize: (state: GoogleMapsState) => ({
    // Persist script URL for faster subsequent loads
    scriptUrl: state.scriptUrl,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as GoogleMapsState,
}) as unknown as import("zustand").StateCreator<GoogleMapsState>;

const withDev = withDevtools<GoogleMapsState>("google-maps")(
  withPersist,
) as unknown as import("zustand").StateCreator<GoogleMapsState>;

export const useGoogleMapsStore = create<GoogleMapsState>()(withDev);
