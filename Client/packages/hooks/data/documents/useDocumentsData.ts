import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import { reportApi } from "packages/config/api/documents/report";
import { queryKeys } from "packages/config/query/keys";
import { useAuthStore } from "packages/store";

// Document data structure from API
export type DocumentData = {
  id: string;
  filename: string;
  file_path: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  document_type: string | null;
  address: string | null;
  event_type?: "listed" | "price_change" | "sold" | "withdrawn" | null;
};

export type UseDocumentsDataReturn = {
  documents: DocumentData[];
  isLoading: boolean;
  error: string | null;
  refetchDocuments: () => Promise<unknown>;
};

/**
 * Hook for managing documents data with React Query
 * Follows the same pattern as useChecklistData and useSavedHomesData
 * @param clientId - Optional client ID for agents to view client's documents
 */
export function useDocumentsData(clientId?: string): UseDocumentsDataReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness and authentication
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated],
  );

  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: queryKeys.documents.list(undefined, clientId),
    queryFn: async () => {
      try {
        const response = await reportApi.getDocuments(clientId);
        if (!response.success) {
          const errorMessage = response.error ?? "Failed to fetch documents";
          log.error(LOG_CATEGORIES.API, "Failed to fetch documents", {
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
        // Backend returns 'documents' field
        const docs = response.documents ?? [];
        // Transform API response to DocumentData format
        return docs.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          file_path: doc.file_path,
          status: doc.status,
          created_at: doc.created_at ?? null,
          updated_at: doc.updated_at ?? null,
          user_id: doc.user_id,
          document_type: doc.document_type ?? null,
          address: doc.address ?? null,
          event_type: doc.event_type ?? null,
        }));
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Error fetching documents", err);
        throw err;
      }
    },
    enabled: shouldLoadData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    documents: documentsResponse ?? [],
    isLoading,
    error: error?.message ?? null,
    refetchDocuments,
  };
}
