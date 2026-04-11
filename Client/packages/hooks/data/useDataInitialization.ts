import { usePrefetch } from "./usePrefetch";
import { useRoutePolling } from "./useRoutePolling";

/**
 * Hook that initializes data loading and background polling on login
 * Should be called once at app level after authentication
 *
 * This is a thin orchestrator that coordinates:
 * - usePrefetch: Initial data loading when user authenticates
 * - useRoutePolling: Background polling for route updates
 */
export function useDataInitialization() {
  usePrefetch();
  useRoutePolling();
}
