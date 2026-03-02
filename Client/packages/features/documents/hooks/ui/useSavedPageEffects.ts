import { useEffect } from "react";

import { useUIStore } from "packages/store";
import { getWindow } from "packages/utils/platform";

import type { SavedPageViewType } from "@/features/documents/hooks/store/useSavedPageView";

type UseSavedPageEffectsProps = {
  viewType: SavedPageViewType;
  refreshSavedHomes: () => void;
  error: string | null;
  documentsError: string | null;
};

/**
 * Hook for managing side effects on saved page
 */
export function useSavedPageEffects({
  viewType,
  refreshSavedHomes,
  error,
  documentsError,
}: UseSavedPageEffectsProps): void {
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Fetch data for current view
  useEffect(() => {
    if (viewType === "homes") {
      // Optionally expose refresh in dev
      const win = getWindow() as unknown as { refreshFavorites?: () => void };
      if (win) win.refreshFavorites = refreshSavedHomes;
    }
  }, [refreshSavedHomes, viewType]);

  // Error toast handlers
  useEffect(() => {
    if (error) enqueueToast({ type: "error", message: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (documentsError) {
      enqueueToast({ type: "error", message: documentsError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsError]);
}
