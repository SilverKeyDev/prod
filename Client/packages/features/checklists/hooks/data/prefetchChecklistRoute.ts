import type { QueryClient } from "@tanstack/react-query";

import {
  checklistProgressSummaryQueryKey,
  checklistTypeForPrefetchRouteKey,
  checklistTypeQueryKey,
  isChecklistPrefetchRouteKey,
} from "packages/features/checklists/api/checklistQueryKeys";
import { tryResolveMyTransactionId } from "packages/features/checklists/api/checklists";
import { log } from "packages/logger";
import type { RouteConfig } from "packages/services/data/dataConfig";
import type { UserProfile } from "packages/types";

export async function prefetchChecklistRoute(
  routeConfig: RouteConfig,
  userProfile: UserProfile | null,
  queryClient: QueryClient
): Promise<void> {
  if (!isChecklistPrefetchRouteKey(routeConfig.key)) {
    return;
  }

  const transactionId = await tryResolveMyTransactionId();
  if (!transactionId) {
    log.debug("API", "Skipping checklist prefetch — no transaction", {
      routeKey: routeConfig.key,
    });
    return;
  }

  const checklistType = checklistTypeForPrefetchRouteKey(routeConfig.key);
  const queryKey =
    routeConfig.key === "checklistProgressSummary"
      ? checklistProgressSummaryQueryKey(transactionId)
      : checklistType
        ? checklistTypeQueryKey(checklistType, transactionId)
        : routeConfig.queryKey();

  await queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const data = await routeConfig.queryFn(userProfile);
      if (data == null) {
        throw new Error("Checklist prefetch returned no data");
      }
      return data;
    },
    staleTime: routeConfig.staleTime,
  });

  log.debug("API", "Successfully prefetched checklist route", {
    routeKey: routeConfig.key,
    transactionId,
  });
}
