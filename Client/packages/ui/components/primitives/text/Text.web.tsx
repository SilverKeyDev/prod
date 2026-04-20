import React, { forwardRef } from "react";

import type { WebStyleInput } from "packages/ui/utils/flattenWebStyle";
import { flattenWebStyle } from "packages/ui/utils/flattenWebStyle";

type TextAs = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type TextProps = Omit<React.HTMLAttributes<HTMLElement>, "style"> & {
  as?: TextAs;
  numberOfLines?: number;
  style?: WebStyleInput;
};

const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as: Component = "p", className = "", style, numberOfLines, children, ...props },
  ref
) {
  const flat = flattenWebStyle(style);
  const resolvedStyle: React.CSSProperties | undefined =
    numberOfLines != null
      ? {
          ...flat,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: "vertical" as const,
        }
      : Object.keys(flat).length > 0
        ? flat
        : undefined;

  return (
    <Component
      ref={ref as React.Ref<HTMLParagraphElement>}
      className={className}
      style={resolvedStyle}
      {...props}
    >
      {children}
    </Component>
  );
});

export default Text;
