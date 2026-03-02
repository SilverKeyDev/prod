import { useState } from "react";

import type { SavedPageViewType } from "./useSavedPageView";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * React Native implementation of useSavedPageView.
 *
 * Keeps the same API as the web hook but relies purely on local state
 * instead of URL/search-param synchronization.
 */
export function useSavedPageView(): UseSavedPageViewReturn {
  const [viewType, setViewType] = useState<SavedPageViewType>("homes");

  return { viewType, setViewType };
}
