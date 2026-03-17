import React from "react";

import { Icon } from "@ui/icons";

import type { DealStage } from "packages/schemas/agent";
import { Box } from "packages/ui/components/primitives";

import StatusBadge from "@/components/ui/asset/StatusBadge";
type DealStageBadgeProps = {
  stage: DealStage;
  className?: string;
};
const DealStageBadge: React.FC<DealStageBadgeProps> = ({ stage, className = "" }) => {
  const stageConfig: Record<
    DealStage,
    {
      label: string;
      variant: "success" | "warning" | "info" | "processing" | "default";
      icon: React.ReactNode;
    }
  > = {
    search: {
      label: "Search",
      variant: "info",
      icon: <Icon name="search" className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    touring: {
      label: "Touring",
      variant: "processing",
      icon: <Icon name="home" className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    offer: {
      label: "Offer",
      variant: "warning",
      icon: <Icon name="file-text" className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    under_contract: {
      label: "Under Contract",
      variant: "processing",
      icon: <Icon name="check-circle" className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    closing: {
      label: "Closing",
      variant: "success",
      icon: <Icon name="calendar" className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
  };
  const config = stageConfig[stage];
  return (
    <Box className={`inline-flex flex-row items-center gap-1.5 sm:gap-2 ${className}`}>
      {config.icon}
      <StatusBadge text={config.label} variant={config.variant} size="sm" />
    </Box>
  );
};
export default DealStageBadge;
