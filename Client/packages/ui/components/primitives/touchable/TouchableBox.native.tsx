/**
 * Native implementation using Pressable.
 * Applies hitSlop from constants. Uses pressed state for interactionStyles.pressed.
 */

import React, { forwardRef } from "react";

import { Pressable, View } from "react-native";

import { resolveHitSlop } from "packages/ui/constants/touch";

import type { TouchableBoxProps } from "./TouchableBox.types";
import { TOUCHABLE_DISABLED_CLASSES } from "./touchableBoxStyles";

/**
 * Native implementation using React Native Pressable
 */
const TouchableBox = forwardRef<React.ElementRef<typeof Pressable>, TouchableBoxProps>(
  function TouchableBox(
    {
      children,
      onPress,
      onPressIn,
      onPressOut,
      onLongPress,
      disabled,
      label,
      className = "",
      style,
      interactionStyles,
      hitSlop: hitSlopProp,
      ...props
    },
    ref
  ) {
    const isInteractive = onPress || onPressIn || onPressOut || onLongPress;

    const resolvedHitSlop = hitSlopProp != null ? resolveHitSlop(hitSlopProp) : undefined;

    const pressedPrefix = (s: string) => (s.startsWith("active:") ? s : `active:${s}`);

    const baseClasses = [
      disabled ? TOUCHABLE_DISABLED_CLASSES : "",
      interactionStyles?.base ?? "",
      interactionStyles?.pressed ? pressedPrefix(interactionStyles.pressed) : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (!isInteractive) {
      return (
        <View className={baseClasses} style={style} {...props}>
          {children}
        </View>
      );
    }

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityLabel={label}
        hitSlop={resolvedHitSlop}
        className={baseClasses}
        style={style}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
);

export default TouchableBox;
