import { useCallback, useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { searchDisplayApi } from "packages/features/search/api/searchDisplay";
import type { LastSearchContext } from "packages/features/search/types/domain/searchDisplay";
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";
import { centroidOfViewportRing } from "packages/features/search/utils/map/mapViewport";
import { log } from "packages/logger";
import { useFiltersStore, useSearchContextStore } from "packages/store";
import type { ViewportPolygonPoint } from "packages/types/domain/api";
import { dateNow } from "packages/utils/core/date";

/**
 * Persists last search context to the backend on every search, and hydrates
 * the search context + filters stores from the saved context on initial load.
 */
export function useLastSearchPersistence(): {
  saveLastSearchContext: (ctx: LastSearchContext) => void;
} {
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);

  const setLocationPlaceViewportFromBar = useSearchContextStore(
    (s) => s.setLocationPlaceViewportFromBar
  );
  const setWebMapCamera = useFiltersStore((s) => s.setWebMapCamera);
  const setSearchSource = useFiltersStore((s) => s.setSearchSource);
  const webMapCamera = useFiltersStore((s) => s.webMapCamera);

  const webMapCameraRef = useRef(webMapCamera);
  webMapCameraRef.current = webMapCamera;

  useEffect(() => {
    if (hydratedRef.current) return;

    const cached = queryClient.getQueryData<Record<string, unknown>>(
      queryKeys.user.searchDisplay()
    );
    const ctx = cached?.last_search_context as LastSearchContext | null | undefined;
    if (!ctx) return;

    hydratedRef.current = true;
    log.info("SEARCH", "Hydrating last search context from DB", {
      source: ctx.search_source,
      hasRing: Boolean(ctx.viewport_ring),
      label: ctx.place_label ?? null,
    });

    if (ctx.search_source) {
      setSearchSource(ctx.search_source);
    }

    if (ctx.viewport_ring && ctx.viewport_ring.length >= 3) {
      const ring = ctx.viewport_ring as ViewportPolygonPoint[];
      const center = centroidOfViewportRing(ring);
      const label = ctx.place_label ?? "";
      const overlay = buildIsochroneOverlayFromViewportRing(ring, center, label || undefined);
      // Ring must live on location-bar context so runViewportSearch uses it (not only overlay).
      setLocationPlaceViewportFromBar({
        ring,
        label,
        overlay,
      });
    }

    if (!webMapCameraRef.current && ctx.map_center && ctx.map_zoom) {
      setWebMapCamera({
        lat: ctx.map_center.lat,
        lng: ctx.map_center.lng,
        zoom: ctx.map_zoom,
      });
    }
  }, [queryClient, setSearchSource, setLocationPlaceViewportFromBar, setWebMapCamera]);

  const saveLastSearchContext = useCallback(
    (ctx: LastSearchContext) => {
      const payload = { ...ctx, searched_at: dateNow().toISOString() };
      log.info("SEARCH", "Saving last search context", {
        source: payload.search_source,
        hasRing: Boolean(payload.viewport_ring),
        label: payload.place_label ?? null,
      });
      searchDisplayApi
        .patch({ last_search_context: payload })
        .then((res) => {
          if (res.success && res.search_display) {
            queryClient.setQueryData(queryKeys.user.searchDisplay(), res.search_display);
          }
        })
        .catch((err: unknown) => {
          log.error(`API.${err}`, "Failed to save last search context");
        });
    },
    [queryClient]
  );

  return { saveLastSearchContext };
}
