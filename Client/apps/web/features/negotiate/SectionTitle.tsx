import React from "react";

type SectionTitleProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  icon,
  className = "",
}) => {
  const baseClasses =
    "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={combinedClasses}>
      {icon}
      {children}
    </div>
  );
};

export default SectionTitle;
