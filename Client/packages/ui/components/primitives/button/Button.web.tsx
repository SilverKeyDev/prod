import React, { forwardRef } from "react";

import type { ButtonPropsBase } from "./Button.types";

/** RN-specific props to strip on web; map to aria-* / role instead. */
const RN_ACCESSIBILITY_KEYS = [
  "accessibilityLabel",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "accessibilityLevel",
] as const;

function omitRnAccessibilityProps<T extends Record<string, unknown>>(
  props: T,
): Omit<T, (typeof RN_ACCESSIBILITY_KEYS)[number]> {
  const { ...rest } = props;
  for (const key of RN_ACCESSIBILITY_KEYS) {
    delete (rest as Record<string, unknown>)[key];
  }
  return rest as Omit<T, (typeof RN_ACCESSIBILITY_KEYS)[number]>;
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonPropsBase & {
    /** RN-style; web maps to onClick. */
    onPress?: () => void;
  };

/**
 * Base Button primitive - one <button> for React (web).
 * Native uses Pressable (Button.native.tsx). Accepts onPress (mapped to onClick) for cross-platform API.
 * Strips RN accessibility props and maps them to web equivalents (aria-label, role).
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    type = "button",
    className = "",
    children,
    onClick,
    onPress,
    style,
    "aria-label": ariaLabel,
    accessibilityLabel,
    label,
    role,
    accessibilityRole,
    ...props
  },
  ref,
) {
  const handleClick = onClick ?? onPress;
  const domProps = omitRnAccessibilityProps(props);
  const resolvedAriaLabel = ariaLabel ?? accessibilityLabel ?? label;
  const resolvedRole = role ?? accessibilityRole;

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      onClick={handleClick}
      role={resolvedRole}
      aria-label={resolvedAriaLabel}
      style={{
        /* Do not set border: none — it overrides Tailwind border utilities (e.g. dropdown triggers). */
        cursor: "pointer",
        ...(style as React.CSSProperties),
      }}
      {...domProps}
    >
      {children}
    </button>
  );
});

export default Button;
