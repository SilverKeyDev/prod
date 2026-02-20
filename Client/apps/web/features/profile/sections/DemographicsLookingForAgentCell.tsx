import React from "react";

import type { OnboardingData } from "packages/utils/domain/profile";

import {
  AccessibleCheckboxInput,
  BodyText,
  Label,
  OliveCheckbox,
} from "@/components/ui/index.web";

type DemographicsLookingForAgentCellProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

/**
 * Second column of Buyer's Agent row: "Looking for Agent?" checkbox or spacer.
 * Extracted to reduce complexity in DemographicsSection.
 */
export function DemographicsLookingForAgentCell({
  formData,
  isEditMode,
  updateFormData,
}: DemographicsLookingForAgentCellProps) {
  if (formData.has_buyers_agent !== "no") {
    return <div className="mobile-input bg-gray-50 opacity-0">&nbsp;</div>;
  }

  const toggle = () =>
    updateFormData(
      "looking_for_buyers_agent",
      !formData.looking_for_buyers_agent,
    );

  return (
    <div className="flex h-full items-center">
      <Label
        htmlFor="looking-buyers-agent"
        className="flex cursor-pointer items-center gap-3 text-sm font-medium text-black"
      >
        {isEditMode ? (
          <>
            <AccessibleCheckboxInput
              id="looking-buyers-agent"
              className="sr-only"
              checked={!!formData.looking_for_buyers_agent}
              onChange={toggle}
              label="I am looking for a buyer's agent"
            />
            <OliveCheckbox
              checked={!!formData.looking_for_buyers_agent}
              onToggle={toggle}
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
        <BodyText as="span" className="select-none">
          I am looking for a buyer's agent
        </BodyText>
      </Label>
    </div>
  );
}
