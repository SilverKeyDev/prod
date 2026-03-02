import React from "react";

import BodyText from "./BodyText";

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

export default function Subtitle({
  children,
  size = "sm",
  className = "",
  muted = false,
}: SubtitleProps) {
  const baseClasses = "font-normal";
  const colorClass = muted ? "text-gray-600" : "text-black";
  const sizeClass = sizeClasses[size];

  return (
    <BodyText as="p" className={`${baseClasses} ${colorClass} ${sizeClass} ${className}`}>
      {children}
    </BodyText>
  );
}
