import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { userApi, preferencesApi } from "../../config/api";
import { queryKeys } from "../../config/query/keys";
import { useAuthStore } from "../../store/auth.slice";
import type { UserProfile, UserPreferences } from "../../schemas";

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
    [updatePreferencesMutation],
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
