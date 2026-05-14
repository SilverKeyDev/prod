import { useEffect, useRef } from "react";

import { useMessagingComposerStore } from "packages/features/messaging/store";
import { useAuthStore } from "packages/store";

/**
 * Clears composer drafts when the user logs out so drafts never leak across accounts.
 */
export function useMessagingComposerStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const reset = useMessagingComposerStore((s) => s.reset);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    const prev = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;
    if (prev === true && isAuthenticated === false) {
      reset();
    }
  }, [isAuthenticated, reset]);
}
