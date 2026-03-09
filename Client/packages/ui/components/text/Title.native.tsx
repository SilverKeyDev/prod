import React from "react";

import { Text } from "packages/ui/components/primitives";

export type TitleSize = "sm" | "md" | "lg" | "xl";

export type TitleProps = {
  children: React.ReactNode;
  size?: TitleSize;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  style?: Record<string, unknown>;
  title?: string;
};

const sizeClasses: Record<TitleSize, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

/**
 * Native Title — uses RN Text only. Same API as web Title; "as" and "title" are ignored.
 */
export default function Title({
  children,
  size = "md",
  className = "",
  style,
  as: _as,
  title: _title,
}: TitleProps) {
  const baseClasses = "font-serif text-black";
  const sizeClass = sizeClasses[size];
  const combinedClasses = [baseClasses, sizeClass, className].filter(Boolean).join(" ");

  return (
    <Text className={combinedClasses} style={style}>
      {children}
    </Text>
  );
}
