import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export type SavedPageViewType = "homes" | "documents";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * Hook for managing saved page view type with URL synchronization
 */
export function useSavedPageView(): UseSavedPageViewReturn {
  const location = useLocation();
  const [viewType, setViewType] = useState<SavedPageViewType>("homes");

  // Load data when page loads or view type changes
  useEffect(() => {
    // Initialize from query param on first render
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam === "homes" || viewParam === "documents") {
      setViewType(viewParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when view type changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (viewType !== "homes") {
      params.set("view", viewType);
    } else {
      params.delete("view");
    }
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [viewType, location.pathname, location.search]);

  return { viewType, setViewType };
}
