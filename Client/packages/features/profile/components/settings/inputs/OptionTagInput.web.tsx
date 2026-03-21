import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import { ProfileTagChip } from "@/features/profile/components/ProfileTagChip";
import { PROFILE_NOT_SPECIFIED_LABEL } from "@/features/profile/utils";

export type OptionTagOption = { value: string; label: string };

type OptionTagInputProps = {
  options: OptionTagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  isEditMode?: boolean;
  disabled?: boolean;
  className?: string;
};

const OptionTagInput: React.FC<OptionTagInputProps> = ({
  options,
  value = [],
  onChange,
  isEditMode = true,
  disabled = false,
  className = "",
}) => {
  const handleToggle = (optionValue: string) => {
    if (disabled || !isEditMode) return;
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedValues = value;
  const unselectedOptions = options.filter((opt) => !selectedValues.includes(opt.value));

  return (
    <Box className={className}>
      {/* Selected: chip row with label + dedicated remove (edit) or label only (read-only) */}
      {selectedValues.length > 0 && (
        <Box className="mb-4">
          {isEditMode && (
            <BodyText
              as="span"
              size="xs"
              className="text-text-secondary mb-2 block font-medium"
            >
              Your selections ({selectedValues.length})
            </BodyText>
          )}
          <Box className="flex flex-wrap gap-2">
            {selectedValues.map((v) => {
              const option = options.find((o) => o.value === v);
              const label = option?.label ?? v;
              const canRemove = isEditMode && !disabled;
              return (
                <ProfileTagChip
                  key={v}
                  label={label}
                  onRemove={canRemove ? () => handleToggle(v) : undefined}
                  disabled={disabled}
                  removeLabel={`Remove ${label}`}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* Unselected: clean add-option tiles (edit mode only) */}
      {isEditMode && unselectedOptions.length > 0 && (
        <Box>
          <BodyText
            as="span"
            size="xs"
            className="text-text-secondary mb-2 block font-medium"
          >
            Add more
          </BodyText>
          <Box className="flex flex-wrap gap-2">
            {unselectedOptions.map((opt) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                disabled={disabled}
                className="border-border bg-background-surface text-text-secondary hover:border-brand-accent/50 hover:bg-brand-accent/5 hover:text-text-primary inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors touch-manipulation"
                label={`Select ${opt.label}`}
              >
                <Icon name="plus" className="h-3.5 w-3.5 flex-shrink-0" />
                <BodyText as="span" size="sm">
                  {opt.label}
                </BodyText>
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {/* Read-only empty state */}
      {!isEditMode && selectedValues.length === 0 && (
        <Box className="border-border bg-background-base text-text-secondary rounded-lg border px-4 py-3 text-sm">
          {PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      )}
    </Box>
  );
};

export default OptionTagInput;
