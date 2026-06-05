import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

type SectionTintWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionTintWrapper: React.FC<SectionTintWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <Box className={`border-border-card bg-bg-card-subtle rounded-lg border p-6 ${className}`}>
      {children}
    </Box>
  );
};
