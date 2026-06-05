import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { reportApi } from "packages/features/documents/api/report";
import type { DocumentLibraryKind } from "packages/features/documents/types/documentLibrary";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

export type AgreementParticipantData = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  routing_order: number;
  recipient_status: string | null;
};

// Document data structure from API (unified library: uploads + agreements)
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
  library_item_id?: string;
  library_kind?: DocumentLibraryKind;
  agreement_type?: string | null;
  /** When set, `{checklist_category}.{item_id}` for checklist-linked agreements. */
  linked_checklist_item_id?: string | null;
  // Agreement-specific fields (populated when library_kind === "agreement")
  agent_id?: string | null;
  buyer_id?: string | null;
  participants?: AgreementParticipantData[] | null;
};

export type UseDocumentsDataReturn = {
  documents: DocumentData[];
  isLoading: boolean;
  error: string | null;
  refetchDocuments: () => Promise<unknown>;
};

/** Shared with login prefetch — must stay in sync with useQuery below. */
export async function fetchDocumentLibraryQuery(clientId?: string): Promise<DocumentData[]> {
  try {
    const response = await reportApi.getDocumentLibrary(clientId);
    if (!response.success) {
      const errorMessage = resolveApiResultErrorMessage(
        response,
        "Failed to fetch document library"
      );
      log.error("API", "Failed to fetch document library", {
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
    const items = response.items ?? [];
    return items.map((row) => ({
      id: row.id,
      filename: row.filename,
      file_path: row.file_path,
      status: row.status,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      user_id: row.user_id,
      document_type: row.document_type ?? null,
      address: row.address ?? null,
      event_type: row.event_type ?? null,
      library_item_id: row.library_item_id,
      library_kind: row.library_kind,
      agreement_type: row.agreement_type ?? null,
      linked_checklist_item_id: row.linked_checklist_item_id ?? null,
      agent_id: ((row as Record<string, unknown>).agent_id as string | null) ?? null,
      buyer_id: ((row as Record<string, unknown>).buyer_id as string | null) ?? null,
      participants:
        ((row as Record<string, unknown>).participants as AgreementParticipantData[] | null) ??
        null,
    }));
  } catch (err) {
    log.error("ERRORS", "Error fetching documents", err);
    throw err;
  }
}

/**
 * Hook for managing documents data with React Query
 * Follows the same pattern as useChecklistData and useSavedHomesData
 * @param clientId - Optional client ID for agents to view client's documents
 */
export function useDocumentsData(clientId?: string): UseDocumentsDataReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Gate loading on auth readiness and authentication
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const {
    data: documentsResponse,
    isLoading,
    error,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: queryKeys.documents.list(undefined, clientId),
    queryFn: () => fetchDocumentLibraryQuery(clientId),
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
