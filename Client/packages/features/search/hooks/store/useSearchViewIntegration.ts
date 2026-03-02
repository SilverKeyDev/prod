import { useEffect, useState } from "react";

import { useSearchViewStore } from "packages/store";
import { screenDown } from "packages/ui/types/screens";
import { getWindow } from "packages/utils/platform";

const MOBILE_BREAKPOINT = screenDown("md");

/**
 * Integration hook for SearchView: store-driven mode and client-only isMobile.
 * Mode is controlled only by searchView store (persisted). No URL read/write.
 */
export function useSearchViewIntegration() {
  const [isMobile, setIsMobile] = useState(false);
  const mode = useSearchViewStore((s) => s.mode);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const mq = win.matchMedia(MOBILE_BREAKPOINT);
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return { mode, isMobile };
}
