import React from "react";

type SectionBoxProps = {
  children: React.ReactNode;
  className?: string;
};

const SectionBox: React.FC<SectionBoxProps> = ({ children, className = "" }) => {
  const baseClasses = "bg-background-surface rounded-xl shadow-sm p-6 mb-6 border border-border";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return <div className={combinedClasses}>{children}</div>;
};

export default SectionBox;
