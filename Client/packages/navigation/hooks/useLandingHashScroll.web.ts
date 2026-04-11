import { useEffect } from "react";

import { useLocation } from "react-router-dom";

import { ROUTES } from "packages/navigation/types/routes";

/**
 * After navigating to `/#section` (e.g. from legal pages), scroll to `id="section"` on the home landing.
 * No-op when `enabled` is false.
 */
export function useLandingHashScroll(enabled: boolean): void {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (pathname !== ROUTES.HOME && pathname !== "") {
      return;
    }
    const id = hash.replace(/^#/, "");
    if (!id) {
      return;
    }

    const scroll = () => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const raf = window.requestAnimationFrame(() => {
      // Defer past lazy/Suspense paint when opening `/` from another route.
      window.setTimeout(scroll, 50);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [enabled, hash, pathname]);
}
