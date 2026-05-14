import type { ReactNode } from "react";

export type HideTextBelowBreakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

export function buildButtonTextVisibilityClass(
  children: ReactNode,
  hideTextBelow: HideTextBelowBreakpoint | undefined
): string {
  if (!children || !hideTextBelow) return "";
  const map: Record<HideTextBelowBreakpoint, string> = {
    sm: "hidden sm:inline-flex flex-row",
    md: "hidden md:inline-flex flex-row",
    lg: "hidden lg:inline-flex flex-row",
    xl: "hidden xl:inline-flex flex-row",
    "2xl": "hidden 2xl:inline-flex flex-row",
  };
  return map[hideTextBelow];
}
