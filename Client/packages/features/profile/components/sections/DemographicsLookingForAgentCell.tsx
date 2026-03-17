import React from "react";

import { Box } from "packages/ui/components/primitives";

import { AccessibleCheckboxInput, BodyText, Label, OliveCheckbox } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
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
    return (
      <BodyText as="div" size="sm" className="mobile-input bg-background-base opacity-0">
        &nbsp;
      </BodyText>
    );
  }

  const toggle = () =>
    updateFormData("looking_for_buyers_agent", !formData.looking_for_buyers_agent);

  return (
    <Box className="flex h-full items-center">
      <Label
        htmlFor="looking-buyers-agent"
        className="text-text-primary flex cursor-pointer items-center gap-3 text-sm font-medium"
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
                  toggle();
                }
              }}
            >
              <OliveCheckbox checked={!!formData.looking_for_buyers_agent} onToggle={toggle} />
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
              <svg className="text-text-secondary h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Box>
        )}
        <BodyText as="span" className="select-none">
          I am looking for a buyer's agent
        </BodyText>
      </Label>
    </Box>
  );
}
