import { useEffect } from "react";
import { useUIStore } from "../../../store";
import type { SavedPageViewType } from "../../store/documents/useSavedPageView";

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
      (
        window as unknown as { refreshFavorites?: () => void }
      ).refreshFavorites = refreshSavedHomes;
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
