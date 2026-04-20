import React, { forwardRef } from "react";

import { ROW_DEFAULT_CLASSES } from "packages/ui/styles/variants/boxStyles";

export type RowProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Row primitive - horizontal flex container for web.
 * Use for explicit flex-row layouts; matches RN Row.native behavior.
 */
const Row = forwardRef<HTMLDivElement, RowProps>(function Row({ className = "", ...props }, ref) {
  const combinedClassName = [ROW_DEFAULT_CLASSES, className].filter(Boolean).join(" ");
  return <div ref={ref} className={combinedClassName} {...props} />;
});

export default Row;
