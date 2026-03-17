import React from "react";

import { Icon } from "@ui/icons";

import type { AlertSeverity } from "packages/schemas/agent";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
type RiskFlagProps = {
  severity: AlertSeverity;
  message: string;
  className?: string;
};
const RiskFlag: React.FC<RiskFlagProps> = ({ severity, message, className = "" }) => {
  const severityConfig: Record<
    AlertSeverity,
    {
      icon: React.ReactNode;
      color: string;
      bgColor: string;
    }
  > = {
    low: {
      icon: <Icon name="info" className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-text-primary",
      bgColor: "bg-primary-muted",
    },
    medium: {
      icon: <Icon name="alert-circle" className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-warning-text",
      bgColor: "bg-warning-bg",
    },
    high: {
      icon: <Icon name="alert-triangle" className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-primary",
      bgColor: "bg-primary-muted",
    },
    critical: {
      icon: <Icon name="alert-triangle" className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-destructive",
      bgColor: "bg-primary-muted",
    },
  };
  const config = severityConfig[severity];
  return (
    <Box
      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
      className={`inline-flex flex-row items-center gap-1.5 rounded-full px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 ${config.bgColor} ${config.color} ${className}`}
      title={message}
    >
      {config.icon}
      <BodyText as="span" size="sm" className="font-medium">
        {message}
      </BodyText>
    </Box>
  );
};
export default RiskFlag;
