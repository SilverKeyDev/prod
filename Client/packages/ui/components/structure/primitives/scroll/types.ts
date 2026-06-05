import type { ReactNode } from "react";

/**
 * Shared base props for ScrollView primitive (web and native).
 */
export type ScrollViewPropsBase = {
  children?: ReactNode;
  style?: Record<string, unknown>;
  horizontal?: boolean;
};
