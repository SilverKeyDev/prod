import React from "react";

import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import Card from "@/components/layout/Card.web";
import { Dropdown, Input, Title } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import PriceRangeSlider from "@/features/profile/components/settings/inputs/PriceRangeSlider";
import { CREDIT_SCORE_OPTIONS, FIELD_LABELS, type OnboardingData } from "@/features/profile/utils";

type FinancialSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

export default function FinancialSection({
  formData,
  isEditMode,
  updateFormData,
}: FinancialSectionProps) {
  return (
    <Card border="light" className="mb-64 space-y-6">
      <Title size="md" className="mb-6">
        Financial Information
      </Title>

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="start"
        items={[
          {
            title: <Label>Gross Annual Income (after debts)</Label>,
            content: isEditMode ? (
              <PriceRangeSlider
                tickValues={[50000, 100000, 200000, 300000, 500000, 750000, 1000000]}
                value={formData.gross_income ?? 100000}
                onChange={(value) => {
                  // Round to nearest $5,000 increment
                  const roundedValue = Math.round(value / 5000) * 5000;
                  updateFormData("gross_income", roundedValue);
                }}
                formatPrefix="$"
                className="mt-2"
              />
            ) : (
              <Box className="mobile-input bg-background-base text-left">
                {formData.gross_income
                  ? `$${formData.gross_income.toLocaleString()}`
                  : "Not specified"}
              </Box>
            ),
          },
          {
            title: <Label>Down Payment</Label>,
            content: isEditMode ? (
              <PriceRangeSlider
                tickValues={[100000, 250000, 500000, 1000000, 2000000, 5000000]}
                value={formData.down_payment ?? 100000}
                onChange={(value) => {
                  // Round to nearest $5,000 increment
                  const roundedValue = Math.round(value / 5000) * 5000;
                  updateFormData("down_payment", roundedValue);
                }}
                formatPrefix="$"
                className="mt-2"
              />
            ) : (
              <Box className="mobile-input bg-background-base text-left">
                {formData.down_payment
                  ? `$${formData.down_payment.toLocaleString()}`
                  : "Not specified"}
              </Box>
            ),
          },
        ]}
      />

      <AlignedRow
        breakIntoRows="md"
        gap="lg"
        justify="evenly"
        items={[
          {
            title: <Label>Ideal Zip Code</Label>,
            content: isEditMode ? (
              <Input
                type="text"
                value={formData.ideal_zip_code ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFormData("ideal_zip_code", e.target.value)
                }
                placeholder="Enter zip code"
              />
            ) : (
              <Box className="mobile-input bg-background-base">
                {formData.ideal_zip_code ?? "Not specified"}
              </Box>
            ),
          },
          {
            title: <Label>{FIELD_LABELS.CREDIT_SCORE_RANGE}</Label>,
            content: isEditMode ? (
              <Dropdown
                value={formData.credit_score_range ?? ""}
                onChange={(value) => updateFormData("credit_score_range", value)}
                options={CREDIT_SCORE_OPTIONS}
                placeholder="Select..."
              />
            ) : (
              <Box className="mobile-input bg-background-base">
                {formData.credit_score_range
                  ? (CREDIT_SCORE_OPTIONS.find(
                      (option) => option.value === formData.credit_score_range
                    )?.label ?? "Not specified")
                  : "Not specified"}
              </Box>
            ),
          },
        ]}
      />
    </Card>
  );
}
