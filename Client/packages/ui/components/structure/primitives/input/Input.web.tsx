import React, { forwardRef } from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onValueChange?: (text: string) => void;
  /** Unified a11y: maps to aria-label. Prefer over aria-label in feature code. */
  label?: string;
  /** React Native-only; accepted for API parity but omitted from DOM on web. */
  keyboardType?: string;
};

/**
 * Base Input primitive - native <input> for web.
 * Native uses TextInput (Input.native.tsx). Use onValueChange for unified change handling.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className = "",
    onChange,
    onValueChange,
    label,
    "aria-label": ariaLabel,
    keyboardType: _keyboardType,
    ...props
  },
  ref
) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onValueChange?.(e.currentTarget.value);
  };

  return (
    <input
      ref={ref}
      type="text"
      className={className}
      onChange={handleChange}
      aria-label={label ?? ariaLabel}
      {...props}
    />
  );
});

export default Input;
