import React from "react";

import { Text } from "packages/ui/components/primitives";

export type TitleSize = "sm" | "md" | "lg" | "xl";

export type TitleProps = {
  children: React.ReactNode;
  size?: TitleSize;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  style?: React.CSSProperties | Record<string, unknown>;
  title?: string;
};

const sizeClasses: Record<TitleSize, string> = {
  sm: "text-lg sm:text-xl",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
  xl: "text-3xl sm:text-4xl md:text-5xl",
};

/**
 * Shared Title — uses Text primitive. Web keeps semantic `as`; native uses Text.
 */
export default function Title({
  children,
  size = "md",
  className = "",
  as,
  style,
  title,
}: TitleProps) {
  const baseClasses = "font-serif text-black";
  const sizeClass = sizeClasses[size];
  const combinedClasses = [baseClasses, sizeClass, className].filter(Boolean).join(" ");

  return (
    <Text as={as ?? "h2"} className={combinedClasses} style={style} title={title}>
      {children}
    </Text>
  );
}
