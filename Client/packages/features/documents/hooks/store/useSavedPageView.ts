import { useEffect, useState } from "react";

import { useNavigation } from "packages/navigation";

export type SavedPageViewType = "homes" | "documents";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * Hook for managing saved page view type with URL synchronization
 */
export function useSavedPageView(): UseSavedPageViewReturn {
  const { getCurrentRoute, setSearchParams } = useNavigation();
  const route = getCurrentRoute();
  const [viewType, setViewType] = useState<SavedPageViewType>("homes");

  // Load data when page loads or view type changes
  useEffect(() => {
    // Initialize from query param on first render
    const params = new URLSearchParams(route.search);
    const viewParam = params.get("view");
    if (viewParam === "homes" || viewParam === "documents") {
      setViewType(viewParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when view type changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (viewType !== "homes") {
          params.set("view", viewType);
        } else {
          params.delete("view");
        }
        return params;
      },
      { replace: true }
    );
  }, [viewType, route.pathname, route.search, setSearchParams]);

  return { viewType, setViewType };
}
