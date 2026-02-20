import React from "react";

import BaseLabel from "@/components/ui/text/Label.web";

export type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
};

const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = "",
}) => {
  return (
    <BaseLabel
      htmlFor={htmlFor}
      required={required}
      variant="medium"
      size="sm"
      color="black"
      className={`mb-2 ${className}`}
    >
      {children}
    </BaseLabel>
  );
};

export default Label;
