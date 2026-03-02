import { useEffect, useRef } from "react";

import { useAuthStore, useNegotiationStore } from "packages/store";

import { negotiationService } from "@/features/negotiate/utils";

/**
 * Hook that integrates negotiation data with useNegotiationStore
 * This replaces the NegotiationProvider functionality
 *
 * Note: Negotiation doesn't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state.
 * Also injects a store bridge into NegotiationService so it can update
 * the store without using getState().
 */
export function useNegotiationStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthRef = useRef(isAuthenticated);
  isAuthRef.current = isAuthenticated;

  const {
    selectedHome,
    strategyData,
    compsData,
    strategyTextContent,
    compsTextContent,
    isLoading,
    error,
    setSelectedHome,
    setStrategyData,
    setCompsData,
    setStrategyTextContent,
    setCompsTextContent,
    setLoading,
    setError,
    clearData,
  } = useNegotiationStore();

  useEffect(() => {
    negotiationService.setStoreBridge({
      setSelectedHome,
      setStrategyData,
      setCompsData,
      setStrategyTextContent,
      setCompsTextContent,
      setLoading,
      setError,
      clearData,
      getIsAuthenticated: () => isAuthRef.current,
    });
  }, [
    setSelectedHome,
    setStrategyData,
    setCompsData,
    setStrategyTextContent,
    setCompsTextContent,
    setLoading,
    setError,
    clearData,
  ]);

  // Expose the store state and actions
  return {
    // State
    selectedHome,
    strategyData,
    compsData,
    strategyTextContent,
    compsTextContent,
    isLoading,
    error,

    // Actions
    setSelectedHome,
    setStrategyData,
    setCompsData,
    setStrategyTextContent,
    setCompsTextContent,
    setLoading,
    setError,
    clearData,
  };
}
