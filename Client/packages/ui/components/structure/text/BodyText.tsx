import React, { forwardRef } from "react";

import { Text } from "packages/ui/components/structure/primitives";

export type BodyTextSize = "xs" | "sm" | "md" | "lg";

export type BodyTextProps = {
  children: React.ReactNode;
  size?: BodyTextSize;
  className?: string;
  muted?: boolean;
  as?: "p" | "span" | "div";
  title?: string;
  style?: React.CSSProperties | Record<string, unknown>;
  numberOfLines?: number;
  /** DOM id for `aria-describedby` / anchors (web). */
  id?: string;
  role?: React.AriaRole;
};

const sizeClasses: Record<BodyTextSize, string> = {
  xs: "text-xs sm:text-sm",
  sm: "text-sm sm:text-base",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
};

/**
 * Shared BodyText - uses Text primitive. Web keeps semantic `as`; native uses Text.
 */
const BodyText = forwardRef<React.ComponentRef<typeof Text>, BodyTextProps>(function BodyText(
  {
    children,
    size = "md",
    className = "",
    muted = false,
    as: asProp = "p",
    title,
    style,
    numberOfLines,
    id,
    role,
    ...textProps
  },
  ref
) {
  const baseClasses = "font-normal leading-relaxed";
  const colorClass = muted ? "text-text-secondary" : "text-text-primary";
  const combinedClasses = [baseClasses, sizeClasses[size], colorClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Text
      ref={ref}
      as={asProp}
      className={combinedClasses}
      style={style}
      title={title}
      numberOfLines={numberOfLines}
      id={id}
      role={role}
      {...textProps}
    >
      {children}
    </Text>
  );
});

BodyText.displayName = "BodyText";

export default BodyText;
