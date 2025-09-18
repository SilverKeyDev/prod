import { useSessionStore } from '../../store/session.slice';

/**
 * Hook that integrates session data with useSessionStore
 * This replaces the SessionProvider functionality
 * 
 * Note: Session doesn't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
 */
export function useSessionStoreIntegration() {
  const {
    authReady,
    isAuthenticated,
    userMeta,
    featureGates,
    setAuthReady,
    setIsAuthenticated,
    setUserMeta,
    setFeatureGates,
    softReset,
  } = useSessionStore();

  // Expose the store state and actions
  return {
    // State
    authReady,
    isAuthenticated,
    userMeta,
    featureGates,

    // Actions
    setAuthReady,
    setIsAuthenticated,
    setUserMeta,
    setFeatureGates,
    softReset,
  };
}
