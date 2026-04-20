import { useCallback, useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { searchDisplayApi } from "packages/features/search/api/searchDisplay";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import type { SearchDisplayPayload } from "packages/features/search/types/searchDisplay";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";

/**
 * Loads search display settings from the API when authenticated and keeps Zustand in sync.
 * Patches persist server-side when local display fields change from the Display dropdown.
 */
export function useSearchDisplaySettings(authReady: boolean) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const applySearchDisplayFromApi = useFiltersStore((s) => s.applySearchDisplayFromApi);
  const hydratedRef = useRef(false);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.user.searchDisplay(),
    queryFn: async () => {
      const res = await searchDisplayApi.get();
      if (!res.success || !res.search_display) {
        throw new Error(res.error ?? "Failed to load search display");
      }
      return res.search_display;
    },
    enabled: authReady && isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    applySearchDisplayFromApi(query.data);
    hydratedRef.current = true;
  }, [query.data, applySearchDisplayFromApi]);

  const mutation = useMutation({
    mutationFn: async (partial: Partial<SearchDisplayPayload>) => {
      const res = await searchDisplayApi.patch(partial);
      if (!res.success || !res.search_display) {
        throw new Error(res.error ?? "Failed to save search display");
      }
      return res.search_display;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.searchDisplay(), data);
      applySearchDisplayFromApi(data);
    },
    onError: (err) => {
      log.error(LOG_CATEGORIES.API, "search display patch failed", err);
    },
  });

  const patchSearchDisplay = useCallback(
    (partial: Partial<SearchDisplayPayload>) => {
      if (!isAuthenticated) return;
      void mutation.mutateAsync(partial).catch(() => {
        /* logged in onError */
      });
    },
    [isAuthenticated, mutation]
  );

  return {
    searchDisplayQuery: query,
    patchSearchDisplay,
    isPatching: mutation.isPending,
  };
}
