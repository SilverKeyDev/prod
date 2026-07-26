import React, { forwardRef } from "react";

import type { WebStyleInput } from "packages/ui/utils/flattenWebStyle";
import { flattenWebStyle } from "packages/ui/utils/flattenWebStyle";

import type { ButtonPropsBase } from "./Button.types";

/** RN-specific props to strip on web; map to aria-* / role / data-testid / id instead. */
const RN_PROP_KEYS = [
  "accessibilityLabel",
  "accessibilityRole",
  "accessibilityState",
  "accessibilityHint",
  "accessibilityLevel",
  "testID",
  "nativeID",
] as const;

function omitRnProps<T extends Record<string, unknown>>(
  props: T
): Omit<T, (typeof RN_PROP_KEYS)[number]> {
  const { ...rest } = props;
  for (const key of RN_PROP_KEYS) {
    delete (rest as Record<string, unknown>)[key];
  }
  return rest as Omit<T, (typeof RN_PROP_KEYS)[number]>;
}

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> &
  ButtonPropsBase & {
    /** RN-style; web maps to onClick. */
    onPress?: () => void;
    /** RN-style arrays are flattened before applying to the DOM. */
    style?: WebStyleInput;
    /** RN-style; web maps to data-testid. */
    testID?: string;
    /** RN-style; web maps to id when id is unset. */
    nativeID?: string;
  };

/**
 * Base Button primitive - one <button> for React (web).
 * Native uses Pressable (Button.native.tsx). Accepts onPress (mapped to onClick) for cross-platform API.
 * Strips RN props and maps them to web equivalents (aria-label, role, data-testid, id).
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
    testID,
    nativeID,
    "data-testid": dataTestId,
    id,
    ...props
  },
  ref
) {
  const handleClick = onClick ?? onPress;
  const domProps = omitRnProps(props);
  const resolvedAriaLabel = ariaLabel ?? accessibilityLabel ?? label;
  const resolvedRole = role ?? accessibilityRole;
  const resolvedTestId = dataTestId ?? testID;
  const resolvedId = id ?? nativeID;

  return (
    <button
      ref={ref}
      id={resolvedId}
      type={type}
      className={className}
      role={resolvedRole}
      aria-label={resolvedAriaLabel}
      data-testid={resolvedTestId}
      style={{
        /* Do not set border: none — it overrides Tailwind border utilities (e.g. dropdown triggers). */
        cursor: "pointer",
        ...flattenWebStyle(style),
      }}
      {...domProps}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

export default Button;
