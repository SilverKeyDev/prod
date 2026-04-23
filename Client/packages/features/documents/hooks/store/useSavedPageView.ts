import { useCallback, useEffect, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useNavigation } from "packages/navigation";

export type SavedPageViewType = "homes" | "documents" | "agreements";

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
 *
 * When the URL does not specify `saved`, the last persisted tab from the server is used.
 */
function getViewTypeFromSearch(search: string): SavedPageViewType {
  const params = new URLSearchParams(search);
  const p = params.get("saved") ?? params.get("view");
  return p === "homes" || p === "documents" || p === "agreements" ? p : "homes";
}

function hasSavedInSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  const p = params.get("saved") ?? params.get("view");
  return p === "homes" || p === "documents" || p === "agreements";
}

export function useSavedPageView(): UseSavedPageViewReturn {
  const { clientSettings, patchClientSettings } = useClientSettings();
  const { getCurrentRoute, setSearchParams } = useNavigation();
  const route = getCurrentRoute();
  const [viewType, setViewTypeState] = useState<SavedPageViewType>(() =>
    getViewTypeFromSearch(route.search)
  );

  useEffect(() => {
    if (hasSavedInSearch(route.search)) return;
    const tab = clientSettings?.saved?.tab;
    if (tab === "homes" || tab === "documents" || tab === "agreements") {
      setViewTypeState(tab);
    }
  }, [clientSettings?.saved?.tab, route.search]);

  const setViewType = useCallback(
    (action: React.SetStateAction<SavedPageViewType>) => {
      setViewTypeState((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        patchClientSettings({ saved: { tab: next } });
        return next;
      });
    },
    [patchClientSettings]
  );

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
