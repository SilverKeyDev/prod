export type {
  NegotiationServiceCallbacks,
  NegotiationState,
  NegotiationStoreBridge,
} from "../types/negotiation";

export const NEGOTIATION_STORAGE_KEYS = {
  selectedHome: "negotiationSelectedHome",
  strategy: "negotiationStrategy",
  comps: "negotiationComps",
} as const;
