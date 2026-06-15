import { useCallback, useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type { ClientSettings } from "packages/features/homeauth/api/clientSettings";
import { clientSettingsApi } from "packages/features/homeauth/api/clientSettings";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import {
  deepMergeRecords,
  defaultClientSettings,
  hydrateClientSettings,
  mergeClientSettingsDeep,
} from "packages/utils/auth/clientSettings";

const PATCH_DEBOUNCE_MS = 400;

/** Loads and patches `/api/v1/user/client-settings` for the authenticated user. */
export function useClientSettings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<ClientSettings> | null>(null);
  const flushChainRef = useRef<Promise<void>>(Promise.resolve());

  const query = useQuery({
    queryKey: queryKeys.user.clientSettings(userId),
    queryFn: async () => {
      const res = await clientSettingsApi.get();
      if (!res.success || !res.client_settings) {
        throw new Error(res.error ?? "Failed to load client settings");
      }
      return hydrateClientSettings(res.client_settings);
    },
    enabled: authReady && isAuthenticated,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<ClientSettings>) => {
      const res = await clientSettingsApi.patch(partial);
      if (!res.success || !res.client_settings) {
        throw new Error(res.error ?? "Failed to save client settings");
      }
      return hydrateClientSettings(res.client_settings);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user.clientSettings(userId), data);
    },
    onError: (err) => {
      log.error(`API.${err}`, "client settings patch failed");
    },
  });

  const flushPendingPatch = useCallback(() => {
    const pending = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (!pending || !isAuthenticated) return;
    flushChainRef.current = flushChainRef.current.then(async () => {
      await mutation.mutateAsync(pending);
    });
  }, [isAuthenticated, mutation]);

  const schedulePatch = useCallback(
    (partial: Partial<ClientSettings>) => {
      const key = queryKeys.user.clientSettings(userId);
      queryClient.setQueryData(key, (prev) => {
        const base = prev ?? defaultClientSettings();
        return mergeClientSettingsDeep(base, partial);
      });
      pendingPatchRef.current = deepMergeRecords(
        (pendingPatchRef.current ?? {}) as Record<string, unknown>,
        partial as unknown as Record<string, unknown>
      ) as Partial<ClientSettings>;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        flushPendingPatch();
      }, PATCH_DEBOUNCE_MS);
    },
    [flushPendingPatch, queryClient, userId]
  );

  const patchClientSettingsNow = useCallback(
    async (partial: Partial<ClientSettings>) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingPatchRef.current = null;
      const key = queryKeys.user.clientSettings(userId);
      queryClient.setQueryData(key, (prev) => {
        const base = prev ?? defaultClientSettings();
        return mergeClientSettingsDeep(base, partial);
      });
      const res = await mutation.mutateAsync(partial);
      return res;
    },
    [mutation, queryClient, userId]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const pending = pendingPatchRef.current;
      pendingPatchRef.current = null;
      if (!pending) return;
      void clientSettingsApi.patch(pending).catch(() => {
        /* best-effort flush; debounced PATCH may fail if session ended */
      });
    };
  }, []);

  const settings = query.data ?? null;

  return {
    clientSettingsQuery: query,
    /** Merged defaults + server snapshot (null while loading or unauthenticated). */
    clientSettings: settings,
    patchClientSettings: schedulePatch,
    patchClientSettingsNow,
    isPatching: mutation.isPending,
  };
}
