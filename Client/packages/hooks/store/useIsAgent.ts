import { useAuthStore } from "packages/store";
import { userHasAgentRole } from "packages/utils/auth/auth/userHasAgentRole";

/**
 * Canonical agent-identity flag for UX gating.
 *
 * Source: `roles` on the auth store user (agent role in user_roles).
 * Do NOT derive agent-ness from URL/path, client IDs, or feature usage.
 * Prefer checking `authReady` separately where flicker matters.
 */
export function useIsAgent(): boolean {
  return useAuthStore((s) => userHasAgentRole(s.user));
}
