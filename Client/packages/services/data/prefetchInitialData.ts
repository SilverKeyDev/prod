import type { QueryClient } from "@tanstack/react-query";

import { prefetchGoogleCalendarEventsRoute } from "packages/features/calendar/hooks/data/prefetch/prefetchGoogleCalendarEventsRoute";
import { isChecklistPrefetchRouteKey } from "packages/features/checklists/api/checklistQueryKeys";
import { prefetchChecklistRoute } from "packages/features/checklists/hooks/data/prefetchChecklistRoute";
import {
  LIBRARY_PREFETCH_ROUTE_KEYS,
  prefetchFormsLibrary,
} from "packages/features/documents/hooks/data/libraryRouteDataPrefetch";
import { prefetchChatHistories } from "packages/features/messaging/hooks/data/prefetch/prefetchChatHistory";
import { log } from "packages/logger";
import { getInitialLoadRoutes, type RouteConfig } from "packages/services/data/dataConfig";
import { coreUserRoutes } from "packages/services/data/dataRoutes/coreUserRoutes";
import type { UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/product/media/prefetchRemoteImage";

export interface PrefetchRouteParams {
  routeConfig: RouteConfig;
  userProfile: UserProfile | null;
  queryClient: QueryClient;
}

/**
 * Prefetches data for a single route configuration.
 * Delegates feature-specific routes to owning feature modules.
 */
export async function prefetchRoute(params: PrefetchRouteParams): Promise<void> {
  const { routeConfig, userProfile, queryClient } = params;

  try {
    if (routeConfig.key === "googleEvents") {
      await prefetchGoogleCalendarEventsRoute(routeConfig, userProfile, queryClient);
      return;
    }

    if (isChecklistPrefetchRouteKey(routeConfig.key)) {
      await prefetchChecklistRoute(routeConfig, userProfile, queryClient);
      return;
    }

    log.debug("API", "Prefetching route", {
      routeKey: routeConfig.key,
    });

    await queryClient.prefetchQuery({
      queryKey: routeConfig.queryKey(),
      queryFn: () => routeConfig.queryFn(userProfile),
      staleTime: routeConfig.staleTime,
    });

    log.debug("API", "Successfully prefetched route", {
      routeKey: routeConfig.key,
    });
  } catch (error) {
    log.warn("API", "Failed to prefetch route", {
      routeKey: routeConfig.key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface PrefetchAllParams {
  user: UserProfile;
  queryClient: QueryClient;
}

/**
 * Prefetches all initial data for a user.
 * Runs Library-critical routes first, then remaining routes (plus agent forms library)
 * in parallel, then prefetches chat histories.
 */
export async function prefetchAllInitialData(params: PrefetchAllParams): Promise<void> {
  const { user, queryClient } = params;

  const isAgent = (user.roles ?? []).includes("agent");
  log.info("API", "Starting initial data prefetch", {
    userId: user.id,
    isAgent,
  });

  prefetchRemoteImage(user.profile_picture_url);

  const routes = getInitialLoadRoutes(user);
  const tierARoutes = routes.filter((r) => LIBRARY_PREFETCH_ROUTE_KEYS.has(r.key));
  const tierBRoutes = routes.filter((r) => !LIBRARY_PREFETCH_ROUTE_KEYS.has(r.key));

  log.debug("API", "Routes to prefetch", {
    routeCount: routes.length,
    tierACount: tierARoutes.length,
    tierBCount: tierBRoutes.length,
    routeKeys: routes.map((r) => r.key),
  });

  try {
    const tierAResults = await Promise.allSettled(
      tierARoutes.map((routeConfig) =>
        prefetchRoute({ routeConfig, userProfile: user, queryClient })
      )
    );
    const tierASucceeded = tierAResults.filter((r) => r.status === "fulfilled").length;
    const tierAFailed = tierAResults.filter((r) => r.status === "rejected").length;
    log.info("API", "Initial tier A prefetch completed (Library-critical)", {
      total: tierARoutes.length,
      succeeded: tierASucceeded,
      failed: tierAFailed,
    });

    const tierBPromises: Promise<void>[] = tierBRoutes.map((routeConfig) =>
      prefetchRoute({ routeConfig, userProfile: user, queryClient })
    );
    tierBPromises.push(
      prefetchRoute({ routeConfig: coreUserRoutes.searchResults, userProfile: user, queryClient })
    );
    if (isAgent) {
      tierBPromises.push(prefetchFormsLibrary(queryClient));
    }

    const tierBResults = await Promise.allSettled(tierBPromises);
    const tierBSucceeded = tierBResults.filter((r) => r.status === "fulfilled").length;
    const tierBFailed = tierBResults.filter((r) => r.status === "rejected").length;
    log.info("API", "Initial tier B prefetch completed", {
      total: tierBPromises.length,
      succeeded: tierBSucceeded,
      failed: tierBFailed,
    });

    await prefetchChatHistories(queryClient);
  } catch (error) {
    log.error(`API.${error}`, "Error during initial data prefetch");
  }
}
