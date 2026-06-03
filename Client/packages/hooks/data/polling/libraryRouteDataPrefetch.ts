import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { checklistFormsApi } from "packages/features/documents/api/checklistForms";
import { fetchDocumentLibraryQuery } from "packages/features/documents/hooks/data/useDocumentsData";
import { log } from "packages/logger";
import { useAgentDashboardStore } from "packages/store";
import type { UserProfile } from "packages/types";

/** Routes warmed in Tier A of `prefetchAllInitialData` (Library-critical). */
export const LIBRARY_PREFETCH_ROUTE_KEYS = new Set(["documentLibrary"]);

const DOCUMENTS_STALE_MS = 5 * 60 * 1000;
const FORMS_STALE_MS = 10 * 60 * 1000;

function pathFromHref(href: string): string {
  const raw = (href.split("?")[0] ?? "").split("#")[0] ?? "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function isLibraryShellPath(path: string): boolean {
  return (
    path.startsWith("/library") || path.startsWith("/saved") || path.startsWith("/compare-reports")
  );
}

export async function prefetchFormsLibrary(queryClient: QueryClient): Promise<void> {
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.formsLibrary.list(),
      queryFn: () => checklistFormsApi.listFormsLibrary(),
      staleTime: FORMS_STALE_MS,
    });
  } catch (error) {
    log.warn("API", "Failed to prefetch forms library", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Prefetch document library (and forms for agents) for the given client scope.
 */
export async function prefetchLibraryRouteQueryData(
  queryClient: QueryClient,
  user: UserProfile,
  clientId: string | undefined,
  options?: { includeFormsLibrary?: boolean }
): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.documents.list(undefined, clientId),
      queryFn: () => fetchDocumentLibraryQuery(clientId),
      staleTime: DOCUMENTS_STALE_MS,
    }),
  ]);

  if (options?.includeFormsLibrary && (user.roles ?? []).includes("agent")) {
    await prefetchFormsLibrary(queryClient);
  }
}

/**
 * Fire-and-forget prefetch when user shows intent to open Library routes (hover / focus / touch).
 */
export function prefetchLibraryRouteDataIfNeeded(
  queryClient: QueryClient,
  user: UserProfile | null | undefined,
  href: string
): void {
  if (!user) return;
  const path = pathFromHref(href);
  if (!isLibraryShellPath(path)) return;
  const clientId = useAgentDashboardStore.getState().selectedClientId ?? undefined;
  void prefetchLibraryRouteQueryData(queryClient, user, clientId, {
    includeFormsLibrary: (user.roles ?? []).includes("agent"),
  });
}
