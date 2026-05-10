import React from "react";

import BodyText from "@ui/text/BodyText";

import { Pressable } from "packages/ui/components/primitives";

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Associate with a `<Label htmlFor={id}>` for accessibility (WCAG / eslint jsx-a11y). */
  id?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<ToggleProps["size"]>, { track: string; thumb: string }> = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5" },
  lg: { track: "h-7 w-14", thumb: "h-6 w-6" },
};

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  id,
  disabled,
  className = "",
  size = "md",
}) => {
  const sizes = sizeClasses[size];
  return (
    <Pressable
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onPress={() => !disabled && onChange(!checked)}
      className={`touch-friendly inline-flex items-center ${sizes.track} focus:ring-accent-muted rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 ${
        checked ? "border-primary bg-primary" : "border-border bg-neutral-200"
      } ${disabled ? "bg-disabled text-text-disabled cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {/* eslint-disable-next-line silverkey/no-primitive-components -- toggle thumb */}
      <span
        className={`inline-block transform rounded-full bg-white shadow transition-transform duration-200 ${sizes.thumb} ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
      {label && (
        <BodyText as="span" className="text-text-primary ml-2 select-none text-sm font-medium">
          {label}
        </BodyText>
      )}
    </Pressable>
  );
};

export default Toggle;
