import { useCallback, useMemo, useEffect } from "react";
import type { Document } from "../../../schemas";
import { useViewStore } from "../../../store/view.slice";

type UseDocumentSelectionReturn = {
  selectedDocuments: Set<string>;
  selectedDocumentsData: Document[];
  handleToggleDocumentSelection: (documentId: string) => void;
  handleRemoveDocument: (documentId: string) => void;
  handleClearSelection: () => void;
};

const SELECTION_KEY = "documents.selectedIds";

/**
 * Hook for managing document selection state with Zustand persistence
 * Uses viewStore.dropdownSelections (same pattern as checklists and homes)
 */
export function useDocumentSelection(
  documents: Document[],
): UseDocumentSelectionReturn {
  const dropdownSelections = useViewStore((s) => s.dropdownSelections);
  const setDropdownSelection = useViewStore((s) => s.setDropdownSelection);
  const clearDropdownSelection = useViewStore((s) => s.clearDropdownSelection);

  // Get persisted selected IDs from Zustand store
  const persistedSelectedIds = useMemo(() => {
    const saved = dropdownSelections[SELECTION_KEY];
    if (Array.isArray(saved)) {
      return saved as string[];
    }
    return [];
  }, [dropdownSelections]);

  // Filter to only valid document IDs that exist in current documents list
  const selectedDocuments = useMemo(() => {
    if (documents.length === 0) return new Set<string>();

    const validDocumentIds = new Set(documents.map((d) => d.id));
    const validSelections = persistedSelectedIds.filter((id) =>
      validDocumentIds.has(id),
    );

    return new Set(validSelections);
  }, [documents, persistedSelectedIds]);

  // Sync store when documents change (clean up invalid selections)
  useEffect(() => {
    if (documents.length > 0 && persistedSelectedIds.length > 0) {
      const validDocumentIds = new Set(documents.map((d) => d.id));
      const validSelections = persistedSelectedIds.filter((id) =>
        validDocumentIds.has(id),
      );

      if (validSelections.length !== persistedSelectedIds.length) {
        if (validSelections.length > 0) {
          setDropdownSelection(SELECTION_KEY, validSelections);
        } else {
          clearDropdownSelection(SELECTION_KEY);
        }
      }
    }
  }, [
    documents,
    persistedSelectedIds,
    setDropdownSelection,
    clearDropdownSelection,
  ]);

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
    [selectedDocuments, setDropdownSelection, clearDropdownSelection],
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
    [selectedDocuments, setDropdownSelection, clearDropdownSelection],
  );

  const handleClearSelection = useCallback(() => {
    clearDropdownSelection(SELECTION_KEY);
  }, [clearDropdownSelection]);

  // Get selected documents data
  const selectedDocumentsData = useMemo(
    () => documents.filter((document) => selectedDocuments.has(document.id)),
    [documents, selectedDocuments],
  );

  return {
    selectedDocuments,
    selectedDocumentsData,
    handleToggleDocumentSelection,
    handleRemoveDocument,
    handleClearSelection,
  };
}
