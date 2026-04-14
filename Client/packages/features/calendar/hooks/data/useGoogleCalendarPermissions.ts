import { useMemo } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type { GoogleCalendarPermissionsResponse } from "packages/features/calendar/api";
import { useAuthStore } from "packages/store";

/**
 * Required permissions for the calendar feature to work properly
 */
const REQUIRED_PERMISSIONS = [
  "calendar_calendarlist_readonly", // Needed to list calendars
  "calendar_freebusy", // Needed to see availability (calendar.events.freebusy is not requested on new connects)
] as const;

export type UseGoogleCalendarPermissionsReturn = {
  permissions: GoogleCalendarPermissionsResponse | null | undefined;
  permissionsLoading: boolean;
  permissionsError: string | null;
  hasRequiredPermissions: boolean;
  isPartiallyEnabled: boolean;
  missingPermissions: string[];
};

export function useGoogleCalendarPermissions(): UseGoogleCalendarPermissionsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const shouldLoadData = useMemo(() => {
    return authReady && isAuthenticated;
  }, [authReady, isAuthenticated]);

  // Only read from cache - never fetch (fetching is done in dataConfig.ts)
  // We enable the query so it subscribes to cache updates reactively
  const {
    data: permissionsData,
    error: permissionsError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: queryKeys.googleCalendar.permissions(),
    queryFn: async () => {
      // Only return cached data - never make an API call
      // Data is prefetched in dataConfig.ts
      const cached = queryClient.getQueryData<GoogleCalendarPermissionsResponse | null>(
        queryKeys.googleCalendar.permissions()
      );
      // Return cached data (even if null - null means not connected)
      // If undefined, prefetch hasn't completed yet - return null as placeholder
      return cached ?? null;
    },
    enabled: shouldLoadData, // Enable to subscribe to cache updates
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch - data is prefetched
    refetchOnWindowFocus: false, // Don't refetch on window focus
    // Use placeholderData to show cached data immediately if available
    placeholderData: (previousValue) => {
      const cached = queryClient.getQueryData<GoogleCalendarPermissionsResponse | null>(
        queryKeys.googleCalendar.permissions()
      );
      return cached ?? previousValue ?? null;
    },
    // Prevent actual network requests - only use cache
    gcTime: Infinity, // Keep in cache forever
    retry: false, // Don't retry since we're only reading from cache
  });

  // Check if cache exists (even if null) - this indicates prefetch has completed
  const cacheExists = useMemo(() => {
    if (!shouldLoadData) return false;
    const cached = queryClient.getQueryData<GoogleCalendarPermissionsResponse | null>(
      queryKeys.googleCalendar.permissions()
    );
    // Cache exists if it's not undefined (even if null)
    return cached !== undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to permissions cache updates
  }, [shouldLoadData, queryClient, permissionsData]);

  // Determine loading state:
  // - If cache doesn't exist (undefined) and query hasn't resolved (dataUpdatedAt === 0), we're still loading
  // - Once cache exists (even if null) or dataUpdatedAt > 0, prefetch has completed
  const permissionsLoading = shouldLoadData && !cacheExists && dataUpdatedAt === 0;

  // Calculate permission status
  const { hasRequiredPermissions, isPartiallyEnabled, missingPermissions } = useMemo(() => {
    if (!permissionsData?.permissions) {
      return {
        hasRequiredPermissions: false,
        isPartiallyEnabled: false,
        missingPermissions: [...REQUIRED_PERMISSIONS],
      };
    }

    const permissions = permissionsData.permissions;
    const missing: string[] = [];
    let hasAnyPermission = false;

    const hasFreebusy = Boolean(permissions.calendar_freebusy?.granted);

    // Check required permissions
    if (!permissions.calendar_calendarlist_readonly?.granted) {
      missing.push("calendar_calendarlist_readonly");
    } else {
      hasAnyPermission = true;
    }

    if (!hasFreebusy) {
      missing.push("calendar_freebusy");
    } else {
      hasAnyPermission = true;
    }

    // Check if partially enabled (has some but not all required permissions)
    const isPartiallyEnabled =
      hasAnyPermission && missing.length > 0 && missing.length < REQUIRED_PERMISSIONS.length;

    return {
      hasRequiredPermissions: missing.length === 0,
      isPartiallyEnabled,
      missingPermissions: missing,
    };
  }, [permissionsData]);

  return {
    permissions: permissionsData,
    permissionsLoading,
    permissionsError: permissionsError
      ? permissionsError instanceof Error
        ? permissionsError.message
        : String(permissionsError)
      : null,
    hasRequiredPermissions,
    isPartiallyEnabled,
    missingPermissions,
  };
}
