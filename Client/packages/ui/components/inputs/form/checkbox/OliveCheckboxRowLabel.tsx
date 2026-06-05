import type { ReactNode } from "react";

import { Pressable } from "packages/ui/components/structure/primitives";

export type OliveCheckboxRowLabelProps = {
  children: ReactNode;
  onPress: () => void;
  /** Merged after base styles (e.g. `font-normal`, `text-xs`). */
  className?: string;
};

const BASE_CLASS =
  "inline max-w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-medium leading-normal text-text-primary shadow-none outline-none ring-0 " +
  "focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

/**
 * Clickable label beside {@link OliveCheckbox}: no boxed focus ring on the text and
 * comfortable line-height so descenders (g, y, p) are not clipped (unlike `Button` ghost).
 */
export function OliveCheckboxRowLabel({
  children,
  onPress,
  className = "",
}: OliveCheckboxRowLabelProps) {
  return (
    <Pressable
      type="button"
      className={[BASE_CLASS, className].filter(Boolean).join(" ")}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}
