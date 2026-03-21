import React from "react";

import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import { Dropdown, Input, Title } from "@/components/ui";
import ProfilePictureUpload from "@/features/profile/components/profilePicture/ProfilePictureUpload";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import {
  AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT,
  effectiveIsAgentForOptionalBuyerUi,
  FIELD_LABELS,
  IS_AGENT_OPTIONS,
  type OnboardingData,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  WHY_JOINING_SILVERKEY_OPTIONS,
} from "@/features/profile/utils";

import { DemographicsLookingForAgentCell } from "./DemographicsLookingForAgentCell";
type DemographicsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  /** When false, render content in a div instead of Card (e.g. when embedded in onboarding page Card). Default true. */
  wrapInCard?: boolean;
  /** When true, hide the profile picture upload block (e.g. on onboarding page). Default false. */
  hideProfilePictureWhenOnboarding?: boolean;
  /** When true, hide the name field (onboarding only; name remains in regular settings). Default false. */
  hideNameWhenOnboarding?: boolean;
  /**
   * When false, hide the agent/buyer choice. Agent status is immutable once set during onboarding;
   * the choice is only shown during onboarding, not in settings or profile.
   * Default true for onboarding flows.
   */
  showAgentChoice?: boolean;
};

const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined
): string {
  if (!value) return PROFILE_NOT_SPECIFIED_LABEL;
  return options.find((o) => o.value === value)?.label ?? PROFILE_NOT_SPECIFIED_LABEL;
}

export default function DemographicsSection({
  formData,
  isEditMode,
  updateFormData,
  wrapInCard = true,
  hideProfilePictureWhenOnboarding = false,
  hideNameWhenOnboarding = false,
  showAgentChoice = true,
}: DemographicsSectionProps) {
  const authIsAgent = useIsAgent();
  const showAgentOptionalBuyerCallout = effectiveIsAgentForOptionalBuyerUi({
    authIsAgent,
    formIsAgent: formData.is_agent,
  });
  const content = (
    <>
      <Title size="md" className="mb-6">
        About You
      </Title>

      {!hideProfilePictureWhenOnboarding && (
        <Box className="mb-6">
          <ProfilePictureUpload />
        </Box>
      )}

      {!hideNameWhenOnboarding && (
        <AlignedRow
          breakIntoRows="md"
          gap="lg"
          justify="start"
          items={[
            {
              title: <Label className="mb-0">{FIELD_LABELS.NAME}</Label>,
              content: isEditMode ? (
                <Input
                  type="text"
                  value={formData.name ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("name", e.target.value)
                  }
                  placeholder="Enter your name"
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.name)}`}
                >
                  {formData.name ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
            {
              title: <Label className="mb-0">{FIELD_LABELS.AGE}</Label>,
              content: isEditMode ? (
                <Input
                  type="number"
                  value={formData.age?.toString() ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFormData("age", e.target.value ? parseInt(e.target.value, 10) : undefined)
                  }
                  placeholder="Enter your age"
                  min={18}
                  max={100}
                  className="mt-2"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(formData.age)}`}
                >
                  {formData.age ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
      )}

      {/* Are you a real estate agent? + Age (when name hidden) - agent choice only shown during onboarding */}
      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          ...(showAgentChoice
            ? [
                {
                  title: <Label>{FIELD_LABELS.IS_AGENT}</Label>,
                  content: isEditMode ? (
                    <Dropdown
                      value={formData.is_agent ?? ""}
                      onChange={(value) => updateFormData("is_agent", value)}
                      options={IS_AGENT_OPTIONS}
                      placeholder="Select..."
                    />
                  ) : (
                    <Box
                      className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.is_agent)}`}
                    >
                      {getOptionLabel(IS_AGENT_OPTIONS, formData.is_agent)}
                    </Box>
                  ),
                },
              ]
            : []),
          ...(hideNameWhenOnboarding
            ? [
                {
                  title: <Label>{FIELD_LABELS.AGE}</Label>,
                  content: isEditMode ? (
                    <Input
                      type="number"
                      value={formData.age?.toString() ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateFormData(
                          "age",
                          e.target.value ? parseInt(e.target.value, 10) : undefined
                        )
                      }
                      placeholder="Enter your age"
                      min={18}
                      max={100}
                    />
                  ) : (
                    <Box
                      className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.age)}`}
                    >
                      {formData.age ?? PROFILE_NOT_SPECIFIED_LABEL}
                    </Box>
                  ),
                },
              ]
            : []),
        ]}
      />

      <>
        {showAgentOptionalBuyerCallout && (
          <Box className="border-border bg-background-surface rounded-lg border px-3 py-2">
            <Box className="text-text-secondary text-xs">
              {AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT}
            </Box>
          </Box>
        )}
        {/* Why are you joining SilverKey? (multiselect tags) */}
        <Box>
          <Label>{FIELD_LABELS.WHY_JOINING_SILVERKEY}</Label>
          <Box className="mt-2">
            <OptionTagInput
              options={WHY_JOINING_SILVERKEY_OPTIONS}
              value={(formData.why_joining_silverkey as string[]) ?? []}
              onChange={(value: string[]) => updateFormData("why_joining_silverkey", value)}
              isEditMode={isEditMode}
            />
          </Box>
        </Box>

        {/* Buyer's Agent Section */}
        <Box className="mt-6">
          <AlignedRow
            breakIntoRows="md"
            gap="lg"
            justify="start"
            items={[
              {
                title: <Label>{FIELD_LABELS.HAS_BUYERS_AGENT}</Label>,
                content: isEditMode ? (
                  <Dropdown
                    value={formData.has_buyers_agent ?? ""}
                    onChange={(value) => updateFormData("has_buyers_agent", value)}
                    options={HAS_BUYERS_AGENT_OPTIONS}
                    placeholder="Select..."
                  />
                ) : (
                  <Box
                    className={`mobile-input bg-background-base ${profileFieldValueClassName(formData.has_buyers_agent)}`}
                  >
                    {getOptionLabel(HAS_BUYERS_AGENT_OPTIONS, formData.has_buyers_agent)}
                  </Box>
                ),
              },
              {
                title:
                  formData.has_buyers_agent === "no" ? (
                    <Label>Looking for Agent?</Label>
                  ) : (
                    <Box className="mb-2 block text-sm font-medium text-transparent">&nbsp;</Box>
                  ),
                content: (
                  <DemographicsLookingForAgentCell
                    formData={formData}
                    isEditMode={isEditMode}
                    updateFormData={updateFormData}
                  />
                ),
              },
            ]}
          />
        </Box>
      </>
    </>
  );
  return wrapInCard ? (
    <Card border="light" className="space-y-6">
      {content}
    </Card>
  ) : (
    <Box className="space-y-6">{content}</Box>
  );
}
