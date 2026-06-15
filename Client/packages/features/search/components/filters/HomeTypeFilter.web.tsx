import React from "react";

import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  parseHousingTypes,
  serializeHousingTypes,
} from "packages/features/profile";
import { FormFieldLabel as Label } from "packages/ui";
import { OptionTagInput } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export type HomeTypeFilterProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** When true, compact layout for inline use in filter bar */
  compact?: boolean;
};

export default function HomeTypeFilter({
  value,
  onChange,
  disabled = false,
  className = "",
  compact = false,
}: HomeTypeFilterProps): React.ReactElement {
  const selected = parseHousingTypes(value);
  return (
    <Box className={className}>
      <Label className={compact ? "!mb-1" : undefined}>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>
      <OptionTagInput
        options={HOUSING_TYPE_OPTIONS}
        value={selected}
        onChange={(arr) => onChange(serializeHousingTypes(arr))}
        isEditMode={true}
        disabled={disabled}
      />
    </Box>
  );
}
