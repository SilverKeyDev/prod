import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { type ChecklistType, getTaskChecklistForSubject } from "packages/features/checklists";
import { useAuthStore } from "packages/store";

/** Matches roadmap sub-tabs / `useChecklistData` types — prefetch so switching phases does not wait. */
const CLIENT_HUB_PREFETCH_CHECKLIST_TYPES: readonly ChecklistType[] = [
  "search",
  "offer",
  "escrow",
  "insurance",
  "financing",
  "closing",
];

/**
 * Prefetches checklist task payloads for the client hub roadmap tabs.
 * Keeps React Query cache warm for `["checklists", type, transactionId]` keys.
 */
export function useClientHubChecklistPrefetch(transactionId: string) {
  const queryClient = useQueryClient();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!transactionId || !authReady || !isAuthenticated) return;
    void Promise.all(
      CLIENT_HUB_PREFETCH_CHECKLIST_TYPES.map((type) =>
        queryClient.prefetchQuery({
          queryKey: ["checklists", type, transactionId],
          queryFn: () => getTaskChecklistForSubject(transactionId, type),
        })
      )
    );
  }, [authReady, transactionId, isAuthenticated, queryClient]);
}
