import React, { useCallback, useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { HousingStep } from "packages/features/homeauth/components/onboarding-mobile/HousingStep";
import { useAutoSavePreferences } from "packages/hooks/data/auth/useAutoSavePreferences";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import type { OnboardingData } from "@/features/profile/utils";
import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type DefineCriteriaSectionProps = {
  onComplete?: () => void;
};

export default function DefineCriteriaSection({ onComplete }: DefineCriteriaSectionProps) {
  const { t } = useLocalization();
  const { userPreferences, refreshUserPreferences } = useUserPreferences();

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
    <Card padding="md" className="mb-2">
      <Box className="gap-4">
        {saveStatus !== "idle" && (
          <Box className="flex flex-row items-center gap-2">
            {saveStatus === "saving" && (
              <BodyText as="span" size="sm" className="text-text-secondary">
                {t("common.saving")}
              </BodyText>
            )}
            {saveStatus === "saved" && (
              <Box className="flex flex-row items-center gap-1">
                <Icon name="check" className="text-accent h-4 w-4" />
                <BodyText as="span" size="sm" className="text-accent">
                  {t("common.saved")}
                </BodyText>
              </Box>
            )}
          </Box>
        )}

        <HousingStep formData={formData as OnboardingData} updateFormData={updateFormData} />

        <Button variant="primary" size="md" onPress={handleDone}>
          Done
        </Button>
      </Box>
    </Card>
  );
}
