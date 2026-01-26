import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { docusignApi } from "../../../config/api/documents/docusign";
import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import { log, LOG_CATEGORIES } from "../../../../logger";
import type { Agreement } from "../../../schemas/documents/docusign";

export type UseDocusignAgreementReturn = {
  agreement: Agreement | null;
  isLoading: boolean;
  error: string | null;
  refetchAgreement: () => Promise<unknown>;
};

/**
 * Hook for fetching a single DocuSign agreement with full details
 * Includes participants, revisions, and events when available
 * 
 * @param agreementId - The ID of the agreement to fetch
 */
export function useDocusignAgreement(
  agreementId?: string,
): UseDocusignAgreementReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness, authentication, and agreementId presence
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && !!agreementId,
    [authReady, isAuthenticated, agreementId],
  );

  const {
    data: agreement,
    isLoading,
    error,
    refetch: refetchAgreement,
  } = useQuery({
    queryKey: queryKeys.docusign.agreement(agreementId ?? ""),
    queryFn: async () => {
      if (!agreementId) {
        throw new Error("Agreement ID is required");
      }
      
      try {
        const response = await docusignApi.getAgreement(agreementId);
        if (!response.success) {
          const errorMessage = response.error ?? "Failed to fetch agreement";
          log.error(LOG_CATEGORIES.API, "Failed to fetch agreement", {
            agreementId,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
        return response.agreement ?? null;
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Error fetching agreement", {
          agreementId,
          error: err,
        });
        throw err;
      }
    },
    enabled: shouldLoadData,
    staleTime: 2 * 60 * 1000, // 2 minutes (individual agreements may update)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    agreement: agreement ?? null,
    isLoading,
    error: error?.message ?? null,
    refetchAgreement,
  };
}
