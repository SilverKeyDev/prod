import { useEffect, useRef, useState } from "react";

import { useNavigation } from "packages/navigation";
import { screenDown } from "packages/schemas/app/ui/screens";
import { type SearchViewMode, useSearchViewStore } from "packages/store";
import { getWindow } from "packages/utils/core/platform";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

const PERSIST_KEY = "sk_search_preference";
const MOBILE_BREAKPOINT = screenDown("md");
const REELS_PARAM = "reels";

/**
 * Integration hook for SearchView mode with hydration-safe initial load.
 * - Detects isMobile only on client to prevent SSR mismatch
 * - If no persisted mode, sets mode = isMobile ? 'reels' : 'map'
 * - URL sync: map = /search (no params), reels = /search?reels (so back/links go to reels)
 */
export function useSearchViewIntegration() {
  const [isMobile, setIsMobile] = useState(false);
  const setMode = useSearchViewStore((s) => s.setMode);
  const mode = useSearchViewStore((s) => s.mode);
  const initialDefaultApplied = useRef(false);
  const { getCurrentRoute, getSearchParams, setSearchParams } = useNavigation();
  const route = getCurrentRoute();
  const searchParams = getSearchParams();
  const isOnSearch = route.pathname.startsWith("/search");

  // Hydration guard: detect isMobile only on client; apply initial default when no persisted mode
  // URL takes precedence: plain /search stays map and keeps URL; ?reels -> mode reels
  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const mq = win.matchMedia(MOBILE_BREAKPOINT);
    const mobile = mq.matches;
    setIsMobile(mobile);

    if (isOnSearch) {
      // Plain /search (no query) = map view; preserve URL on refresh
      const hasAnyParams = Array.from(searchParams.keys()).length > 0;
      if (!hasAnyParams) {
        setMode("map");
        initialDefaultApplied.current = true;
        const handler = () => setIsMobile(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }

      // URL has params: ?reels -> reels (e.g. back button, shared link)
      if (searchParams.has(REELS_PARAM)) {
        setMode("reels");
        return;
      }

      if (!initialDefaultApplied.current) {
        const raw = getLocalStorage().getItem(PERSIST_KEY);
        const hasPersisted =
          raw &&
          (() => {
            try {
              const parsed = JSON.parse(raw) as {
                state?: { mode?: SearchViewMode };
              };
              return parsed?.state?.mode !== undefined;
            } catch {
              return false;
            }
          })();

        if (!hasPersisted) {
          initialDefaultApplied.current = true;
          setMode(mobile ? "reels" : "map");
        }
      }
    }

    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setMode, isOnSearch, searchParams]);

  // Sync URL with mode: reels -> ?reels, map -> no params
  useEffect(() => {
    if (!isOnSearch) return;
    if (mode === "reels") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(REELS_PARAM, "");
          return next;
        },
        { replace: true },
      );
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [mode, isOnSearch, setSearchParams]);

  return { mode, isMobile };
}
