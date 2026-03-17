import { useMessagingModals } from "./useMessagingModals";

/**
 * Alias for useMessagingModals("client"). Kept for backward compatibility.
 */
export function useClientMessagingModals() {
  return useMessagingModals("client");
}
