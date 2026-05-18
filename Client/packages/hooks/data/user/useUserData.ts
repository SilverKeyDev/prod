import { useCallback, useEffect, useMemo, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { preferencesApi, userApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import type { UserPreferences, UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/media/prefetchRemoteImage";

export type UserProfileQueryMeta = {
  status: string;
  fetchStatus: string;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  failureCount: number;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};

export type UseUserDataReturn = {
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  refreshUserProfile: () => Promise<void>;
  /** TanStack Query snapshot for diagnosing admin gate / profile stalls. */
  userProfileQueryMeta: UserProfileQueryMeta;
};

export function useUserData(): UseUserDataReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: userProfile,
    isLoading: userProfileLoading,
    status: userProfileQueryStatus,
    fetchStatus: userProfileFetchStatus,
    isPending: userProfileIsPending,
    isFetching: userProfileIsFetching,
    isError: userProfileIsError,
    failureCount: userProfileFailureCount,
    dataUpdatedAt: userProfileDataUpdatedAt,
    errorUpdatedAt: userProfileErrorUpdatedAt,
    error: userProfileError,
    refetch: refetchUserProfile,
  } = useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async ({ signal }) => {
      const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      const t0 =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : 0;
      log.info(LOG_CATEGORIES.AUTH, "[USER_PROFILE_QUERY] queryFn started", {
        runId,
        signalAborted: signal.aborted,
        queryKey: queryKeys.user.profile(),
      });
      try {
        const response = await userApi.getProfile();
        const elapsedMs =
          typeof performance !== "undefined" && typeof performance.now === "function"
            ? Math.round(performance.now() - t0)
            : undefined;
        if (!response.success) {
          log.error(
            LOG_CATEGORIES.ERRORS,
            "[USER_PROFILE_QUERY] getProfile responded success=false",
            {
              runId,
              elapsedMs,
              error: response.error,
            }
          );
          throw new Error(response.error ?? "Failed to fetch user profile");
        }

        const userData = response.user ?? response.data;
        if (!userData) {
          log.error(
            LOG_CATEGORIES.ERRORS,
            "[USER_PROFILE_QUERY] getProfile returned no user payload",
            {
              runId,
              elapsedMs,
            }
          );
          throw new Error("No user data received");
        }

        const raw = userData as Record<string, unknown>;
        const closing = typeof raw.is_closing_mode === "boolean" ? raw.is_closing_mode : false;

        // Convert User to UserProfile by adding missing properties
        const profile: UserProfile = {
          ...userData,
          has_subscription: userData.has_subscription ?? false,
          subscription: userData.subscription ?? null,
          has_preferences: userData.has_preferences ?? false,
          is_agent: userData.is_agent ?? false,
          is_closing_mode: closing,
          client_ids: Array.isArray(userData.client_ids)
            ? userData.client_ids.join(",")
            : userData.client_ids,
          roles: userData.roles ?? [], // Include roles from backend (user_roles table)
          brokerage_org_ids: userData.brokerage_org_ids ?? null,
        };

        prefetchRemoteImage(profile.profile_picture_url);

        log.info(LOG_CATEGORIES.AUTH, "[USER_PROFILE_QUERY] queryFn completed", {
          runId,
          elapsedMs,
          roleCount: profile.roles?.length ?? 0,
          userId: profile.id,
        });

        return profile;
      } catch (err: unknown) {
        const elapsedMs =
          typeof performance !== "undefined" && typeof performance.now === "function"
            ? Math.round(performance.now() - t0)
            : undefined;
        log.error(LOG_CATEGORIES.ERRORS, "[USER_PROFILE_QUERY] queryFn threw", {
          runId,
          elapsedMs,
          signalAborted: signal.aborted,
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    enabled: shouldLoadData,
    placeholderData: () => {
      return queryClient.getQueryData<UserProfile>(queryKeys.user.profile());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch if data exists (matches reports)
  });

  const profileTraceSigRef = useRef<string | null>(null);
  useEffect(() => {
    const sig = [
      String(shouldLoadData),
      String(authReady),
      String(isAuthenticated),
      userProfile?.id ?? "",
      userProfileQueryStatus,
      userProfileFetchStatus,
      String(userProfileIsPending),
      String(userProfileIsFetching),
      String(userProfileLoading),
      String(userProfile != null),
      String(userProfileIsError),
      String(userProfileFailureCount),
      String(userProfileDataUpdatedAt),
      String(userProfileErrorUpdatedAt),
      userProfileError?.message ?? "",
    ].join("|");
    if (profileTraceSigRef.current === sig) return;
    profileTraceSigRef.current = sig;

    log.info(LOG_CATEGORIES.AUTH, "[USER_PROFILE_QUERY] state transition", {
      shouldLoadData,
      authReady,
      isAuthenticated,
      userId: userProfile?.id ?? null,
      status: userProfileQueryStatus,
      fetchStatus: userProfileFetchStatus,
      isPending: userProfileIsPending,
      isFetching: userProfileIsFetching,
      isLoading: userProfileLoading,
      hasData: userProfile != null,
      isError: userProfileIsError,
      failureCount: userProfileFailureCount,
      dataUpdatedAt: userProfileDataUpdatedAt,
      errorUpdatedAt: userProfileErrorUpdatedAt,
      errorMessage: userProfileError?.message ?? null,
    });
  }, [
    authReady,
    isAuthenticated,
    shouldLoadData,
    userProfile,
    userProfileDataUpdatedAt,
    userProfileError,
    userProfileErrorUpdatedAt,
    userProfileFailureCount,
    userProfileFetchStatus,
    userProfileIsError,
    userProfileIsPending,
    userProfileIsFetching,
    userProfileLoading,
    userProfileQueryStatus,
  ]);

  const refreshUserProfile = useCallback(async () => {
    await refetchUserProfile();
  }, [refetchUserProfile]);

  return {
    userProfile: userProfile ?? null,
    userProfileLoading,
    userProfileError: userProfileError?.message ?? null,
    refreshUserProfile,
    userProfileQueryMeta: {
      status: userProfileQueryStatus,
      fetchStatus: userProfileFetchStatus,
      isPending: userProfileIsPending,
      isFetching: userProfileIsFetching,
      isError: userProfileIsError,
      failureCount: userProfileFailureCount,
      dataUpdatedAt: userProfileDataUpdatedAt,
      errorUpdatedAt: userProfileErrorUpdatedAt,
    },
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

export type UseUserPreferencesOptions = {
  /**
   * Load preferences for this user (agent must have them as a client). When null/undefined,
   * loads the authenticated user's preferences.
   */
  preferencesSubjectUserId?: string | null;
};

export function useUserPreferences(options?: UseUserPreferencesOptions): UseUserPreferencesReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const subjectId = options?.preferencesSubjectUserId ?? null;

  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: userPreferences,
    isLoading: preferencesLoading,
    error: preferencesError,
    refetch: refetchUserPreferences,
  } = useQuery({
    queryKey: queryKeys.user.preferences(subjectId),
    queryFn: async () => {
      const response =
        subjectId != null && subjectId !== ""
          ? await preferencesApi.getByUserId(subjectId)
          : await preferencesApi.get();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch user preferences");
      }
      return response.preferences ?? null;
    },
    enabled: shouldLoadData,
    placeholderData: () => {
      return queryClient.getQueryData<UserPreferences | null>(
        queryKeys.user.preferences(subjectId)
      );
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
      if (updatedPreferences == null) return;
      queryClient.setQueryData(queryKeys.user.preferences(subjectId), updatedPreferences);
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

/** Submit preferences (create/update). Use this from components instead of importing preferencesApi. */
export function usePreferencesSubmit(): (
  preferences: Parameters<typeof preferencesApi.createOrUpdate>[0]
) => ReturnType<typeof preferencesApi.createOrUpdate> {
  return useCallback((preferences) => preferencesApi.createOrUpdate(preferences), []);
}
