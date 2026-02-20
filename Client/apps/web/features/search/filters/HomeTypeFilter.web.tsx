import React from "react";

import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  parseHousingTypes,
  serializeHousingTypes,
} from "packages/utils/domain/profile";

import Label from "@/features/profile/components/Label.web";
import OptionTagInput from "@/features/profile/components/OptionTagInput.web";

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
    <div className={className}>
      <Label className={compact ? "!mb-1" : undefined}>
        {FIELD_LABELS.PREFERRED_HOUSING_TYPE}
      </Label>
      <OptionTagInput
        options={HOUSING_TYPE_OPTIONS}
        value={selected}
        onChange={(arr) => onChange(serializeHousingTypes(arr))}
        isEditMode={true}
        disabled={disabled}
      />
    </div>
  );
}
