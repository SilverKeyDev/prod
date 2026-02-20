import { useCallback, useState } from "react";

import type { SavedHome } from "packages/schemas";

type UseSavedPageModalsReturn = {
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  isNegotiationModalOpen: boolean;
  selectedHomeForNegotiation: SavedHome | null;
  handleOpenNegotiation: (home: SavedHome) => void;
  handleCloseNegotiation: () => void;
};

/**
 * Hook for managing modal state on saved page
 */
export function useSavedPageModals(): UseSavedPageModalsReturn {
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] =
    useState<SavedHome | null>(null);

  const handleOpenNegotiation = useCallback((home: SavedHome) => {
    setSelectedHomeForNegotiation(home);
    setIsNegotiationModalOpen(true);
  }, []);

  const handleCloseNegotiation = useCallback(() => {
    setIsNegotiationModalOpen(false);
    setSelectedHomeForNegotiation(null);
  }, []);

  return {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleOpenNegotiation,
    handleCloseNegotiation,
  };
}
