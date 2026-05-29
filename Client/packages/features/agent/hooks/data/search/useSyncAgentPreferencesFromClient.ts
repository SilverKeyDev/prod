import { useCallback, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

import { preferencesApi } from "@/features/homeauth/api/preferences";
import {
  formDataToPreferencesPayload,
  type OnboardingData,
  userPreferencesToOnboardingData,
} from "@/features/profile/utils";

export type SyncFromClientOptions = {
  /** Called right after client preferences are loaded (before POST). Use to update UI immediately. */
  onFetched?: (onboarding: OnboardingData) => void;
};

export type UseSyncAgentPreferencesFromClientReturn = {
  syncFromClient: (
    clientId: string,
    clientDisplayName?: string,
    options?: SyncFromClientOptions
  ) => Promise<void>;
  isSyncing: boolean;
};

/**
 * Copies another user's (client's) preferences onto the current user's account via GET-by-user + POST `/preferences`.
 * Does not modify the client's stored preferences—agents cannot update a client's profile this way.
 */
export function useSyncAgentPreferencesFromClient(): UseSyncAgentPreferencesFromClientReturn {
  const { t } = useLocalization();
  const { userProfile } = useUserData();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncFromClient = useCallback(
    async (clientId: string, clientDisplayName?: string, options?: SyncFromClientOptions) => {
      setIsSyncing(true);
      try {
        const response = await preferencesApi.getByUserId(clientId);
        if (response.success === false) {
          throw new Error(
            resolveApiResultErrorMessage(response, "Failed to load client preferences")
          );
        }
        const rawPrefs = response.preferences;
        const onboarding = userPreferencesToOnboardingData(
          rawPrefs != null && typeof rawPrefs === "object" && !Array.isArray(rawPrefs)
            ? (rawPrefs as Record<string, unknown>)
            : null,
          userProfile ?? undefined
        ) as OnboardingData;
        options?.onFetched?.(onboarding);
        const payload = formDataToPreferencesPayload(onboarding);
        const saveResponse = await preferencesApi.createOrUpdate(payload);
        if (saveResponse.success === false) {
          throw new Error(
            typeof saveResponse.error === "string"
              ? saveResponse.error
              : "Failed to save preferences"
          );
        }
        await queryClient.invalidateQueries({ queryKey: [...queryKeys.user.all, "preferences"] });
        const name =
          clientDisplayName?.trim() || t("search.agent_sync_preferences_client_fallback");
        showSuccessToast(t("search.agent_sync_preferences_success", { name }));
      } catch (error: unknown) {
        log.error(LOG_CATEGORIES.ERRORS, "syncAgentPreferencesFromClient failed", error);
        showErrorToast(t("search.agent_sync_preferences_error"));
      } finally {
        setIsSyncing(false);
      }
    },
    [queryClient, t, userProfile]
  );

  return { syncFromClient, isSyncing };
}
