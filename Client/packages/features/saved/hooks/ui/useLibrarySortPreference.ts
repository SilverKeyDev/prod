import { useCallback, useMemo } from "react";

import type { LibraryPersistSection } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import {
  LIBRARY_DOCUMENTS_SORT_DEFAULT,
  LIBRARY_DOCUSIGN_SORT_DEFAULT,
  LIBRARY_HOMES_SORT_DEFAULT,
  normalizeLibrarySortValue,
} from "packages/features/saved/utils/librarySort";
import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useLocalStorage } from "packages/hooks/ui";
import { defaultClientSettings } from "packages/utils/auth/clientSettings";

const STORAGE_KEYS: Record<LibraryPersistSection, string> = {
  homes: "library-sort:homes",
  documents: "library-sort:documents",
  docusign: "library-sort:docusign",
};

const DEFAULTS: Record<LibraryPersistSection, string> = {
  homes: LIBRARY_HOMES_SORT_DEFAULT,
  documents: LIBRARY_DOCUMENTS_SORT_DEFAULT,
  docusign: LIBRARY_DOCUSIGN_SORT_DEFAULT,
};

/**
 * Persisted sort / filter for one Library tab (Homes, Documents, or DocuSign).
 * Server-backed with localStorage fallback before hydration.
 */
export function useLibrarySortPreference(section: LibraryPersistSection) {
  const { clientSettings, patchClientSettings } = useClientSettings();
  const {
    value: stored,
    setValue,
    removeValue,
  } = useLocalStorage<string>(STORAGE_KEYS[section], DEFAULTS[section]);

  const value = useMemo(() => {
    const fromServer = clientSettings?.library?.[section]?.sort;
    if (typeof fromServer === "string" && fromServer.length > 0) {
      return normalizeLibrarySortValue(section, fromServer);
    }
    return normalizeLibrarySortValue(section, stored);
  }, [clientSettings?.library, section, stored]);

  const setSort = useCallback(
    (next: string) => {
      const normalized = normalizeLibrarySortValue(section, next);
      setValue(normalized);
      const d = defaultClientSettings();
      const layout =
        clientSettings?.library?.[section]?.layout ?? d.library?.[section]?.layout ?? "grid";
      patchClientSettings({
        library: {
          [section]: {
            layout,
            sort: normalized,
          },
        },
      });
    },
    [clientSettings?.library, patchClientSettings, section, setValue]
  );

  return { value, setSort, removeValue };
}
