import React, { forwardRef } from "react";

export type BoxProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Base Box primitive — one div for React (web).
 * Native uses View. Use this (or the resolved Box) so layout is platform-agnostic.
 */
const Box = forwardRef<HTMLDivElement, BoxProps>(function Box({ className = "", ...props }, ref) {
  return <div ref={ref} className={className} {...props} />;
});

export default Box;
