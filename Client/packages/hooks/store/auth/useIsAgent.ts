import { useAuthStore } from "../../../store/auth.slice";

/**
 * Canonical agent-identity flag for UX gating.
 *
 * - Source of truth: `useAuthStore().user?.is_agent` (backend field)
 * - Do NOT derive agent-ness from URL/path, client IDs, or feature usage.
 * - Prefer checking `authReady` separately where flicker matters.
 */
export function useIsAgent(): boolean {
  return useAuthStore((s) => s.user?.is_agent ?? false);
}
