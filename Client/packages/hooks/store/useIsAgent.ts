import { useAuthStore } from "packages/store";

/**
 * Canonical agent-identity flag for UX gating.
 *
 * Source: `useAuthStore().user?.is_agent` (persisted `users.is_agent`, including admin dev persona API).
 * Do NOT derive agent-ness from URL/path, client IDs, or feature usage.
 * Prefer checking `authReady` separately where flicker matters.
 */
export function useIsAgent(): boolean {
  return useAuthStore((s) => s.user?.is_agent ?? false);
}
