import { type MutableRefObject, useEffect } from "react";

import { log } from "packages/logger";
import { getWindow } from "packages/utils/platform";

type FeedScrollRef = MutableRefObject<unknown>;

type SearchRef = MutableRefObject<{ triggerSearch: () => Promise<void> } | null> | undefined;

export function useSearchFeatureLifecycle({
  setTriggerRefresh,
  feedScrollRef,
  invalidateSearchAndFeed,
  searchViewMode,
  map,
  searchRef,
  memoizedSearchFunction,
  setUserGeolocation,
  searchAbortControllerRef,
  activeTab,
  filteredSearchResultsLength,
  savedHomesLength,
}: {
  setTriggerRefresh: ((fn: (() => void) | null) => void) | null | undefined;
  feedScrollRef: FeedScrollRef;
  invalidateSearchAndFeed: () => void | Promise<void>;
  searchViewMode: string;
  map: { triggerMapResize: () => void };
  searchRef: SearchRef;
  memoizedSearchFunction: () => Promise<void>;
  setUserGeolocation: (loc: { lat: number; lng: number } | null) => void;
  searchAbortControllerRef: MutableRefObject<AbortController | null>;
  activeTab: string;
  filteredSearchResultsLength: number;
  savedHomesLength: number;
}): void {
  useEffect(() => {
    if (!setTriggerRefresh) return;
    setTriggerRefresh(() => {
      const scroller = feedScrollRef.current as
        | {
            scrollToIndex: (opts: { index: number; behavior?: "smooth" | "auto" }) => void;
          }
        | null
        | undefined;
      scroller?.scrollToIndex({ index: 0, behavior: "smooth" });
      void invalidateSearchAndFeed();
    });
    return () => setTriggerRefresh(null);
  }, [setTriggerRefresh, invalidateSearchAndFeed, feedScrollRef]);

  useEffect(() => {
    if (searchViewMode === "map") {
      const t = setTimeout(() => map.triggerMapResize(), 50);
      return () => clearTimeout(t);
    }
  }, [searchViewMode, map]);

  useEffect(() => {
    if (searchRef) {
      searchRef.current = { triggerSearch: memoizedSearchFunction };
    }
  }, [searchRef, memoizedSearchFunction]);

  useEffect(() => {
    const w = getWindow();
    const nav = w?.navigator;
    if (!nav || !("geolocation" in nav)) {
      return;
    }
    const policy = w.document?.permissionsPolicy;
    if (typeof policy?.allowsFeature === "function" && !policy.allowsFeature("geolocation")) {
      return;
    }
    const geo = nav.geolocation;
    const watchId = geo.watchPosition(
      (pos) => {
        setUserGeolocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setUserGeolocation(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 }
    );
    return () => {
      geo.clearWatch(watchId);
    };
  }, [setUserGeolocation]);

  useEffect(() => {
    log.info("ROUTING", "[SEARCH] SearchFeature mounted", {
      mode: searchViewMode,
      activeTab,
      resultsCount: filteredSearchResultsLength,
      savedCount: savedHomesLength,
    });
    return () => {
      log.info("ROUTING", "[SEARCH] SearchFeature unmounted", {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount logging only; adding deps would log on every navigation/result change
  }, []);

  useEffect(() => {
    const acRef = searchAbortControllerRef;
    return () => {
      const pending = acRef.current;
      if (pending) {
        log.debug("ROUTING", "[SEARCH] Aborting in-flight search on unmount", {});
        pending.abort();
      }
    };
  }, [searchAbortControllerRef]);
}
