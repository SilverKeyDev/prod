import React from "react";
import { Search, Home, FileText, CheckCircle, Calendar } from "lucide-react";
import StatusBadge from "../../../components/ui/asset/StatusBadge";
import type { DealStage } from "../../../../../packages/schemas/agent";

type DealStageBadgeProps = {
  stage: DealStage;
  className?: string;
};

const DealStageBadge: React.FC<DealStageBadgeProps> = ({
  stage,
  className = "",
}) => {
  const stageConfig: Record<
    DealStage,
    { label: string; variant: "success" | "warning" | "info" | "processing" | "default"; icon: React.ReactNode }
  > = {
    search: {
      label: "Search",
      variant: "info",
      icon: <Search className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    touring: {
      label: "Touring",
      variant: "processing",
      icon: <Home className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    offer: {
      label: "Offer",
      variant: "warning",
      icon: <FileText className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    under_contract: {
      label: "Under Contract",
      variant: "processing",
      icon: <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
    closing: {
      label: "Closing",
      variant: "success",
      icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />,
    },
  };

  const config = stageConfig[stage];

  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
      {config.icon}
      <StatusBadge text={config.label} variant={config.variant} size="sm" />
    </div>
  );
};

export default DealStageBadge;
