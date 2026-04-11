import React, { forwardRef } from "react";

import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";

import { Box } from "packages/ui/components/primitives";
import { INPUT_AUTOFILL_CLASS_NAME } from "packages/ui/styles/variants/inputVariants";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

export type TimeInputProps = {
  variant?: "default" | "mobile" | "compact";
  size?: "sm" | "md" | "lg";
  error?: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">;

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      variant = "default",
      size = "md",
      error,
      label,
      required,
      className = "",
      id,
      value,
      onChange,
      disabled,
      min,
      max,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-text-disabled transition-colors duration-150 touch-friendly mobile-input " +
      INPUT_AUTOFILL_CLASS_NAME;

    const variantStyles = {
      default:
        "border-border bg-background-surface hover:bg-accent-muted focus:ring-neutral-400 focus:border-input-variant-focus-border",
      mobile:
        "mobile-input border-border bg-background-surface hover:bg-accent-muted focus:ring-neutral-400 focus:border-input-variant-focus-border touch-friendly",
      compact:
        "border-border bg-background-surface hover:bg-accent-muted focus:ring-neutral-400 focus:border-input-variant-focus-border",
    };

    const sizeStyles = {
      sm: "h-9 px-3",
      md: "h-12 px-4",
      lg: "h-14 px-5",
    };

    const errorStyles = error
      ? "border-neutral-600 focus:border-neutral-700 focus:ring-neutral-400"
      : "";

    const inputClasses = [
      baseStyles,
      variantStyles[variant],
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
        {/* eslint-disable-next-line silverkey/no-primitive-components -- base time input */}
        <input
          ref={ref}
          type="time"
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          className={inputClasses}
          {...props}
        />
        {error != null && error !== "" && (
          <BodyText size="xs" className="text-destructive mt-1">
            {error}
          </BodyText>
        )}
      </Box>
    );
  },
);

TimeInput.displayName = "TimeInput";

export { TimeInput };
export default TimeInput;
