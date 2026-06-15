import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button } from "@/components/ui";

import { FORM_EMPTY_VALUE_LABEL } from "./constants";
import { TagChip } from "./TagChip.web";

export type OptionTagOption = { value: string; label: string };

export type OptionTagInputProps = {
  options: OptionTagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  isEditMode?: boolean;
  disabled?: boolean;
  className?: string;
  emptyLabel?: string;
};

const OptionTagInput: React.FC<OptionTagInputProps> = ({
  options,
  value = [],
  onChange,
  isEditMode = true,
  disabled = false,
  className = "",
  emptyLabel = FORM_EMPTY_VALUE_LABEL,
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
      {selectedValues.length > 0 && (
        <Box className="mb-4">
          {isEditMode && (
            <BodyText as="span" size="xs" className="text-text-secondary mb-2 block font-medium">
              Your selections ({selectedValues.length})
            </BodyText>
          )}
          <Box className="flex flex-wrap gap-2">
            {selectedValues.map((v) => {
              const option = options.find((o) => o.value === v);
              const label = option?.label ?? v;
              const canRemove = isEditMode && !disabled;
              return (
                <TagChip
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

      {isEditMode && unselectedOptions.length > 0 && (
        <Box>
          <BodyText as="span" size="xs" className="text-text-secondary mb-2 block font-medium">
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
                className="border-border bg-background-surface text-text-secondary hover:text-text-primary inline-flex touch-manipulation items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:border-neutral-400 hover:bg-neutral-100"
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

      {!isEditMode && selectedValues.length === 0 && (
        <Box className="border-border bg-background-base text-text-secondary rounded-lg border px-4 py-3 text-sm">
          {emptyLabel}
        </Box>
      )}
    </Box>
  );
};

export default OptionTagInput;
