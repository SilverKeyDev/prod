import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
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
      {/* Selected tags: brand accent, elevation, click-to-remove */}
      {selectedValues.length > 0 && (
        <Box className="mb-3 flex flex-wrap gap-2">
          {selectedValues.map((v) => {
            const option = options.find((o) => o.value === v);
            const label = option?.label ?? v;
            const isInteractive = isEditMode && !disabled;
            return isInteractive ? (
              <Button
                key={v}
                variant="primary"
                size="sm"
                type="button"
                onClick={() => handleToggle(v)}
                className="ring-accent-muted inline-flex rounded-full px-3 py-1.5 text-sm font-medium shadow-sm ring-1"
                label={`Remove ${label}`}
              >
                <span className="mx-1">{label}</span>
              </Button>
            ) : (
              <BodyText
                key={v}
                as="span"
                size="sm"
                className="bg-primary ring-accent-muted inline-flex items-center rounded-full px-3 py-1.5 font-medium text-white shadow-sm ring-1"
              >
                <span className="mx-1">{label}</span>
              </BodyText>
            );
          })}
        </Box>
      )}

      {/* Unselected options as cards with dotted outline (edit mode only) */}
      {isEditMode && unselectedOptions.length > 0 && (
        <Box className="flex flex-wrap gap-3">
          {unselectedOptions.map((opt) => (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              disabled={disabled}
              className="touch-friendly min-h-[2.75rem] min-w-[5rem] rounded-lg border-2 border-dotted border-border bg-transparent text-text-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-accent hover:bg-background-surface hover:text-text-primary"
              label={`Select ${opt.label}`}
            >
              <span className="mx-1">{opt.label}</span>
            </Button>
          ))}
        </Box>
      )}

      {/* Read-only: show nothing extra when no selection */}
      {!isEditMode && selectedValues.length === 0 && (
        <Box className="mobile-input bg-background-base text-text-secondary text-sm">
          Not specified
        </Box>
      )}
    </Box>
  );
};

export default OptionTagInput;
