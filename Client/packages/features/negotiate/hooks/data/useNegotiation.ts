/**
 * Hook that exposes negotiation service actions (see `packages/features/negotiate/utils`).
 */
import { useCallback } from "react";

import { negotiationService } from "@/features/negotiate/utils";

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
