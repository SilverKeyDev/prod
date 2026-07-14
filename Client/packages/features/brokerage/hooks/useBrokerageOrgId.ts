/**
 * Resolve the active brokerage org id from the authenticated user profile.
 */
import { useAuthStore } from "packages/store";

export function useBrokerageOrgId(): string | null {
  return useAuthStore((s) => {
    const ids = s.user?.brokerage_org_ids;
    if (!ids || ids.length === 0) return null;
    const first = ids.find((id) => typeof id === "string" && id.trim().length > 0);
    return first ?? null;
  });
}
