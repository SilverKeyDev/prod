import React, { forwardRef } from "react";

export type ScrollViewProps = React.HTMLAttributes<HTMLDivElement> & {
  horizontal?: boolean;
};

const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(function ScrollView(
  { children, className = "", style, horizontal = false, ...props },
  ref
) {
  const resolvedStyle = {
    overflowX: horizontal ? "auto" : "hidden",
    overflowY: horizontal ? "hidden" : "auto",
    ...(style as Record<string, unknown>),
  };
  return (
    <div ref={ref} className={className} style={resolvedStyle} {...props}>
      {children}
    </div>
  );
});

export default ScrollView;
