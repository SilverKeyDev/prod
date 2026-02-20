import { useMemo } from "react";

import type { AgreementStatus } from "packages/schemas/content/documents/docusign";
import {
  getStatusColor,
  getStatusLabel,
  getStatusTooltip,
} from "packages/utils/domain/documents/docusignHelpers";

import { BodyText } from "@/components/ui/index.web";
import { getStatusIcon } from "@/features/documents/docusign/utils/docusignIcons";

type AgreementStatusBadgeProps = {
  status: AgreementStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
};

/**
 * AgreementStatusBadge Component
 *
 * Displays a color-coded status badge for DocuSign agreements
 * Used across all DocuSign UI components for consistent status display
 */
export default function AgreementStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: AgreementStatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const Icon = getStatusIcon(status);
  const label = getStatusLabel(status);
  const tooltip = getStatusTooltip(status);

  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };
    return sizes[size];
  }, [size]);

  const iconSizes = useMemo(() => {
    const sizes = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };
    return sizes[size];
  }, [size]);

  return (
    <BodyText
      as="span"
      size={size === "lg" ? "md" : size === "md" ? "sm" : "xs"}
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClass} ${sizeClasses} ${className}`}
      title={tooltip}
    >
      {showIcon && <Icon className={iconSizes} />}
      {label}
    </BodyText>
  );
}
