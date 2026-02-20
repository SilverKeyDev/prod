/**
 * Hook that exposes negotiation service actions.
 * Wraps packages/services/negotiation so components use hooks only.
 */
import { useCallback } from "react";

import { negotiationService } from "packages/services/negotiation";

export function useNegotiation() {
  const generateStrategy = useCallback(async () => {
    await negotiationService.generateStrategy();
  }, []);

  const cancelGeneration = useCallback(() => {
    negotiationService.cancelGeneration();
  }, []);

  const selectHome = useCallback((home: unknown) => {
    negotiationService.selectHome(home);
  }, []);

  const shareStrategyJson = useCallback(async () => {
    await negotiationService.shareStrategyJson();
  }, []);

  return {
    generateStrategy,
    cancelGeneration,
    selectHome,
    shareStrategyJson,
  };
}
