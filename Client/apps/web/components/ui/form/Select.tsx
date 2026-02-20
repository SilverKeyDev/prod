import React, { forwardRef } from "react";

import Label from "@ui/text/Label.web";

import { getSharedInputTextStyles } from "packages/utils/core/ui/inputStyles";

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
    ref,
  ) => {
    const baseStyles =
      "w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 transition-colors duration-150 touch-friendly mobile-input appearance-none bg-white";

    const borderStyles =
      "border-beige hover:border-brown/50 focus:ring-brown/20 focus:border-brown";

    const errorStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
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
      <div className="w-full">
        {label != null && (
          <Label htmlFor={id} required={required} className="mb-2">
            {label}
          </Label>
        )}
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
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
export default Select;
