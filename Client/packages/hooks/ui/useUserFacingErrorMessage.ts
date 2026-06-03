import { useCallback } from "react";

import { useLocalization } from "packages/contexts/LocalizationContext";
import { resolveUserFacingMessage } from "packages/utils/errorHandling";

/**
 * Returns a stable function that resolves unknown errors to user-safe, i18n-backed text.
 */
export function useUserFacingErrorMessage(): (error: unknown, fallbackMessage?: string) => string {
  const { t } = useLocalization();

  return useCallback(
    (error: unknown, fallbackMessage?: string) =>
      resolveUserFacingMessage(error, {
        fallbackMessage,
        translate: t,
      }),
    [t]
  );
}
