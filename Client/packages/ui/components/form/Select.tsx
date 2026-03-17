import React, { forwardRef } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { Box } from "packages/ui/components/primitives";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: "h-9 px-3",
  md: "h-12 px-4",
  lg: "h-14 px-5",
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder,
      label,
      required,
      error,
      disabled,
      id,
      size = "md",
      className = "",
    },
    ref
  ) => {
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input appearance-none bg-background-surface";

    const borderStyles =
      "border-border hover:border-border focus:ring-accent-muted focus:border-primary";

    const errorStyles = error
      ? "border-destructive focus:border-destructive focus:ring-destructive"
      : "";

    const selectClasses = [
      baseStyles,
      borderStyles,
      sizeStyles[size],
      getSharedInputTextStyles(),
      errorStyles,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Box className="w-full">
        {label != null && (
          <Label htmlFor={id} required={required} className="mb-2">
            {label}
          </Label>
        )}
        {/* eslint-disable-next-line silverkey/no-primitive-components -- base select */}
        <select
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={selectClasses}
          aria-invalid={error != null && error !== ""}
        >
          {placeholder != null && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error != null && error !== "" && (
          <BodyText size="xs" className="text-destructive mt-1">
            {error}
          </BodyText>
        )}
      </Box>
    );
  }
);

Select.displayName = "Select";

export { Select };
export default Select;
