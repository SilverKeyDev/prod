import React from "react";

import { ChevronDown } from "lucide-react";

export type DropdownChevronProps = {
  /** When true, chevron rotates 180° (pointing up); when false, points down */
  open: boolean;
  /** Tailwind size classes (e.g. "h-4 w-4"). Default: "h-4 w-4" */
  className?: string;
};

/**
 * Chevron icon that animates smoothly between down (closed) and up (open).
 * Matches the pattern used in Dropdown, ClientSelector, FavoriteHomesDropdown.
 */
export default function DropdownChevron({
  open,
  className = "h-4 w-4",
}: DropdownChevronProps): React.ReactElement {
  return (
    <ChevronDown
      className={`shrink-0 transition-transform duration-200 ease-in-out ${
        open ? "rotate-180" : ""
      } ${className}`}
      aria-hidden
    />
  );
}
