import React from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";

type ActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  text?: string;
  colorClasses?: string;
  className?: string;
  hideTextOnMobile?: boolean;
  title?: string;
};

/**
 * Card action button used by ReportCard and similar. Maps to standardized Button
 * with custom color classes and optional icon/text.
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  icon,
  text = "",
  colorClasses = "",
  className = "",
  hideTextOnMobile = false,
  title,
  ...rest
}) => (
  <Button
    variant="primary"
    size="md"
    onClick={onClick}
    disabled={disabled}
    icon={icon ?? <Icon name="more-horizontal" />}
    iconPosition="left"
    className={`${colorClasses} ${className}`.trim() || undefined}
    hideTextBelow={hideTextOnMobile ? "md" : undefined}
    title={title}
    {...rest}
  >
    {text}
  </Button>
);

export default ActionButton;
