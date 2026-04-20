import type { ReactNode } from "react";

export type ExternalAnchorProps = {
  href: string;
  children: ReactNode;
  className?: string;
  /** Screen reader label (aria-label / accessibilityLabel) when children are not descriptive */
  label?: string;
};
