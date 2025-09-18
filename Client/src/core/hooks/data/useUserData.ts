import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { userApi, preferencesApi } from '../../config/api';
import { queryKeys } from '../../config/query/keys';
import { useAuth } from '../../contexts';
import type { UserProfile, UserPreferences } from '../../schemas';

export type UseUserDataReturn = {
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  refreshUserProfile: () => Promise<void>;
};

export function useUserData(): UseUserDataReturn {
  const { isAuthenticated, authReady } = useAuth();
  
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
        throw new Error(response.error ?? 'Failed to fetch user profile');
      }

      const userData = response.user ?? response.data;
      if (!userData) {
        throw new Error('No user data received');
      }

      // Convert User to UserProfile by adding missing properties
      const profile: UserProfile = {
        ...userData,
        has_subscription: userData.has_subscription ?? false,
        subscription: userData.subscription ?? null,
        has_preferences: userData.has_preferences ?? false,
        is_agent: userData.is_agent ?? false,
        client_ids: Array.isArray(userData.client_ids)
          ? userData.client_ids.join(',')
          : userData.client_ids,
      };

      return profile;
    },
    enabled: authReady && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const { isAuthenticated, authReady } = useAuth();
  
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
        throw new Error(response.error ?? 'Failed to fetch user preferences');
      }
      return response.preferences;
    },
    enabled: authReady && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshUserPreferences = useCallback(async () => {
    await refetchUserPreferences();
  }, [refetchUserPreferences]);

  return {
    userPreferences: userPreferences ?? null,
    preferencesLoading,
    preferencesError: preferencesError?.message ?? null,
    refreshUserPreferences,
  };
}
