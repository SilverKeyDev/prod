import { useAuthStore } from "packages/store";
import { deriveDevAppPersonaFromProfile } from "packages/utils/growth/admin/deriveDevAppPersonaFromProfile";

/**
 * When the account is not an agent (`roles` lacks `"agent"`), exposes buyer vs seller intent from
 * `user_roles` when unambiguous; otherwise defaults to buyer-shaped client shell.
 */
export function useAppDevClientPersona(): "buyer" | "seller" | null {
  const user = useAuthStore((s) => s.user);
  const p = deriveDevAppPersonaFromProfile(user ?? undefined);
  if (p === "buyer" || p === "seller") {
    return p;
  }
  return null;
}
