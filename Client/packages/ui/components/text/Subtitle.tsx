import React from "react";

import { Text } from "packages/ui/components/primitives";

export type SubtitleSize = "xs" | "sm" | "md" | "lg";

export type SubtitleProps = {
  children: React.ReactNode;
  size?: SubtitleSize;
  className?: string;
  muted?: boolean;
};

const sizeClasses: Record<SubtitleSize, string> = {
  xs: "text-xs sm:text-sm",
  sm: "text-sm sm:text-base",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
};

/**
 * Shared Subtitle — uses Text primitive. Same API on web and native.
 */
export default function Subtitle({
  children,
  size = "sm",
  className = "",
  muted = false,
}: SubtitleProps) {
  const baseClasses = "font-normal";
  const colorClass = muted ? "text-gray-600" : "text-black";
  const sizeClass = sizeClasses[size];
  const combinedClasses = [baseClasses, colorClass, sizeClass, className].filter(Boolean).join(" ");

  return (
    <Text as="p" className={combinedClasses}>
      {children}
    </Text>
  );
}
