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
    <div
      className={`rounded-lg border border-beige bg-beige/20 p-6 ${className}`}
    >
      {children}
    </div>
  );
};
