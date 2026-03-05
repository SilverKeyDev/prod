import React, { forwardRef } from "react";

import { Text } from "packages/ui/components/primitives/text";

export type BodyTextSize = "xs" | "sm" | "md" | "lg";

export type BodyTextProps = {
  children: React.ReactNode;
  size?: BodyTextSize;
  className?: string;
  muted?: boolean;
  /** Ignored on native; all body text uses Text. */
  as?: "p" | "span" | "div";
  title?: string;
  style?: Record<string, unknown>;
  numberOfLines?: number;
};

const sizeClasses: Record<BodyTextSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/**
 * Native BodyText — uses RN Text so strings are always inside <Text>.
 * Same API as web BodyText; "as" is ignored.
 */
const BodyText = forwardRef<React.ComponentRef<typeof Text>, BodyTextProps>(
  (
    {
      children,
      size = "md",
      className = "",
      muted = false,
      style,
      numberOfLines,
      as: _as,
      title: _title,
      ...textProps
    },
    ref
  ) => {
    const baseClasses = "font-normal leading-relaxed";
    const colorClass = muted ? "text-gray-600" : "text-gray-900";
    const combinedClasses = [baseClasses, sizeClasses[size], colorClass, className]
      .filter(Boolean)
      .join(" ");

    return (
      <Text
        ref={ref}
        className={combinedClasses}
        style={style}
        numberOfLines={numberOfLines}
        {...textProps}
      >
        {children}
      </Text>
    );
  }
);

BodyText.displayName = "BodyText";

export default BodyText;
