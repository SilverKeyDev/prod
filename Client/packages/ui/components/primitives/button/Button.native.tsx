import React, { forwardRef } from "react";

import { Pressable, type PressableProps } from "react-native";

import type { ButtonPropsBase } from "./Button.types";

export type ButtonProps = PressableProps & ButtonPropsBase;

/**
 * Base Button primitive — Pressable for React Native.
 * Web uses button (Button.web.tsx). Accepts onPress for cross-platform API.
 */
const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(function Button(
  { children, className, style, label, accessibilityLabel, ...props },
  ref
) {
  return (
    <Pressable
      ref={ref}
      className={className}
      style={style}
      accessibilityLabel={accessibilityLabel ?? label}
      {...props}
    >
      {children}
    </Pressable>
  );
});

export default Button;
