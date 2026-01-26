import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { docusignApi } from "../../../config/api/documents/docusign";
import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import { log, LOG_CATEGORIES } from "../../../../logger";
import type { Agreement } from "../../../schemas/documents/docusign";

export type UseDocusignAgreementsReturn = {
  agreements: Agreement[];
  isLoading: boolean;
  error: string | null;
  refetchAgreements: () => Promise<unknown>;
};

/**
 * Hook for managing DocuSign agreements list with React Query
 * Fetches all agreements for the current user (agent or buyer)
 */
export function useDocusignAgreements(): UseDocusignAgreementsReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness and authentication
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated],
  );

  const {
    data: agreementsResponse,
    isLoading,
    error,
    refetch: refetchAgreements,
  } = useQuery({
    queryKey: queryKeys.docusign.agreementsList(),
    queryFn: async () => {
      try {
        const response = await docusignApi.listAgreements();
        if (!response.success) {
          const errorMessage = response.error ?? "Failed to fetch agreements";
          log.error(LOG_CATEGORIES.API, "Failed to fetch agreements", {
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
        return response.agreements ?? [];
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Error fetching agreements", err);
        throw err;
      }
    },
    enabled: shouldLoadData,
    staleTime: 3 * 60 * 1000, // 3 minutes (agreements change frequently)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    agreements: agreementsResponse ?? [],
    isLoading,
    error: error?.message ?? null,
    refetchAgreements,
  };
}
