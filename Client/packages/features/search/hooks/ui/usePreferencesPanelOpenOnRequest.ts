import { useEffect } from "react";

import { useSearchContextStore } from "packages/store";

/**
 * Opens the Preferences panel when search detects filters-too-tight (or other flows request it).
 */
export function usePreferencesPanelOpenOnRequest(onOpen: () => void): void {
  const openSignal = useSearchContextStore((s) => s.preferencesPanelOpenSignal);

  useEffect(() => {
    if (openSignal > 0) {
      onOpen();
    }
  }, [openSignal, onOpen]);
}
