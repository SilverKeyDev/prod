import { useCallback, useEffect, useRef, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useLocalStorage } from "packages/hooks/ui";
import { defaultClientSettings } from "packages/utils/auth/clientSettings";

export type LibraryViewMode = "grid" | "list";

/** Persist keys match product spec: per Library section, not global. */
export type LibraryPersistSection = "homes" | "documents" | "docusign";

const STORAGE_KEYS: Record<LibraryPersistSection, string> = {
  homes: "library-view:homes",
  documents: "library-view:documents",
  docusign: "library-view:docusign",
};

function normalizeMode(raw: string): LibraryViewMode {
  return raw === "list" ? "list" : "grid";
}

function resolveLayoutFromSettings(
  section: LibraryPersistSection,
  clientSettings: ReturnType<typeof useClientSettings>["clientSettings"],
  storedLocal: string
): LibraryViewMode {
  const fromServer = clientSettings?.library?.[section]?.layout;
  if (fromServer === "list" || fromServer === "grid") {
    return fromServer;
  }
  return normalizeMode(storedLocal);
}

/**
 * Persisted card vs list layout for one Library tab (Homes, Documents, or DocuSign).
 * Server-backed with localStorage fallback before hydration.
 *
 * Uses local state for the active mode so an in-flight client-settings GET cannot
 * overwrite a user toggle before the debounced PATCH completes (same pattern as calendar shell view).
 */
export function useLibraryViewMode(section: LibraryPersistSection) {
  const { clientSettings, clientSettingsQuery, patchClientSettings } = useClientSettings();
  const {
    value: storedLocal,
    setValue: setLocal,
    removeValue,
  } = useLocalStorage<string>(STORAGE_KEYS[section], "grid");

  const [viewMode, setViewModeState] = useState<LibraryViewMode>(() => normalizeMode(storedLocal));
  const hydratedFromServerRef = useRef(false);

  useEffect(() => {
    if (hydratedFromServerRef.current) return;
    if (clientSettingsQuery.isLoading) return;
    hydratedFromServerRef.current = true;
    setViewModeState(resolveLayoutFromSettings(section, clientSettings, storedLocal));
  }, [clientSettings, clientSettingsQuery.isLoading, section, storedLocal]);

  const setMode = useCallback(
    (mode: LibraryViewMode) => {
      setViewModeState(mode);
      setLocal(mode);
      const d = defaultClientSettings();
      const sort =
        clientSettings?.library?.[section]?.sort ?? d.library?.[section]?.sort ?? "date_desc";
      patchClientSettings({
        library: {
          [section]: {
            layout: mode,
            sort,
          },
        },
      });
    },
    [clientSettings?.library, patchClientSettings, section, setLocal]
  );

  return { value: viewMode, setMode, removeValue };
}
