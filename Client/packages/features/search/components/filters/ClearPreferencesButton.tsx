import React, { useCallback } from "react";

import { useLocalization } from "packages/contexts";
import { useClearUserPreferences } from "packages/hooks/data/user/useClearUserPreferences";
import { useIsAgent } from "packages/hooks/store";
import { Button } from "packages/ui";

import type { OnboardingData } from "@/features/profile/utils";

export type ClearPreferencesButtonProps = {
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  replaceFormData?: (next: Partial<OnboardingData>) => void;
  cancelPendingSave?: () => void;
  onAfterClear?: () => void | Promise<void>;
  className?: string;
};

export function ClearPreferencesButton({
  selectedClientId,
  onClientChange,
  replaceFormData,
  cancelPendingSave,
  onAfterClear,
  className,
}: ClearPreferencesButtonProps): React.ReactElement {
  const { t } = useLocalization();
  const isAgent = useIsAgent();
  const { clearPreferences, isClearing, buildEmptyFormSnapshot } = useClearUserPreferences({
    selectedClientId,
    onClientChange,
    onAfterClear,
  });

  const handlePress = useCallback(async () => {
    cancelPendingSave?.();
    try {
      await clearPreferences();
      replaceFormData?.(buildEmptyFormSnapshot());
    } catch {
      /* toast handled in hook */
    }
  }, [buildEmptyFormSnapshot, cancelPendingSave, clearPreferences, replaceFormData]);

  if (!isAgent) {
    return <></>;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onPress={() => void handlePress()}
      loading={isClearing}
      disabled={isClearing}
      className={className ?? "w-full"}
      label={t("search.clear_preferences")}
    >
      {t("search.clear_preferences")}
    </Button>
  );
}
