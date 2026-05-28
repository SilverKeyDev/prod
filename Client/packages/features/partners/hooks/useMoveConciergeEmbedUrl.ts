import { useMemo } from "react";

import {
  buildMoveConciergeEmbedUrl,
  prefillFromUserPreferencesRecord,
} from "packages/features/partners/utils/moveConciergeEmbed";
import { useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useAuthStore } from "packages/store";

/**
 * Full Move Concierge embed URL (https://mc.partners/SilverKey + prefill query)
 * from the authenticated user and saved preferences.
 */
export function useMoveConciergeEmbedUrl(): string {
  const user = useAuthStore((s) => s.user);
  const { userPreferences } = useUserPreferences();

  const userName = user?.name ?? null;
  const userEmail = user?.email ?? null;
  const userPhone = user?.phone ?? null;

  return useMemo(() => {
    const fromPrefs = prefillFromUserPreferencesRecord(
      userPreferences as Record<string, unknown> | null | undefined,
      { authFullName: userName }
    );

    const email =
      typeof userEmail === "string" && userEmail.trim() !== "" ? userEmail.trim() : undefined;

    const phone =
      typeof userPhone === "string" && userPhone.trim() !== "" ? userPhone.trim() : undefined;

    return buildMoveConciergeEmbedUrl({
      ...fromPrefs,
      email,
      phone,
    });
  }, [userName, userEmail, userPhone, userPreferences]);
}
