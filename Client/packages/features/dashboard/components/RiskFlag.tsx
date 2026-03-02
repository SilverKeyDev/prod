import React from "react";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";

import type { AlertSeverity } from "packages/schemas/agent";
import { BodyText } from "packages/ui/components/index.web";

type RiskFlagProps = {
  severity: AlertSeverity;
  message: string;
  className?: string;
};

const RiskFlag: React.FC<RiskFlagProps> = ({ severity, message, className = "" }) => {
  const severityConfig: Record<
    AlertSeverity,
    { icon: React.ReactNode; color: string; bgColor: string }
  > = {
    low: {
      icon: <Info className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-navy",
      bgColor: "bg-neutral-100",
    },
    medium: {
      icon: <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    high: {
      icon: <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-olive",
      bgColor: "bg-olive/10",
    },
    critical: {
      icon: <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  };

  const config = severityConfig[severity];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 ${config.bgColor} ${config.color} ${className}`}
      title={message}
    >
      {config.icon}
      <BodyText as="span" size="sm" className="font-medium">
        {message}
      </BodyText>
    </div>
  );
};

export default RiskFlag;
