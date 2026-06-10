import React from "react";

import { useLocalization } from "packages/contexts";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  parseKidsAgesString,
  serializeKidsAgesTags,
} from "packages/features/profile/utils/onboarding/buyerKidsAges";
import { toggleBuyerMovingWithSelection } from "packages/features/profile/utils/onboarding/buyerMovingWith";
import { Input, TagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import {
  BUYER_MOVING_WITH_OPTIONS,
  BUYER_PET_TYPE_OPTIONS,
  BUYER_PETS_YES_NO_OPTIONS,
} from "./buyerOnboardingOptions";
import {
  BuyerFieldBlock,
  BuyerMultiSelectChips,
  BuyerRadioGroup,
} from "./BuyerPreferenceFieldGroup";

export type BuyerAboutMeStepContentProps = {
  formData: OnboardingData;
  updateField: (field: keyof OnboardingData | string, value: unknown) => void;
  /** When false (profile read-only), inputs are disabled. Onboarding always editable. */
  isEditMode?: boolean;
  showHeader?: boolean;
};

export function BuyerAboutMeStepContent({
  formData,
  updateField,
  isEditMode = true,
  showHeader = true,
}: BuyerAboutMeStepContentProps) {
  const { t } = useLocalization();
  const disabled = !isEditMode;

  const movingWith = formData.buyer_about_moving_with ?? [];
  const hasKids = movingWith.includes("kids");
  const hasPets =
    formData.buyer_about_has_pets === true
      ? "yes"
      : formData.buyer_about_has_pets === false
        ? "no"
        : undefined;

  const setPets = (value: string) => {
    const yes = value === "yes";
    updateField("buyer_about_has_pets", yes);
    if (!yes) {
      updateField("buyer_about_pet_types", []);
    }
    updateField("pets", yes ? "yes" : "no");
  };

  return (
    <Box className="flex flex-col gap-8">
      {showHeader && (
        <Box className="gap-2">
          <Title as="h2" size="lg">
            {t("profile.onboarding.about.title")}
          </Title>
          <BodyText size="sm" muted>
            {t("profile.onboarding.about.subtitle")}
          </BodyText>
        </Box>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.about.moving_with.label")}>
        <BuyerMultiSelectChips
          options={[...BUYER_MOVING_WITH_OPTIONS]}
          value={movingWith}
          disabled={disabled}
          resolveNextValue={toggleBuyerMovingWithSelection}
          onChange={(next) => {
            updateField("buyer_about_moving_with", next);
            if (!next.includes("kids")) {
              updateField("buyer_about_kids_ages", "");
            }
          }}
        />
      </BuyerFieldBlock>

      {hasKids && (
        <BuyerFieldBlock label={t("profile.onboarding.about.kids_ages.label")}>
          <TagInput
            value={parseKidsAgesString(formData.buyer_about_kids_ages)}
            onChange={(tags) => updateField("buyer_about_kids_ages", serializeKidsAgesTags(tags))}
            placeholder={t("profile.onboarding.about.kids_ages.placeholder")}
            isEditMode={!disabled}
            disabled={disabled}
          />
        </BuyerFieldBlock>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.about.pets.label")}>
        <BuyerRadioGroup
          name="buyer-about-pets"
          options={[...BUYER_PETS_YES_NO_OPTIONS]}
          value={hasPets}
          disabled={disabled}
          onChange={setPets}
        />
      </BuyerFieldBlock>

      {hasPets === "yes" && (
        <BuyerFieldBlock label={t("profile.onboarding.about.pet_types.label")}>
          <BuyerMultiSelectChips
            options={[...BUYER_PET_TYPE_OPTIONS]}
            value={formData.buyer_about_pet_types ?? []}
            disabled={disabled}
            onChange={(next) => updateField("buyer_about_pet_types", next)}
          />
        </BuyerFieldBlock>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.about.move_motivation.label")}>
        <Input
          value={formData.buyer_about_move_motivation ?? ""}
          onValueChange={(text) => updateField("buyer_about_move_motivation", text)}
          placeholder={t("profile.onboarding.about.move_motivation.placeholder")}
          editable={!disabled}
        />
      </BuyerFieldBlock>
    </Box>
  );
}
