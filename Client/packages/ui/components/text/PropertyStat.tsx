import React from "react";

import BodyText from "./BodyText";

export type PropertyStatSize = "sm" | "md";

export type PropertyStatProps = {
  /** Optional icon (e.g. Bed, Bath, Square from lucide-react); size/color applied automatically */
  icon?: React.ReactElement;
  /** Stat value and/or label (e.g. "3 beds", "1,500 sqft") */
  children: React.ReactNode;
  /** Size variant for card property details; sm = compact, md = default */
  size?: PropertyStatSize;
  className?: string;
};

const SIZE_STYLES: Record<PropertyStatSize, { container: string; icon: string; text: string }> = {
  sm: {
    container: "text-xs sm:text-sm text-gray-400",
    icon: "w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0 mr-1",
    text: "text-xs sm:text-sm font-normal leading-relaxed",
  },
  md: {
    container: "text-sm sm:text-base text-gray-400",
    icon: "w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0 mr-1",
    text: "text-sm sm:text-base font-normal leading-relaxed",
  },
};

/**
 * Standardized display for property stats (beds, baths, sqft, lot) on home cards.
 * Renders optional icon + text; text inherits container color so it matches the icon (gray-400).
 */
export default function PropertyStat({
  icon,
  children,
  size = "md",
  className = "",
}: PropertyStatProps) {
  const styles = SIZE_STYLES[size];
  const iconWithClass =
    icon != null
      ? React.cloneElement(icon, {
          className: [styles.icon, (icon.props as { className?: string }).className]
            .filter(Boolean)
            .join(" "),
        })
      : null;
  return (
    <div className={`flex flex-shrink-0 items-center ${styles.container} ${className}`.trim()}>
      {iconWithClass}
      <BodyText as="span" className={styles.text}>
        {children}
      </BodyText>
    </div>
  );
}
