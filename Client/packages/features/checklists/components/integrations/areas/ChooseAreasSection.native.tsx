import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { ChecklistStepSubmitFooter } from "packages/features/checklists/components/steps/ChecklistStepSubmitFooter";
import { isChooseSearchAreaStepComplete } from "packages/features/checklists/utils/integration/checklistIntegrationCompleteness";
import type { OnboardingData } from "packages/features/profile/types/onboarding";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { userPreferencesToOnboardingData } from "@/features/profile/utils";

type ChooseAreasSectionProps = {
  onComplete?: () => void;
};

/**
 * Native: search areas are configured on web; submit when saved locations qualify.
 */
export default function ChooseAreasSection({ onComplete }: ChooseAreasSectionProps) {
  const { t } = useLocalization();
  const { userPreferences } = useUserPreferences();
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  useEffect(() => {
    if (userPreferences) {
      setFormData(userPreferencesToOnboardingData(userPreferences as Record<string, unknown>));
    }
  }, [userPreferences]);

  const stepComplete = useMemo(() => isChooseSearchAreaStepComplete(formData), [formData]);

  const handleSubmit = useCallback(() => {
    if (!isChooseSearchAreaStepComplete(formData)) {
      showWarningToast(
        t("checklists.step.incomplete_warning", {
          defaultValue: "Complete all required fields in this step before submitting.",
        })
      );
      return;
    }
    onComplete?.();
  }, [formData, onComplete, t]);

  return (
    <Card border="dotted" padding="md" className="mb-2">
      <Box className="gap-4">
        <BodyText size="sm" className="text-text-secondary">
          Configure important locations and commute ranges on the web app. Submit here once at least
          one location is saved to your profile.
        </BodyText>
        <ChecklistStepSubmitFooter disabled={!stepComplete} onSubmit={handleSubmit} />
      </Box>
    </Card>
  );
}
