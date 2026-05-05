import { queryKeys } from "packages/config/query/keys";
import { fetchDocumentLibraryQuery } from "packages/features/documents/hooks/data/useDocumentsData";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";

/**
 * Warms the same cache key as useDocumentsData / useSigningTodos so dashboard
 * does not cold-fetch the full library on first paint.
 */
export const documentRoutes = {
  documentLibrary: {
    key: "documentLibrary",
    queryKey: () => queryKeys.documents.list(undefined, undefined),
    queryFn: async () => fetchDocumentLibraryQuery(undefined),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
