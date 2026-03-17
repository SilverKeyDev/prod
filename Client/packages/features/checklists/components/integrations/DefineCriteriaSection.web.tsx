import React, { useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { HousingSection } from "packages/features/profile/components/sections/index.web"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Checklist DefineCriteria reuses HousingSection from profile; shared composition. */
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useResponsive } from "packages/hooks/ui";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type DefineCriteriaSectionProps = {
  onComplete?: () => void;
};

export default function DefineCriteriaSection({ onComplete }: DefineCriteriaSectionProps) {
  const { t } = useLocalization();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;

  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  const { saveStatus, updateFormData: updateFormDataWithAutoSave } = useAutoSavePreferences({
    refreshUserPreferences,
    showErrorToastOnError: true,
  });

  useEffect(() => {
    if (userPreferences) {
      const initialData = userPreferencesToOnboardingData(
        userPreferences as Record<string, unknown>
      );
      setFormData(initialData);
    }
  }, [userPreferences]);

  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );

  const handleDone = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        {saveStatus !== "idle" && (
          <Box className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <BodyText as="span" size="sm" className="text-text-secondary">
                {t("common.saving")}
              </BodyText>
            )}
            {saveStatus === "saved" && (
              <BodyText as="span" size="sm" className="text-accent flex items-center gap-1">
                <Icon name="check" className="h-4 w-4" />
                {t("common.saved")}
              </BodyText>
            )}
          </Box>
        )}

        <HousingSection
          formData={formData as OnboardingData}
          isEditMode={true}
          updateFormData={updateFormData}
          isDesktop={isDesktop}
          wrapInCard={false}
        />

        <Button variant="primary" size="md" onPress={handleDone}>
          Done
        </Button>
      </Box>
    </Card>
  );
}
