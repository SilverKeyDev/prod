import { useEffect, useRef } from "react";

import type { Driver } from "driver.js";
import { useLocation } from "react-router-dom";

import { useResponsive } from "packages/hooks/ui";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import { useAuthStore } from "packages/store";
import { getWindow } from "packages/utils/platform";
import {
  PRODUCT_TOUR_QUERY,
  PRODUCT_TOUR_QUERY_VALUE_START,
} from "packages/utils/tour/productTourQuery";
import { isProductTourCompleted } from "packages/utils/tour/productTourStorage";

import { startSearchProductTour } from "@/app/tour/searchProductTourDriver";

/**
 * Starts the Search product tour once the user is authenticated on /search.
 * Autostart: desktop only, first visit (storage). Manual: ?productTour=1 from Settings.
 */
export function SearchProductTourMount(): null {
  const { pathname } = useLocation();
  const { setSearchParams } = useNavigation();
  const { isDesktop } = useResponsive();
  const authReady = useAuthStore((s) => s.authReady);
  const driverRef = useRef<Driver | null>(null);

  useEffect(() => {
    if (pathname !== "/search" || !authReady) {
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    const w = getWindow();
    if (!w) return;

    const params = new URLSearchParams(w.location.search);
    const force = params.get(PRODUCT_TOUR_QUERY) === PRODUCT_TOUR_QUERY_VALUE_START;

    const shouldAutoStart = isDesktop && !isProductTourCompleted();
    if (!force && !shouldAutoStart) return;

    if (!force && !isDesktop) return;

    const layout = isDesktop ? "desktop" : "mobile";

    let cancelled = false;
    const rafId = w.requestAnimationFrame(() => {
      w.requestAnimationFrame(() => {
        if (cancelled) return;

        if (force) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete(PRODUCT_TOUR_QUERY);
              return next;
            },
            { replace: true }
          );
        }

        const d = startSearchProductTour({ layout });
        if (!d) return;
        driverRef.current = d;
      });
    });

    return () => {
      cancelled = true;
      w.cancelAnimationFrame(rafId);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [pathname, authReady, isDesktop, setSearchParams]);
}
