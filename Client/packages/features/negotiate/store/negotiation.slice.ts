import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

export type SavedHome = {
  user_id: string;
  address: string;
  beds: string | number;
  baths: string | number;
  sqft: string | number;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export type NegotiationState = {
  // Selected home from dropdown
  selectedHome: SavedHome | null;

  // Strategy and comps data
  strategyData: unknown;
  compsData: unknown;

  // Textual content from responses
  strategyTextContent: string;
  compsTextContent: string;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedHome: (home: SavedHome | null) => void;
  setStrategyData: (data: unknown) => void;
  setCompsData: (data: unknown) => void;
  setStrategyTextContent: (content: string) => void;
  setCompsTextContent: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
  reset: () => void;
};

const initialState = (): Omit<
  NegotiationState,
  | "setSelectedHome"
  | "setStrategyData"
  | "setCompsData"
  | "setStrategyTextContent"
  | "setCompsTextContent"
  | "setLoading"
  | "setError"
  | "clearData"
  | "reset"
> => ({
  selectedHome: null,
  strategyData: null,
  compsData: null,
  strategyTextContent: "",
  compsTextContent: "",
  isLoading: false,
  error: null,
});

const baseCreator: import("zustand").StateCreator<NegotiationState> = (set) => ({
  ...initialState(),

  setSelectedHome: (home) => set({ selectedHome: home }),
  setStrategyData: (data) => set({ strategyData: data }),
  setCompsData: (data) => set({ compsData: data }),
  setStrategyTextContent: (content) => set({ strategyTextContent: content }),
  setCompsTextContent: (content) => set({ compsTextContent: content }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearData: () =>
    set({
      selectedHome: null,
      strategyData: null,
      compsData: null,
      strategyTextContent: "",
      compsTextContent: "",
      error: null,
    }),

  // placeholder; overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<NegotiationState>(baseCreator, (set) => ({
  ...initialState(),
  setSelectedHome: (home) => set({ selectedHome: home }),
  setStrategyData: (data) => set({ strategyData: data }),
  setCompsData: (data) => set({ compsData: data }),
  setStrategyTextContent: (content) => set({ strategyTextContent: content }),
  setCompsTextContent: (content) => set({ compsTextContent: content }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearData: () =>
    set({
      selectedHome: null,
      strategyData: null,
      compsData: null,
      strategyTextContent: "",
      compsTextContent: "",
      error: null,
    }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<NegotiationState>;

const withPersist = persistSafe<NegotiationState>(withReset, {
  name: "negotiation-store",
  version: 1,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: NegotiationState) => ({
    // Persist negotiation data across sessions
    selectedHome: state.selectedHome,
    strategyData: state.strategyData,
    compsData: state.compsData,
    strategyTextContent: state.strategyTextContent,
    compsTextContent: state.compsTextContent,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as NegotiationState,
}) as unknown as import("zustand").StateCreator<NegotiationState>;

const withDev = withDevtools<NegotiationState>("negotiation")(
  withPersist
) as unknown as import("zustand").StateCreator<NegotiationState>;

export const useNegotiationStore = create<NegotiationState>()(withDev);
