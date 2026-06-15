import React from "react";

import { useLocalization } from "packages/contexts";
import { BudgetSlider } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { formatCompactNumber } from "packages/utils";

import { BodyText } from "@/components/ui";
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 2_000_000;
const TICK_VALUES = [
  0, 100_000, 250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
  10_000_000,
];

export type PriceRangeFilterProps = {
  minValue: number;
  maxValue: number;
  onChange: (minValue: number, maxValue: number) => void;
  disabled?: boolean;
  className?: string;
  /** When true, compact layout for inline use in filter bar */
  compact?: boolean;
};

export default function PriceRangeFilter({
  minValue,
  maxValue,
  onChange,
  disabled = false,
  className = "",
  compact = false,
}: PriceRangeFilterProps): React.ReactElement {
  const { t } = useLocalization();
  const safeMin = minValue ?? DEFAULT_MIN;
  const safeMax = maxValue ?? DEFAULT_MAX;

  const handleChange = (newMin: number, newMax: number) => {
    const roundedMin = Math.round(newMin / 1000) * 1000;
    const roundedMax = Math.round(newMax / 1000) * 1000;
    onChange(roundedMin, roundedMax);
  };

  return (
    <Box className={className}>
      <BodyText
        size="sm"
        className={`text-text-secondary font-medium ${compact ? "mb-1" : "mb-2"}`}
      >
        {t("search.price_range")}
      </BodyText>
      <BudgetSlider
        tickValues={TICK_VALUES}
        minValue={safeMin}
        maxValue={safeMax}
        onChange={handleChange}
        formatPrefix="$"
        formatValue={(v) => `$${formatCompactNumber(v)}`}
        disabled={disabled}
        minGap={25000}
        showTextHeader={!compact}
      />
    </Box>
  );
}
