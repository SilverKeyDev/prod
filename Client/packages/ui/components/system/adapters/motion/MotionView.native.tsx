import React, { useEffect, useMemo } from "react";

import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import type { MotionOpacityAnimate, MotionTransition, MotionViewInitial } from "./motionTypes";

export type MotionViewProps = ViewProps & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  initial?: MotionViewInitial;
  animate?: MotionOpacityAnimate;
  transition?: MotionTransition;
};

function resolveInitialOpacity(
  initial: MotionViewInitial | undefined,
  animate: MotionOpacityAnimate | undefined
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

  // Do not read React props (e.g. animate?.opacity) inside the worklet or in deps;
  // that can cause the worklet to run on the JS thread during render and trigger
  // "Reading from value during component render". Only read the shared value here.
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View className={className} style={[style, animatedStyle]} {...rest}>
      {children}
    </Animated.View>
  );
}
