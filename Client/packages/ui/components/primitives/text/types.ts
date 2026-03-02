import type { ReactNode } from "react";

/**
 * Shared base props for Text primitive (web and native).
 */
export type TextPropsBase = {
  children?: ReactNode;
  style?: Record<string, unknown>;
  /** Max lines (native); web maps to line-clamp or title. */
  numberOfLines?: number;
};

export type TextProps = TextPropsBase;
