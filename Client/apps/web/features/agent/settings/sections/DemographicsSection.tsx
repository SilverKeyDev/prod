import React from "react";

import {
  FIELD_LABELS,
  IS_AGENT_OPTIONS,
  type OnboardingData,
} from "packages/utils/domain/profile";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import {
  AccessibleCheckboxInput,
  BodyText,
  Dropdown,
  Input,
  Label,
  OliveCheckbox,
  Title,
} from "@/components/ui/index.web";

type DemographicsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function DemographicsSection({
  formData,
  isEditMode,
  updateFormData,
}: DemographicsSectionProps) {
  return (
    <Card className="space-y-6">
      <Title size="md" className="mb-6">
        About You
      </Title>

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
                {formData.is_agent
                  ? (IS_AGENT_OPTIONS.find(
                      (option) => option.value === formData.is_agent,
                    )?.label ?? "Not specified")
                  : "Not specified"}
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
                  updateFormData(
                    "age",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="Enter your age"
                min={18}
                max={100}
              />
            ) : (
              <div className="mobile-input bg-gray-50">
                {formData.age ?? "Not specified"}
              </div>
            ),
          },
        ]}
      />

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
                  onChange={(value) =>
                    updateFormData("has_buyers_agent", value)
                  }
                  options={HAS_BUYERS_AGENT_OPTIONS}
                  placeholder="Select..."
                />
              ) : (
                <div className="mobile-input bg-gray-50">
                  {formData.has_buyers_agent
                    ? (HAS_BUYERS_AGENT_OPTIONS.find(
                        (option) => option.value === formData.has_buyers_agent,
                      )?.label ?? "Not specified")
                    : "Not specified"}
                </div>
              ),
            },
            {
              title:
                formData.has_buyers_agent === "no" ? (
                  <Label>Looking for Agent?</Label>
                ) : (
                  <div className="mb-2 block text-sm font-medium text-transparent">
                    &nbsp;
                  </div>
                ),
              content:
                formData.has_buyers_agent === "no" ? (
                  <div className="flex h-full items-center">
                    <Label
                      htmlFor="looking-buyers-agent"
                      className="flex cursor-pointer items-center gap-3 font-medium text-black"
                    >
                      {isEditMode ? (
                        <>
                          <AccessibleCheckboxInput
                            id="looking-buyers-agent"
                            className="sr-only"
                            checked={!!formData.looking_for_buyers_agent}
                            onChange={() =>
                              updateFormData(
                                "looking_for_buyers_agent",
                                !formData.looking_for_buyers_agent,
                              )
                            }
                            label="I am looking for a buyer's agent"
                          />
                          <OliveCheckbox
                            checked={!!formData.looking_for_buyers_agent}
                            onToggle={() =>
                              updateFormData(
                                "looking_for_buyers_agent",
                                !formData.looking_for_buyers_agent,
                              )
                            }
                          />
                        </>
                      ) : (
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            formData.looking_for_buyers_agent
                              ? "border-olive bg-olive"
                              : "border-gray-300 bg-gray-50"
                          }`}
                        >
                          {formData.looking_for_buyers_agent && (
                            <svg
                              className="h-4 w-4 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                      <BodyText as="span" size="sm" className="select-none">
                        I am looking for a buyer's agent
                      </BodyText>
                    </Label>
                  </div>
                ) : (
                  <div className="mobile-input bg-gray-50 opacity-0">
                    &nbsp;
                  </div>
                ),
            },
          ]}
        />
      </div>

      {/* Show message if user is an agent */}
      {formData.is_agent === "yes" && (
        <BodyText
          as="p"
          size="xs"
          className="mt-2 text-black/60 sm:text-sm md:text-base"
        >
          You only need to fill out the rest of this information for toying
          around or personal use.
        </BodyText>
      )}
    </Card>
  );
}
