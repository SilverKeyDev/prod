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
    // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
    <Box className={`border-border-card bg-bg-card-subtle rounded-lg border p-6 ${className}`}>
      {children}
    </Box>
  );
};
