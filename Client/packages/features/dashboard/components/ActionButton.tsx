import React from "react";

import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";
type ActionButtonProps = {
  action: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
};
const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  onClick,
  variant = "primary",
  className = "",
}) => {
  return (
    <Button
      variant={variant}
      size="md"
      onClick={onClick}
      icon={<Icon name="arrow-right" className="h-4 w-4 sm:h-5 sm:w-5" />}
      iconPosition="right"
      className={className}
    >
      {action}
    </Button>
  );
};
export default ActionButton;
