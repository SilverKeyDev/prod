import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import {
  AccessibleCheckboxInput,
  BodyText,
  Dropdown,
  Label,
  OliveCheckbox,
  Title,
} from "@/components/ui";
import {
  COMMUNICATION_FREQUENCY_OPTIONS,
  FIELD_LABELS,
  type OnboardingData,
  SECTION_TITLES,
} from "@/features/profile/utils";

type CommunicationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

const INFORMATION_DETAIL_LEVEL_OPTIONS = [
  { value: "brief", label: "Brief" },
  { value: "moderate", label: "Moderate" },
  { value: "detailed", label: "Detailed" },
  { value: "comprehensive", label: "Comprehensive" },
];

const HAS_BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export default function CommunicationSection({
  formData,
  isEditMode,
  updateFormData,
}: CommunicationSectionProps) {
  return (
    <Card border="light" className="space-y-6">
      <Title size="md" className="mb-6">
        {SECTION_TITLES.COMMUNICATION_PREFERENCES}
      </Title>

      {/* Communication Preference */}
      <Box>
        <Label>{FIELD_LABELS.COMMUNICATION_FREQUENCY}</Label>
        {isEditMode ? (
          <Dropdown
            value={formData.communication_frequency ?? ""}
            onChange={(value) => updateFormData("communication_frequency", value)}
            options={COMMUNICATION_FREQUENCY_OPTIONS}
            placeholder="Select..."
          />
        ) : (
          <BodyText as="div" size="sm" className="mobile-input bg-background-base">
            {formData.communication_frequency
              ? (COMMUNICATION_FREQUENCY_OPTIONS.find(
                  (option) => option.value === formData.communication_frequency
                )?.label ?? "Not specified")
              : "Not specified"}
          </BodyText>
        )}
      </Box>

      {/* Information Detail Level */}
      <Box>
        <Label>{FIELD_LABELS.INFORMATION_DETAIL_LEVEL}</Label>
        {isEditMode ? (
          <Dropdown
            value={formData.information_detail_level ?? ""}
            onChange={(value) => updateFormData("information_detail_level", value)}
            options={INFORMATION_DETAIL_LEVEL_OPTIONS}
            placeholder="Select..."
          />
        ) : (
          <BodyText as="div" size="sm" className="mobile-input bg-background-base">
            {formData.information_detail_level
              ? INFORMATION_DETAIL_LEVEL_OPTIONS.find(
                  (opt) => opt.value === formData.information_detail_level
                )?.label
              : "Not specified"}
          </BodyText>
        )}
      </Box>

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
              <BodyText as="div" size="sm" className="mobile-input bg-background-base">
                {formData.has_buyers_agent
                  ? HAS_BUYERS_AGENT_OPTIONS.find((opt) => opt.value === formData.has_buyers_agent)
                      ?.label
                  : "Not specified"}
              </BodyText>
            ),
          },
          {
            title:
              formData.has_buyers_agent === "no" ? (
                <Label>Looking for Agent?</Label>
              ) : (
                <BodyText as="div" size="sm" className="mb-2 block font-medium text-transparent">
                  &nbsp;
                </BodyText>
              ),
            content:
              formData.has_buyers_agent === "no" ? (
                <Box className="flex h-full items-center">
                  <Label
                    htmlFor="looking-buyers-agent"
                    className="text-text-primary flex cursor-pointer items-center gap-3 font-medium"
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
                              !formData.looking_for_buyers_agent
                            )
                          }
                          label="I am looking for a buyer's agent"
                        />
                        {/* Stop propagation so clicking the box doesn't also trigger the label's linked input (double-toggle) */}
                        <BodyText
                          as="span"
                          role="button"
                          tabIndex={0}
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              updateFormData(
                                "looking_for_buyers_agent",
                                !formData.looking_for_buyers_agent
                              );
                            }
                          }}
                        >
                          <OliveCheckbox
                            checked={!!formData.looking_for_buyers_agent}
                            onToggle={() =>
                              updateFormData(
                                "looking_for_buyers_agent",
                                !formData.looking_for_buyers_agent
                              )
                            }
                          />
                        </BodyText>
                      </>
                    ) : (
                      <Box
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          formData.looking_for_buyers_agent
                            ? "border-primary bg-primary"
                            : "border-border bg-background-base"
                        }`}
                      >
                        {formData.looking_for_buyers_agent && (
                          <svg
                            className="text-text-secondary h-4 w-4"
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
                      </Box>
                    )}
                    <BodyText as="span" size="sm" className="select-none">
                      I am looking for a buyer's agent
                    </BodyText>
                  </Label>
                </Box>
              ) : (
                <BodyText as="div" size="sm" className="mobile-input bg-background-base opacity-0">
                  &nbsp;
                </BodyText>
              ),
          },
        ]}
      />
    </Card>
  );
}
