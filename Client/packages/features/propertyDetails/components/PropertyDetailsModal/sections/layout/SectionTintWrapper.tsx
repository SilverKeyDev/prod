import React from "react";

type SectionTintWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionTintWrapper: React.FC<SectionTintWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`border-beige bg-beige/20 rounded-lg border p-6 ${className}`}>{children}</div>
  );
};
