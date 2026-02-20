import React from "react";

import { Link } from "packages/navigation";

export type AccessibleLinkProps = {
  /** Unified accessibility label. Maps to aria-label (web) and accessibilityLabel (RN). */
  label?: string;
} & React.ComponentProps<typeof Link>;

/**
 * Link with unified label prop for accessibility. Use instead of passing aria-label to Link
 * in feature/page code so the design system can map per platform.
 */
export default function AccessibleLink({
  label,
  ...props
}: AccessibleLinkProps) {
  return <Link aria-label={label} {...props} />;
}
