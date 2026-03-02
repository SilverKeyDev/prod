import React, { forwardRef } from "react";

import { spacing } from "packages/design-tokens";

import type { ButtonPropsBase } from "./Button.types";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonPropsBase & {
    /** RN-style; web maps to onClick. */
    onPress?: () => void;
  };

/**
 * Base Button primitive — one <button> for React (web).
 * Native uses Pressable (Button.native.tsx). Accepts onPress (mapped to onClick) for cross-platform API.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = "button", className = "", children, onClick, onPress, style, ...props },
  ref
) {
  const handleClick = onClick ?? onPress;
  return (
    <button
      ref={ref}
      type={type}
      className={className}
      onClick={handleClick}
      style={{
        background: "none",
        border: "none",
        padding: spacing(0),
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
