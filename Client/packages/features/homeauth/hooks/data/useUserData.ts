import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";
import type { UserPreferences, UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/media/prefetchRemoteImage";

import { preferencesApi } from "@/features/homeauth/api/preferences";
import { userApi } from "@/features/homeauth/api/user";

export type UseUserDataReturn = {
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  refreshUserProfile: () => Promise<void>;
};

export function useUserData(): UseUserDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: userProfile,
    isLoading: userProfileLoading,
    error: userProfileError,
    refetch: refetchUserProfile,
  } = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const response = await userApi.getProfile();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch user profile");
      }

      const userData = response.user ?? response.data;
      if (!userData) {
        throw new Error("No user data received");
      }

      // Convert User to UserProfile by adding missing properties
      const profile: UserProfile = {
        ...userData,
        has_subscription: userData.has_subscription ?? false,
        subscription: userData.subscription ?? null,
        has_preferences: userData.has_preferences ?? false,
        is_agent: userData.is_agent ?? false,
        is_closing_mode: userData.is_closing_mode ?? false,
        client_ids: Array.isArray(userData.client_ids)
          ? userData.client_ids.join(",")
          : userData.client_ids,
      };

      // #region agent log
      // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
      fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "244579",
        },
        body: JSON.stringify({
          sessionId: "244579",
          location: "homeauth/hooks/data/useUserData.ts:queryFn",
          message: "user profile cache row",
          data: {
            hasPictureKey: Boolean(profile.profile_picture),
            hasPictureUrl: Boolean(profile.profile_picture_url),
            pictureUrlLen: profile.profile_picture_url?.length ?? 0,
          },
          timestamp: Date.now(),
          hypothesisId: "B",
        }),
      }).catch(() => {});
      // #endregion

      prefetchRemoteImage(profile.profile_picture_url);

      return profile;
    },
    enabled: shouldLoadData,
    // Use placeholderData function to check cache reactively when enabled changes
    placeholderData: () => {
      return queryClient.getQueryData<UserProfile>(queryKeys.user.profile());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch if data exists (matches reports)
  });

  const refreshUserProfile = useCallback(async () => {
    await refetchUserProfile();
  }, [refetchUserProfile]);

  return {
    userProfile: userProfile ?? null,
    userProfileLoading,
    userProfileError: userProfileError?.message ?? null,
    refreshUserProfile,
  };
}

export type UseUserPreferencesReturn = {
  userPreferences: UserPreferences | null;
  preferencesLoading: boolean;
  preferencesError: string | null;
  refreshUserPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isUpdating: boolean;
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: userPreferences,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchUserPreferences,
  } = useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: async () => {
      const response = await preferencesApi.get();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch user preferences");
      }
      return response.preferences;
    },
    enabled: shouldLoadData,
    // Use placeholderData function to check cache reactively when enabled changes
    placeholderData: () => {
      return queryClient.getQueryData<UserPreferences>(queryKeys.user.preferences());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch if data exists (matches reports)
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await preferencesApi.createOrUpdate(preferences);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to update preferences");
      }
      return response.preferences;
    },
    onSuccess: (updatedPreferences) => {
      // Update cache optimistically
      queryClient.setQueryData(queryKeys.user.preferences(), updatedPreferences);
    },
  });

  const refreshUserPreferences = useCallback(async () => {
    await refetchUserPreferences();
  }, [refetchUserPreferences]);

  const updatePreferences = useCallback(
    async (preferences: Partial<UserPreferences>) => {
      await updatePreferencesMutation.mutateAsync(preferences);
    },
    [updatePreferencesMutation]
  );

  return {
    userPreferences: userPreferences ?? null,
    preferencesLoading,
    preferencesError: preferencesError?.message ?? null,
    refreshUserPreferences,
    updatePreferences,
    isUpdating: updatePreferencesMutation.isPending,
  };
}
