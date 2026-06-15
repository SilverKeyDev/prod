import type { ReactNode } from "react";

/**
 * Shared base props for Box primitive (web and native).
 * Web extends with HTML div attributes; native extends with ViewProps.
 */
export type BoxPropsBase = {
  children?: ReactNode;
  style?: Record<string, unknown>;
};
