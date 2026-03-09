import React from "react";

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
    <div className={className}>
      {/* Selected tags: brand accent, elevation, click-to-remove */}
      {selectedValues.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
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
                className="ring-olive/20 inline-flex rounded-full px-3 py-1.5 text-sm font-medium shadow-sm ring-1"
                label={`Remove ${label}`}
              >
                {label}
              </Button>
            ) : (
              <BodyText
                key={v}
                as="span"
                size="sm"
                className="bg-olive ring-olive/20 inline-flex items-center rounded-full px-3 py-1.5 font-medium text-white shadow-sm ring-1"
              >
                {label}
              </BodyText>
            );
          })}
        </div>
      )}

      {/* Unselected options as addable pills (edit mode only) */}
      {isEditMode && unselectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unselectedOptions.map((opt) => (
            <Button
              variant="outline"
              size="sm"
              type="button"
              key={opt.value}
              onClick={() => handleToggle(opt.value)}
              disabled={disabled}
              className="touch-friendly inline-flex rounded-full px-3 py-1 text-sm text-gray-600"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {/* Read-only: show nothing extra when no selection */}
      {!isEditMode && selectedValues.length === 0 && (
        <div className="mobile-input bg-gray-50 text-sm text-black/60">Not specified</div>
      )}
    </div>
  );
};

export default OptionTagInput;
