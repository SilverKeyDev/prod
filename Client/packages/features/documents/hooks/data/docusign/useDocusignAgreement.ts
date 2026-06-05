import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import type { Agreement } from "packages/features/documents/types/docusign";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

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
export function useDocusignAgreement(agreementId?: string): UseDocusignAgreementReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness, authentication, and agreementId presence
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated && !!agreementId,
    [authReady, isAuthenticated, agreementId]
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
          const errorMessage = resolveApiResultErrorMessage(response, "Failed to fetch agreement");
          log.error("API", "Failed to fetch agreement", {
            agreementId,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
        return response.agreement ?? null;
      } catch (err) {
        log.error("ERRORS", "Error fetching agreement", {
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
