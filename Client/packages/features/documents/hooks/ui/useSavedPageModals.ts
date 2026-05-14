import { useCallback, useState } from "react";

import { useCompareSessionStoreIntegration } from "packages/features/compare/hooks/store/useCompareSessionStoreIntegration";
import { useCompareSessionStore } from "packages/features/compare/store";
import type { SavedHome } from "packages/types";

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
  useCompareSessionStoreIntegration();

  const isCompareModalOpen = useCompareSessionStore((s) => s.isCompareModalOpen);
  const setCompareModalOpen = useCompareSessionStore((s) => s.setCompareModalOpen);

  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] = useState<SavedHome | null>(
    null
  );

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
    setIsCompareModalOpen: setCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleOpenNegotiation,
    handleCloseNegotiation,
  };
}
