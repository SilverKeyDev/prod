import React, { forwardRef } from "react";

type TextAs = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type TextProps = React.HTMLAttributes<HTMLElement> & {
  as?: TextAs;
  numberOfLines?: number;
};

const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { as: Component = "p", className = "", style, numberOfLines, children, ...props },
  ref
) {
  const resolvedStyle =
    numberOfLines != null
      ? {
          ...style,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: "vertical" as const,
        }
      : style;

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
