import { useCallback, useMemo, useState } from "react";

export type UseSingleSelectionModalOptions = {
  isLoading?: boolean;
};

export type UseSingleSelectionModalConfirmOptions = {
  closeOnConfirm?: boolean;
  onClose?: () => void;
};

/**
 * Shared selection state and confirm flow for single-item selection modals
 * (e.g. SelectHomeModal, SelectDocumentModal). Use in both web and native modals
 * so only UI remains platform-specific.
 */
export function useSingleSelectionModal<T>(
  items: T[],
  getItemId: (item: T) => string,
  options: UseSingleSelectionModalOptions = {}
): {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedItem: T | null;
  handleConfirm: (
    onSelect: (item: T) => void,
    confirmOptions?: UseSingleSelectionModalConfirmOptions
  ) => void;
  isLoading: boolean;
} {
  const { isLoading = false } = options;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => (selectedId ? (items.find((i) => getItemId(i) === selectedId) ?? null) : null),
    [items, selectedId, getItemId]
  );

  const handleConfirm = useCallback(
    (onSelect: (item: T) => void, confirmOptions?: UseSingleSelectionModalConfirmOptions) => {
      if (!selectedId) return;
      const item = items.find((i) => getItemId(i) === selectedId);
      if (item) {
        onSelect(item);
        setSelectedId(null);
        if (confirmOptions?.closeOnConfirm !== false && confirmOptions?.onClose) {
          confirmOptions.onClose();
        }
      }
    },
    [items, selectedId, getItemId]
  );

  return {
    selectedId,
    setSelectedId,
    selectedItem,
    handleConfirm,
    isLoading,
  };
}
