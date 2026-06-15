import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type ProfileFullWidthFieldProps = {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** Full-width label + control stack with consistent spacing (`min-w-0`, control `mt-2`). */
export function ProfileFullWidthField({
  label,
  children,
  className = "",
}: ProfileFullWidthFieldProps) {
  return (
    <Box className={`min-w-0 ${className}`.trim()}>
      {label}
      <Box className="mt-2 min-w-0">{children}</Box>
    </Box>
  );
}
