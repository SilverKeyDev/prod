import { useCallback, useEffect, useMemo } from "react";

import { useViewStore } from "packages/store";
import type { Document } from "packages/types";

type UseDocumentSelectionReturn = {
  selectedDocuments: Set<string>;
  selectedDocumentsData: Document[];
  handleToggleDocumentSelection: (documentId: string) => void;
  handleRemoveDocument: (documentId: string) => void;
  handleClearSelection: () => void;
};

const SELECTION_KEY = "documents.selectedIds";

function getValidSelectedIds(documents: Document[], persistedSelectedIds: string[]): string[] {
  if (documents.length === 0) return [];
  const validDocumentIds = new Set(documents.map((d) => d.id));
  return persistedSelectedIds.filter((id) => validDocumentIds.has(id));
}

/**
 * Hook for managing document selection state with Zustand persistence
 * Uses viewStore.dropdownSelections (same pattern as checklists and homes)
 */
export function useDocumentSelection(documents: Document[]): UseDocumentSelectionReturn {
  const dropdownSelections = useViewStore((s) => s.dropdownSelections);
  const setDropdownSelection = useViewStore((s) => s.setDropdownSelection);
  const clearDropdownSelection = useViewStore((s) => s.clearDropdownSelection);

  const persistedSelectedIds = useMemo(() => {
    const saved = dropdownSelections[SELECTION_KEY];
    return Array.isArray(saved) ? (saved as string[]) : [];
  }, [dropdownSelections]);

  const selectedDocuments = useMemo(() => {
    return new Set(getValidSelectedIds(documents, persistedSelectedIds));
  }, [documents, persistedSelectedIds]);

  useEffect(() => {
    if (documents.length === 0 || persistedSelectedIds.length === 0) return;
    const validSelections = getValidSelectedIds(documents, persistedSelectedIds);
    if (validSelections.length === persistedSelectedIds.length) return;
    if (validSelections.length > 0) {
      setDropdownSelection(SELECTION_KEY, validSelections);
    } else {
      clearDropdownSelection(SELECTION_KEY);
    }
  }, [documents, persistedSelectedIds, setDropdownSelection, clearDropdownSelection]);

  const handleToggleDocumentSelection = useCallback(
    (documentId: string) => {
      const currentIds = Array.from(selectedDocuments);
      const newIds = currentIds.includes(documentId)
        ? currentIds.filter((id) => id !== documentId)
        : [...currentIds, documentId];

      if (newIds.length > 0) {
        setDropdownSelection(SELECTION_KEY, newIds);
      } else {
        clearDropdownSelection(SELECTION_KEY);
      }
    },
    [selectedDocuments, setDropdownSelection, clearDropdownSelection]
  );

  const handleRemoveDocument = useCallback(
    (documentId: string) => {
      const currentIds = Array.from(selectedDocuments);
      const newIds = currentIds.filter((id) => id !== documentId);

      if (newIds.length > 0) {
        setDropdownSelection(SELECTION_KEY, newIds);
      } else {
        clearDropdownSelection(SELECTION_KEY);
      }
    },
    [selectedDocuments, setDropdownSelection, clearDropdownSelection]
  );

  const handleClearSelection = useCallback(() => {
    clearDropdownSelection(SELECTION_KEY);
  }, [clearDropdownSelection]);

  // Get selected documents data
  const selectedDocumentsData = useMemo(
    () => documents.filter((document) => selectedDocuments.has(document.id)),
    [documents, selectedDocuments]
  );

  return {
    selectedDocuments,
    selectedDocumentsData,
    handleToggleDocumentSelection,
    handleRemoveDocument,
    handleClearSelection,
  };
}
