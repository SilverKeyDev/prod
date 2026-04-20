import React from "react";

import { Box } from "packages/ui/components/primitives";
type SectionTitleProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ children, icon, className = "" }) => {
  const baseClasses = "text-lg font-semibold text-text-primary flex items-center gap-3 mb-4";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <Box className={combinedClasses}>
      {icon}
      {children}
    </Box>
  );
};

export default SectionTitle;
