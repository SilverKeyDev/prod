/**
 * Types for the negotiation service
 */

export type NegotiationState = {
  selectedHome: unknown;
  strategyData: unknown;
  compsData: unknown;
  isLoading: boolean;
  error: string | null;
};

export type NegotiationServiceCallbacks = {
  onStateChange?: (state: NegotiationState) => void;
  onError?: (error: string) => void;
  onSuccess?: (data: { strategy: unknown; comps: unknown }) => void;
};

/** Injected by useNegotiationStoreIntegration so the service can update the store without getState(). */
export type NegotiationStoreBridge = {
  setSelectedHome: (home: unknown) => void;
  setStrategyData: (data: unknown) => void;
  setCompsData: (data: unknown) => void;
  setStrategyTextContent: (content: string) => void;
  setCompsTextContent: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearData: () => void;
  getIsAuthenticated: () => boolean;
};

export const NEGOTIATION_STORAGE_KEYS = {
  selectedHome: "negotiationSelectedHome",
  strategy: "negotiationStrategy",
  comps: "negotiationComps",
} as const;
