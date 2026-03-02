import React, { useEffect, useMemo } from "react";

import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type MotionAnimate = {
  opacity?: number;
};

type MotionInitial = MotionAnimate | boolean;

type MotionTransition = {
  /** Seconds (framer-motion style). */
  duration?: number;
};

export type MotionViewProps = ViewProps & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  initial?: MotionInitial;
  animate?: MotionAnimate;
  transition?: MotionTransition;
};

function resolveInitialOpacity(
  initial: MotionInitial | undefined,
  animate: MotionAnimate | undefined
) {
  if (initial && typeof initial === "object" && initial.opacity != null) return initial.opacity;
  if (initial === false) return animate?.opacity;
  return animate?.opacity;
}

/**
 * Native: Reanimated-backed View supporting a minimal subset of motion props.
 * Today we support opacity timing to keep parity with simple web fades.
 */
export function MotionView({
  children,
  className,
  style,
  initial,
  animate,
  transition,
  ...rest
}: MotionViewProps): React.ReactElement {
  const initialOpacity = useMemo(() => resolveInitialOpacity(initial, animate), [initial, animate]);
  const opacity = useSharedValue<number>(initialOpacity ?? 1);

  useEffect(() => {
    if (animate?.opacity == null) return;
    const durationMs = Math.max(0, Math.round((transition?.duration ?? 0.2) * 1000));
    opacity.value = withTiming(animate.opacity, { duration: durationMs });
  }, [animate?.opacity, transition?.duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return animate?.opacity == null ? {} : { opacity: opacity.value };
  }, [animate?.opacity]);

  return (
    <Animated.View className={className} style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
