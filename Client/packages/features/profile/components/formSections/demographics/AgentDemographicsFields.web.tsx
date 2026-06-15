import React from "react";

import { DemographicsLookingForAgentCell } from "packages/features/profile/components/formSections/DemographicsLookingForAgentCell";
import {
  PROFILE_FIELDS_ROW_PROPS,
  ProfileFullWidthField,
  ProfileSectionBody,
} from "packages/features/profile/components/layout";
import ProfilePictureUpload from "packages/features/profile/components/profilePicture/ProfilePictureUpload";
import {
  FIELD_LABELS,
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
  WHY_JOINING_SILVERKEY_OPTIONS,
} from "packages/features/profile/utils";
import { FormFieldLabel as Label, OptionTagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import { Dropdown, Input } from "@/components/ui";

import { getOptionLabel, HAS_BUYERS_AGENT_OPTIONS } from "./AgentDemographicsFields.config";
import { useAgentDemographicsContext } from "./AgentDemographicsFields.logic";
import type { AgentDemographicsFieldsProps } from "./AgentDemographicsFields.types";

export type { AgentDemographicsFieldsProps };

/** Agent / non-buyer demographics (settings, web onboarding, profile). */
export function AgentDemographicsFields({
  formData,
  isEditMode,
  updateFormData,
  hideProfilePictureWhenOnboarding = false,
  hideNameWhenOnboarding = false,
  showWhyJoiningQuestion = true,
}: AgentDemographicsFieldsProps) {
  const { showBuyerFacingDemographics } = useAgentDemographicsContext(formData);

  return (
    <ProfileSectionBody>
      {!hideProfilePictureWhenOnboarding && (
        <Box>
          <ProfilePictureUpload />
        </Box>
      )}

      {!hideNameWhenOnboarding && (
        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
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
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.name
                  )}`}
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
                  className="mt-2 w-full"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base mt-2 ${profileFieldValueClassName(
                    formData.age
                  )}`}
                >
                  {formData.age ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
      )}

      {hideNameWhenOnboarding ? (
        <AlignedRow
          {...PROFILE_FIELDS_ROW_PROPS}
          items={[
            {
              title: <Label>{FIELD_LABELS.AGE}</Label>,
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
                  className="w-full"
                />
              ) : (
                <Box
                  className={`mobile-input bg-background-base ${profileFieldValueClassName(
                    formData.age
                  )}`}
                >
                  {formData.age ?? PROFILE_NOT_SPECIFIED_LABEL}
                </Box>
              ),
            },
          ]}
        />
      ) : null}

      {showBuyerFacingDemographics ? (
        <>
          {showWhyJoiningQuestion ? (
            <ProfileFullWidthField label={<Label>{FIELD_LABELS.WHY_JOINING_SILVERKEY}</Label>}>
              <OptionTagInput
                options={WHY_JOINING_SILVERKEY_OPTIONS}
                value={(formData.why_joining_silverkey as string[]) ?? []}
                onChange={(value: string[]) => updateFormData("why_joining_silverkey", value)}
                isEditMode={isEditMode}
              />
            </ProfileFullWidthField>
          ) : null}

          <AlignedRow
            {...PROFILE_FIELDS_ROW_PROPS}
            items={[
              {
                title: <Label>{FIELD_LABELS.HAS_BUYERS_AGENT}</Label>,
                content: isEditMode ? (
                  <Dropdown
                    value={formData.has_buyers_agent ?? ""}
                    onChange={(value) => updateFormData("has_buyers_agent", value)}
                    options={[...HAS_BUYERS_AGENT_OPTIONS]}
                    placeholder="Select buyer's agent status"
                  />
                ) : (
                  <Box
                    className={`mobile-input bg-background-base ${profileFieldValueClassName(
                      formData.has_buyers_agent
                    )}`}
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
        </>
      ) : null}
    </ProfileSectionBody>
  );
}
