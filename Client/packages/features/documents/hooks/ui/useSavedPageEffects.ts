import { useEffect } from "react";

import { useUIStore } from "packages/store";

type UseSavedPageEffectsProps = {
  documentsError: string | null;
};

/**
 * Hook for managing side effects on Library (toast errors for document fetch failures).
 */
export function useSavedPageEffects({ documentsError }: UseSavedPageEffectsProps): void {
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  useEffect(() => {
    if (documentsError) {
      enqueueToast({ type: "error", message: documentsError });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsError]);
}
