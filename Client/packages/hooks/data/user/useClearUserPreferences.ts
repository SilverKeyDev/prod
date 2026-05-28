import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { preferencesApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { useLocalization } from "packages/contexts";
import type { OnboardingData } from "packages/features/profile/utils";
import { userPreferencesToOnboardingData } from "packages/features/profile/utils";
import { useSearchContextStore } from "packages/features/search/store/searchContext.slice";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { useAgentDashboardStore, useAuthStore } from "packages/store";

export type UseClearUserPreferencesOptions = {
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  onAfterClear?: () => void | Promise<void>;
};

export type UseClearUserPreferencesReturn = {
  clearPreferences: () => Promise<void>;
  isClearing: boolean;
  buildEmptyFormSnapshot: () => Partial<OnboardingData>;
};

export function useClearUserPreferences(
  options: UseClearUserPreferencesOptions = {}
): UseClearUserPreferencesReturn {
  const { t } = useLocalization();
  const queryClient = useQueryClient();
  const { userProfile } = useUserData();
  const resetSearchFilterOverrides = useSearchContextStore((s) => s.resetSearchFilterOverrides);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);

  const buildEmptyFormSnapshot = useCallback(
    () => userPreferencesToOnboardingData(null, userProfile ?? undefined),
    [userProfile]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await preferencesApi.clear();
      if (!response.success) {
        throw new Error((response as { error?: string }).error ?? "Failed to clear preferences");
      }
      return response;
    },
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.user.preferences(null), null);

      const prev = useAuthStore.getState().user;
      if (prev) {
        useAuthStore.getState().setUser({
          ...prev,
          has_preferences: false,
          preferences_version: undefined,
        });
      }

      resetSearchFilterOverrides();

      const hadClientSelected = options.selectedClientId != null && options.selectedClientId !== "";
      if (hadClientSelected) {
        setSelectedClientId(null);
        options.onClientChange?.(null);
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.user.preferences() });

      showSuccessToast(t("search.clear_preferences_success"));

      await options.onAfterClear?.();
    },
    onError: () => {
      showErrorToast(t("search.clear_preferences_error"));
    },
  });

  const clearPreferences = useCallback(async () => {
    await mutation.mutateAsync();
  }, [mutation]);

  return {
    clearPreferences,
    isClearing: mutation.isPending,
    buildEmptyFormSnapshot,
  };
}
