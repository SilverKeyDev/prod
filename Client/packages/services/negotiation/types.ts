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

export const NEGOTIATION_STORAGE_KEYS = {
  selectedHome: "negotiationSelectedHome",
  strategy: "negotiationStrategy",
  comps: "negotiationComps",
} as const;
