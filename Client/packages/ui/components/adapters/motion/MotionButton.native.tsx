import React, { useCallback, useEffect, useMemo } from "react";

import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type MotionAnimate = {
  opacity?: number;
  scale?: number;
};

type MotionTransition = {
  /** Seconds (framer-motion style). */
  duration?: number;
};

export type MotionButtonProps = Omit<PressableProps, "onPress"> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  onClick?: () => void;
  title?: string;
  accessibilityLabel?: string;
  animate?: MotionAnimate;
  whileTap?: MotionAnimate;
  transition?: MotionTransition;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function resolveInitial(animate: MotionAnimate | undefined) {
  return {
    opacity: animate?.opacity ?? 1,
    scale: animate?.scale ?? 1,
  };
}

/** Native: Pressable with minimal motion subset (opacity/scale + whileTap). */
export function MotionButton({
  children,
  className,
  style,
  onClick,
  title,
  accessibilityLabel,
  animate,
  whileTap,
  transition,
  onPressIn,
  onPressOut,
  ...rest
}: MotionButtonProps): React.ReactElement {
  const initial = useMemo(() => resolveInitial(animate), [animate]);
  const opacity = useSharedValue<number>(initial.opacity);
  const scale = useSharedValue<number>(initial.scale);

  useEffect(() => {
    const durationMs = Math.max(0, Math.round((transition?.duration ?? 0.15) * 1000));
    if (animate?.opacity != null)
      opacity.value = withTiming(animate.opacity, { duration: durationMs });
    if (animate?.scale != null) scale.value = withTiming(animate.scale, { duration: durationMs });
  }, [animate?.opacity, animate?.scale, transition?.duration, opacity, scale]);

  // Worklet must only read shared values; no React props/state in body or deps
  // to avoid Reanimated running on JS thread during render (strict-mode warning).
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const durationMs = Math.max(0, Math.round((transition?.duration ?? 0.15) * 1000));
  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      onPressIn?.(e);
      if (!whileTap) return;
      if (whileTap.opacity != null)
        opacity.value = withTiming(whileTap.opacity, { duration: durationMs });
      if (whileTap.scale != null)
        scale.value = withTiming(whileTap.scale, { duration: durationMs });
    },
    [durationMs, onPressIn, opacity, scale, whileTap]
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      onPressOut?.(e);
      if (animate?.opacity != null)
        opacity.value = withTiming(animate.opacity, { duration: durationMs });
      else opacity.value = withTiming(1, { duration: durationMs });
      if (animate?.scale != null) scale.value = withTiming(animate.scale, { duration: durationMs });
      else scale.value = withTiming(1, { duration: durationMs });
    },
    [animate?.opacity, animate?.scale, durationMs, onPressOut, opacity, scale]
  );

  return (
    <AnimatedPressable
      onPress={onClick}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel ?? title}
      className={className}
      style={[style, animatedStyle]}
      {...rest}
    >
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </AnimatedPressable>
  );
}
