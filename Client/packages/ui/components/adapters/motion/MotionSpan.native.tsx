import React from "react";

import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

export type MotionSpanProps = ViewProps & {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** Native: Animated.View wrapper (motion span equivalent). */
export function MotionSpan({
  children,
  className,
  style,
  ...rest
}: MotionSpanProps): React.ReactElement {
  return (
    <Animated.View className={className} style={style} {...rest}>
      {children}
    </Animated.View>
  );
}
