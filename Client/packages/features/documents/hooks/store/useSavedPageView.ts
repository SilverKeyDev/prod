import { useEffect, useState } from "react";

import { useNavigation } from "packages/navigation";

export type SavedPageViewType = "homes" | "documents";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * Hook for managing saved page view type with URL synchronization.
 *
 * Web uses a dedicated `saved` search param so that:
 * - `saved=homes` shows saved homes
 * - `saved=documents` shows documents
 *
 * This keeps the URL stable on refresh and avoids conflicts with other
 * query params like `view` that are used by the PDF viewer.
 */
export function useSavedPageView(): UseSavedPageViewReturn {
  const { getCurrentRoute, setSearchParams } = useNavigation();
  const route = getCurrentRoute();
  const [viewType, setViewType] = useState<SavedPageViewType>("homes");

  // Initialize view type from search params on first render.
  useEffect(() => {
    const params = new URLSearchParams(route.search);
    // Prefer the new `saved` param, but fall back to legacy `view`
    // so old links/bookmarks keep working.
    const initialParam = params.get("saved") ?? params.get("view");
    if (initialParam === "homes" || initialParam === "documents") {
      setViewType(initialParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the `saved` search param in sync with the current view type.
  // We only update when the value actually changes to avoid router update loops.
  useEffect(() => {
    const currentParams = new URLSearchParams(route.search);
    const currentSavedParam = currentParams.get("saved");
    const desiredSavedParam = viewType;

    if (currentSavedParam === desiredSavedParam) return;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("saved", viewType);
        // Clean up any legacy `view` param that might be present.
        params.delete("view");
        return params;
      },
      { replace: true }
    );
  }, [viewType, route.search, route.pathname, setSearchParams]);

  return { viewType, setViewType };
}
