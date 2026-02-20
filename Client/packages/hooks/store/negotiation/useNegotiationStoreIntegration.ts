import { useNegotiationStore } from "packages/store";

/**
 * Hook that integrates negotiation data with useNegotiationStore
 * This replaces the NegotiationProvider functionality
 *
 * Note: Negotiation doesn't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
 */
export function useNegotiationStoreIntegration() {
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
