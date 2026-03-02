import type { ReactNode } from "react";

/**
 * Shared base props for Button/Pressable primitive (web and native).
 */
export type ButtonPropsBase = {
  children?: ReactNode;
  style?: Record<string, unknown>;
  onPress?: () => void;
  disabled?: boolean;
};
