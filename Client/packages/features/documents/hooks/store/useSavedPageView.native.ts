import { useCallback, useEffect, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";

import type { SavedPageViewType } from "./useSavedPageView";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * React Native implementation of useSavedPageView.
 *
 * Persists the active Saved tab via `/api/v1/user/client-settings` (saved.tab).
 */
export function useSavedPageView(): UseSavedPageViewReturn {
  const { clientSettings, patchClientSettings } = useClientSettings();
  const [viewType, setViewTypeState] = useState<SavedPageViewType>("homes");

  useEffect(() => {
    const tab = clientSettings?.saved?.tab;
    if (tab === "homes" || tab === "documents" || tab === "agreements") {
      setViewTypeState(tab);
    }
  }, [clientSettings?.saved?.tab]);

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

  return { viewType, setViewType };
}
