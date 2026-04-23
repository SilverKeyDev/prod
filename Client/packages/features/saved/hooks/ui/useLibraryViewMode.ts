import { useCallback, useMemo } from "react";

import { useLocalStorage } from "packages/features/homeauth/hooks/ui/useLocalStorage";
import { defaultClientSettings } from "packages/features/homeauth/utils/defaultClientSettings";
import { useClientSettings } from "packages/hooks/data/user/useClientSettings";

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

  const value = useMemo(() => {
    const fromServer = clientSettings?.library?.[section]?.layout;
    if (fromServer === "list" || fromServer === "grid") {
      return fromServer;
    }
    return normalizeMode(storedLocal);
  }, [clientSettings?.library, section, storedLocal]);

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
