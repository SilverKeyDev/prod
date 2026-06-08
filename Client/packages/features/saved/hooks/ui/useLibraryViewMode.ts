import { useCallback, useEffect, useMemo, useRef } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useLocalStorage } from "packages/hooks/ui";
import { defaultClientSettings } from "packages/utils/clientSettings";

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

/**
 * Persisted card vs list layout for one Library tab (Homes, Documents, or DocuSign).
 * Server-backed with localStorage fallback before hydration.
 */
export function useLibraryViewMode(section: LibraryPersistSection) {
  const { clientSettings, patchClientSettings } = useClientSettings();
  const {
    value: storedLocal,
    setValue: setLocal,
    removeValue,
  } = useLocalStorage<string>(STORAGE_KEYS[section], "grid");
  const hydratedFromServerRef = useRef(false);

  const serverLayout = clientSettings?.library?.[section]?.layout;

  /** One-time sync when client settings load; do not overwrite user toggles while PATCH is debounced. */
  useEffect(() => {
    if (hydratedFromServerRef.current) return;
    if (serverLayout !== "list" && serverLayout !== "grid") return;
    setLocal(serverLayout);
    hydratedFromServerRef.current = true;
  }, [serverLayout, setLocal]);

  const value = useMemo(() => normalizeMode(storedLocal), [storedLocal]);

  const setMode = useCallback(
    (mode: LibraryViewMode) => {
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

  return { value, setMode, removeValue };
}
