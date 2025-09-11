import React from "react";

interface SectionBoxProps {
  children: React.ReactNode;
  className?: string;
}

const SectionBox: React.FC<SectionBoxProps> = ({
  children,
  className = "",
}) => {
  const baseClasses =
    "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return <div className={combinedClasses}>{children}</div>;
};

export default SectionBox;
