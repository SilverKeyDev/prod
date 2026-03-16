import { useMemo } from "react";

import { BodyText } from "@/components/ui";

import { getAgreementStatusIcon } from "./agreementsIcons";

type AgreementStatusBadgeProps = {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
};

/**
 * AgreementStatusBadge Component
 *
 * Displays a color-coded status badge for agreements.
 * Used across agreement-related UI components for consistent status display.
 */
export default function AgreementStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className = "",
}: AgreementStatusBadgeProps) {
  const colorClass =
    status === "completed"
      ? "border-green-200 bg-green-50 text-green-700"
      : status === "voided"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "sent" || status === "delivered"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-gray-50 text-gray-700";
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

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

  const StatusIcon = getAgreementStatusIcon(status);

  return (
    <BodyText
      as="span"
      size={size === "lg" ? "md" : size === "md" ? "sm" : "xs"}
      // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
      className={`inline-flex flex-row items-center gap-1.5 rounded-full border font-medium ${colorClass} ${sizeClasses} ${className}`}
      title={label}
    >
      {showIcon && <StatusIcon className={iconSizes} />}
      {label}
    </BodyText>
  );
}
