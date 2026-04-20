import React from "react";

import { Box } from "packages/ui/components/primitives";
type SectionBoxProps = {
  children: React.ReactNode;
  className?: string;
};

const SectionBox: React.FC<SectionBoxProps> = ({ children, className = "" }) => {
  const baseClasses = "bg-background-surface rounded-xl shadow-sm p-6 mb-6 border border-border";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return <Box className={combinedClasses}>{children}</Box>;
};

export default SectionBox;
