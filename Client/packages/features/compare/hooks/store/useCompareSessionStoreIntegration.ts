import { useEffect, useRef } from "react";

import { useCompareSessionStore } from "packages/features/compare/store";
import { useAuthStore } from "packages/store";

/**
 * Clears compare UI session when the user logs out.
 */
export function useCompareSessionStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resetCompareSession = useCompareSessionStore((s) => s.resetCompareSession);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    const prev = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;
    if (prev === true && isAuthenticated === false) {
      resetCompareSession();
    }
  }, [isAuthenticated, resetCompareSession]);
}
