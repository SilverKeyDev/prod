import { useCallback, useMemo, useState } from "react";

export type UseMultiSelectionModalOptions = {
  isLoading?: boolean;
  /** Maximum selectable items (default 15). */
  maxItems?: number;
};

export type UseMultiSelectionModalConfirmOptions = {
  closeOnConfirm?: boolean;
  onClose?: () => void;
};

/**
 * Toggle selection for multi-select modals (e.g. share several saved homes).
 */
export function useMultiSelectionModal<T>(
  items: T[],
  getItemId: (item: T) => string,
  options: UseMultiSelectionModalOptions = {}
): {
  selectedIds: ReadonlySet<string>;
  toggleId: (id: string | null | undefined) => void;
  clearSelection: () => void;
  selectedItems: T[];
  handleConfirm: (
    onSelect: (selected: T[]) => void | Promise<void>,
    confirmOptions?: UseMultiSelectionModalConfirmOptions
  ) => Promise<void>;
  isLoading: boolean;
  maxItems: number;
} {
  const { isLoading = false, maxItems = 15 } = options;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleId = useCallback(
    (id: string | null | undefined) => {
      if (!id?.trim()) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else if (next.size < maxItems) {
          next.add(id);
        }
        return next;
      });
    },
    [maxItems]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(getItemId(i))),
    [items, selectedIds, getItemId]
  );

  const handleConfirm = useCallback(
    async (
      onSelect: (selected: T[]) => void | Promise<void>,
      confirmOptions?: UseMultiSelectionModalConfirmOptions
    ) => {
      if (selectedItems.length === 0) return;
      await Promise.resolve(onSelect([...selectedItems]));
      setSelectedIds(new Set());
      if (confirmOptions?.closeOnConfirm !== false && confirmOptions?.onClose) {
        confirmOptions.onClose();
      }
    },
    [selectedItems]
  );

  return {
    selectedIds,
    toggleId,
    clearSelection,
    selectedItems,
    handleConfirm,
    isLoading,
    maxItems,
  };
}
