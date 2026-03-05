import React from "react";

import { BodyText, Dropdown, Input, Title } from "packages/ui/components/index.web";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import ProfilePictureUpload from "@/features/profile/components/profilePicture/ProfilePictureUpload";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/OptionTagInput.web";
import {
  FIELD_LABELS,
  IS_AGENT_OPTIONS,
  type OnboardingData,
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
};

const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function getOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined
): string {
  if (!value) return "Not specified";
  return options.find((o) => o.value === value)?.label ?? "Not specified";
}

export default function DemographicsSection({
  formData,
  isEditMode,
  updateFormData,
  wrapInCard = true,
  hideProfilePictureWhenOnboarding = false,
}: DemographicsSectionProps) {
  const content = (
    <>
      <Title size="md" className="mb-6">
        About You
      </Title>

      {!hideProfilePictureWhenOnboarding && (
        <div className="mb-6">
          <ProfilePictureUpload />
        </div>
      )}

      {/* Name */}
      <div>
        <Label>{FIELD_LABELS.NAME}</Label>
        {isEditMode ? (
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
          <div className="mobile-input mt-2 bg-gray-50">{formData.name ?? "Not specified"}</div>
        )}
      </div>

      {/* Are you a real estate agent? + Age */}
      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
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
              <div className="mobile-input bg-gray-50">
                {getOptionLabel(IS_AGENT_OPTIONS, formData.is_agent)}
              </div>
            ),
          },
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
              />
            ) : (
              <div className="mobile-input bg-gray-50">{formData.age ?? "Not specified"}</div>
            ),
          },
        ]}
      />

      {/* Why are you joining SilverKey? (multiselect tags) */}
      <div>
        <Label>{FIELD_LABELS.WHY_JOINING_SILVERKEY}</Label>
        <div className="mt-2">
          <OptionTagInput
            options={WHY_JOINING_SILVERKEY_OPTIONS}
            value={(formData.why_joining_silverkey as string[]) ?? []}
            onChange={(value: string[]) => updateFormData("why_joining_silverkey", value)}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Buyer's Agent Section */}
      <div className="mt-6">
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
                <div className="mobile-input bg-gray-50">
                  {getOptionLabel(HAS_BUYERS_AGENT_OPTIONS, formData.has_buyers_agent)}
                </div>
              ),
            },
            {
              title:
                formData.has_buyers_agent === "no" ? (
                  <Label>Looking for Agent?</Label>
                ) : (
                  <div className="mb-2 block text-sm font-medium text-transparent">&nbsp;</div>
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
      </div>
    </>
  );
  return wrapInCard ? (
    <Card className="space-y-6">{content}</Card>
  ) : (
    <div className="space-y-6">{content}</div>
  );
}
