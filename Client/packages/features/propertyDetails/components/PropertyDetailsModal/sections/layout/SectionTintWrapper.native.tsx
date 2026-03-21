import React from "react";

import { Box } from "packages/ui/components/primitives";

type SectionTintWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionTintWrapper: React.FC<SectionTintWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <Box
      className={`border-border bg-accent-muted rounded-lg border p-6 ${className}`.trim()}
    >
      {children}
    </Box>
  );
};
