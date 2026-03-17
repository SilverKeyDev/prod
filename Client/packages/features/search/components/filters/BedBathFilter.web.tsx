import React from "react";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import BudgetRangeSlider from "@/features/profile/components/settings/inputs/BudgetRangeSlider";
const BED_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const BATH_TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const formatCount = (v: number) => (v === 0 ? "Any" : String(v));

export type BedBathFilterProps = {
  minBeds: number;
  maxBeds: number;
  minBaths: number;
  maxBaths: number;
  onMinBedsChange: (value: number) => void;
  onMaxBedsChange: (value: number) => void;
  onMinBathsChange: (value: number) => void;
  onMaxBathsChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  /** When true, compact layout for inline use in filter bar */
  compact?: boolean;
};

export default function BedBathFilter({
  minBeds,
  maxBeds,
  minBaths,
  maxBaths,
  onMinBedsChange,
  onMaxBedsChange,
  onMinBathsChange,
  onMaxBathsChange,
  disabled = false,
  className = "",
  compact = false,
}: BedBathFilterProps): React.ReactElement {
  const { t } = useLocalization();
  const safeMinBeds = minBeds ?? 0;
  const safeMaxBeds = Math.max(safeMinBeds, maxBeds ?? 8);
  const safeMinBaths = minBaths ?? 0;
  const safeMaxBaths = Math.max(safeMinBaths, maxBaths ?? 8);

  const handleBedsChange = (minVal: number, maxVal: number) => {
    onMinBedsChange(minVal);
    onMaxBedsChange(maxVal);
  };

  const handleBathsChange = (minVal: number, maxVal: number) => {
    onMinBathsChange(minVal);
    onMaxBathsChange(maxVal);
  };

  return (
    <Box className={`${compact ? "space-y-2" : "space-y-4"} ${className}`}>
      <Box className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? "gap-2" : "gap-4"}`}>
        <Box className="touch-friendly">
          <BodyText
            as="div"
            size="xs"
            className={`${compact ? "mb-0.5" : "mb-1"} text-text-secondary`}
          >
            {t("search.beds")}
          </BodyText>
          <BudgetRangeSlider
            tickValues={BED_TICKS}
            minValue={safeMinBeds}
            maxValue={safeMaxBeds}
            onChange={handleBedsChange}
            formatValue={formatCount}
            formatPrefix=""
            disabled={disabled}
            minGap={0}
          />
        </Box>
        <Box className="touch-friendly">
          <BodyText as="div" size="xs" className="text-text-secondary mb-1">
            {t("search.baths")}
          </BodyText>
          <BudgetRangeSlider
            tickValues={BATH_TICKS}
            minValue={safeMinBaths}
            maxValue={safeMaxBaths}
            onChange={handleBathsChange}
            formatValue={formatCount}
            formatPrefix=""
            disabled={disabled}
            minGap={0}
          />
        </Box>
      </Box>
    </Box>
  );
}
