import { useCallback, useEffect } from "react";

import type { SavedPageViewType } from "packages/features/documents";
import { useLibrarySortPreference } from "packages/features/saved/hooks/ui/useLibrarySortPreference";
import {
  type LibraryViewMode,
  useLibraryViewMode,
} from "packages/features/saved/hooks/ui/useLibraryViewMode";

export type SavedLibraryChrome = {
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
  libraryViewMode: LibraryViewMode;
  setLibraryViewMode: (mode: LibraryViewMode) => void;
  showLibraryViewToggle: boolean;
};

export function useSavedLibraryChrome(
  viewType: SavedPageViewType,
  setViewType: (view: SavedPageViewType) => void,
  isAgent: boolean
): SavedLibraryChrome {
  const documentsLibraryView = useLibraryViewMode("documents");
  const docusignLibraryView = useLibraryViewMode("docusign");
  const { setMode: setDocumentsLibraryMode } = documentsLibraryView;
  const { setMode: setDocusignLibraryMode } = docusignLibraryView;

  const documentsLibrarySort = useLibrarySortPreference("documents");
  const docusignLibrarySort = useLibrarySortPreference("docusign");

  const librarySortKey =
    viewType === "documents" || viewType === "forms-library"
      ? documentsLibrarySort.value
      : docusignLibrarySort.value;

  const onLibrarySortChange = useCallback(
    (value: string) => {
      if (viewType === "documents" || viewType === "forms-library") {
        documentsLibrarySort.setSort(value);
      } else {
        docusignLibrarySort.setSort(value);
      }
    },
    [viewType, documentsLibrarySort, docusignLibrarySort]
  );

  const libraryViewMode: LibraryViewMode =
    viewType === "documents" || viewType === "forms-library"
      ? documentsLibraryView.value
      : docusignLibraryView.value;

  const setLibraryViewMode = useCallback(
    (mode: LibraryViewMode) => {
      if (viewType === "documents" || viewType === "forms-library") {
        setDocumentsLibraryMode(mode);
      } else {
        setDocusignLibraryMode(mode);
      }
    },
    [viewType, setDocumentsLibraryMode, setDocusignLibraryMode]
  );

  useEffect(() => {
    if (!isAgent && viewType === "forms-library") {
      setViewType("documents");
    }
  }, [isAgent, viewType, setViewType]);

  return {
    librarySortKey,
    onLibrarySortChange,
    libraryViewMode,
    setLibraryViewMode,
    showLibraryViewToggle: true,
  };
}
