import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import type { DocusignTemplate } from "packages/features/documents/types/docusign";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";

export type UseDocusignTemplatesReturn = {
  templates: DocusignTemplate[];
  isLoading: boolean;
  error: string | null;
  refetchTemplates: () => Promise<unknown>;
};

/**
 * Hook for managing DocuSign templates with React Query
 * Fetches available templates for agents
 *
 * Note: This hook is agent-only. It will not fetch data for non-agent users.
 */
export function useDocusignTemplates(): UseDocusignTemplatesReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const isAgent = useAuthStore((s) => s.user?.user_type === "agent");

  // Gate loading on auth readiness, authentication, and agent status
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && isAgent,
    [authReady, isAuthenticated, isAgent]
  );

  const {
    data: templatesResponse,
    isLoading,
    error,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: queryKeys.docusign.templates(),
    queryFn: async () => {
      try {
        const response = await docusignApi.listTemplates();
        if (!response.success) {
          const errorMessage = response.error ?? "Failed to fetch templates";
          log.error(LOG_CATEGORIES.API, "Failed to fetch templates", {
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
        return response.templates ?? [];
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Error fetching templates", err);
        throw err;
      }
    },
    enabled: shouldLoadData,
    staleTime: 10 * 60 * 1000, // 10 minutes (templates rarely change)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    templates: templatesResponse ?? [],
    isLoading,
    error: error?.message ?? null,
    refetchTemplates,
  };
}
