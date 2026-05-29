import { useCallback, useEffect, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useNavigation } from "packages/navigation";

/** Library shell tabs (documents, forms for agents, DocuSign). Saved homes live under Search / client hub. */
export type SavedPageViewType = "documents" | "forms-library" | "agreements";

/**
 * Embedded saved-homes surfaces (e.g. dashboard client hub) reuse list/modal components with `viewType="homes"`.
 */
export type SavedHomesSurfaceViewType = SavedPageViewType | "homes";

type UseSavedPageViewReturn = {
  viewType: SavedPageViewType;
  setViewType: React.Dispatch<React.SetStateAction<SavedPageViewType>>;
};

/**
 * Hook for managing Library page view type with URL synchronization.
 *
 * Web uses a dedicated `library` search param (`documents`, `forms-library`, `agreements`).
 * Legacy `library=homes` / `saved=homes` maps to `documents`.
 * Legacy URLs may still use `saved=` or `view=`; those are read for backward compatibility.
 * When the URL does not specify a tab, the last persisted tab from the server is used.
 */
function savedTabFromParam(raw: string | null): SavedPageViewType | null {
  if (raw === "documents" || raw === "forms-library" || raw === "agreements") {
    return raw;
  }
  if (raw === "homes") return "documents";
  return null;
}

function getViewTypeFromSearch(search: string): SavedPageViewType {
  const params = new URLSearchParams(search);
  const p = params.get("library") ?? params.get("saved") ?? params.get("view");
  return savedTabFromParam(p) ?? "documents";
}

function hasLibraryTabInSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  const p = params.get("library") ?? params.get("saved") ?? params.get("view");
  return savedTabFromParam(p) != null;
}

export function useSavedPageView(): UseSavedPageViewReturn {
  const { clientSettings, patchClientSettings } = useClientSettings();
  const { getCurrentRoute, setSearchParams } = useNavigation();
  const route = getCurrentRoute();
  const [viewType, setViewTypeState] = useState<SavedPageViewType>(() =>
    getViewTypeFromSearch(route.search)
  );

  useEffect(() => {
    if (hasLibraryTabInSearch(route.search)) return;
    const tab = clientSettings?.saved?.tab;
    if (tab === "documents" || tab === "forms-library" || tab === "agreements") {
      setViewTypeState(tab);
    } else if (tab === "homes") {
      setViewTypeState("documents");
      patchClientSettings({ saved: { tab: "documents" } });
    }
  }, [clientSettings?.saved?.tab, route.search, patchClientSettings]);

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

  // Keep the `library` search param in sync; strip legacy `saved` / `view` tab keys.
  useEffect(() => {
    const currentParams = new URLSearchParams(route.search);
    const desiredTabParam = viewType;
    const libraryMatches = currentParams.get("library") === desiredTabParam;
    const hasLegacySaved = currentParams.has("saved");

    if (libraryMatches && !hasLegacySaved) return;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("library", viewType);
        params.delete("saved");
        // Clean up any legacy `view` param that might be present.
        params.delete("view");
        return params;
      },
      { replace: true }
    );
  }, [viewType, route.search, route.pathname, setSearchParams]);

  return { viewType, setViewType };
}
