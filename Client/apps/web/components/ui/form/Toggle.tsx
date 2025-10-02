import React from "react";

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<
  NonNullable<ToggleProps["size"]>,
  { track: string; thumb: string }
> = {
  sm: { track: "h-5 w-9", thumb: "h-4 w-4" },
  md: { track: "h-6 w-11", thumb: "h-5 w-5" },
  lg: { track: "h-7 w-14", thumb: "h-6 w-6" },
};

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
  className = "",
  size = "md",
}) => {
  const sizes = sizeClasses[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`touch-friendly inline-flex items-center ${sizes.track} rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brown/30 ${
        checked ? "border-olive bg-olive" : "border-gray-300 bg-gray-200"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow transition-transform duration-200 ${sizes.thumb} ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
      {label && (
        <span className="ml-2 select-none text-sm font-medium text-black/80">
          {label}
        </span>
      )}
    </button>
  );
};

export default Toggle;
