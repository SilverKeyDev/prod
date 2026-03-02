import React from "react";

import { View } from "react-native";

type TransitionProps = {
  show?: boolean;
  children?: React.ReactNode;
};

/**
 * Native: render children when show is true. No enter/leave animation (use Reanimated for full parity).
 */
export function Transition({ show = true, children }: TransitionProps) {
  if (!show) return null;
  return <View>{children}</View>;
}
