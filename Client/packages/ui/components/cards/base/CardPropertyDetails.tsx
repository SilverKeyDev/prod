import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";

import { PropertyStat } from "@/components/ui";
export type CardPropertyDetailsProps = {
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Lot size */
  lotSize?: string;
  /** Display variant */
  variant?: "horizontal" | "vertical" | "grid" | "modal";
  /** Whether to show icons */
  showIcons?: boolean;
  /** Whether to hide square footage */
  hideSquareFootage?: boolean;
  /** Additional className */
  className?: string;
};
const CardPropertyDetails: React.FC<CardPropertyDetailsProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  variant = "horizontal",
  showIcons = true,
  hideSquareFootage = false,
  className = "",
}) => {
  const { t } = useLocalization();
  // Dynamic size calculation based on content length for optimal single-line fit
  // Only move sqft to second level if it would cause overflow (within 10px of edge)
  const hasSqft = !hideSquareFootage; // Always show sqft unless explicitly hidden
  const contentCount = [bedrooms, bathrooms].filter(
    (val) => val !== undefined && Number(val) > 0
  ).length;
  const shouldMoveSqftToSecondRow = hasSqft && contentCount >= 2; // Move to second row if 2+ items + sqft
  const calculateOptimalSize = () => {
    // Scale based on bedrooms/bathrooms only, sqft goes to second level if needed
    if (contentCount >= 2) return "sm"; // Two items - medium
    return "md"; // Single item - comfortable size
  };
  const optimalSize = calculateOptimalSize();
  const statSize = optimalSize === "sm" ? "sm" : "md";
  const layoutStyles = {
    horizontal: "flex flex-col items-center justify-center",
    vertical: "flex flex-col items-center justify-center",
    grid: "flex flex-col items-center justify-center",
    modal: "flex flex-col items-center justify-center",
  };
  const gapSpacing = {
    sm: "gap-1 sm:gap-1.5",
    md: "gap-1.5 sm:gap-2",
  } as const;
  const containerClasses = [
    layoutStyles[variant],
    gapSpacing[optimalSize],
    "px-0.5",
    "w-full min-w-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  if (bedrooms === undefined && bathrooms === undefined && sqft === undefined && !lotSize)
    return null;
  return (
    <div className={containerClasses}>
      {/* First row: bedrooms, bathrooms, and optionally sqft */}
      <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
        {bedrooms !== undefined && Number(bedrooms) > 0 && (
          <PropertyStat icon={showIcons ? <Icon name="bed" /> : undefined} size={statSize}>
            {variant === "modal"
              ? bedrooms
              : `${bedrooms} ${bedrooms !== 1 ? t("house.beds_plural") : t("house.beds")}`}
          </PropertyStat>
        )}

        {bathrooms !== undefined && Number(bathrooms) > 0 && (
          <PropertyStat icon={showIcons ? <Icon name="bath" /> : undefined} size={statSize}>
            {variant === "modal"
              ? bathrooms
              : `${bathrooms} ${bathrooms !== 1 ? t("house.baths_plural") : t("house.baths")}`}
          </PropertyStat>
        )}

        {hasSqft && !shouldMoveSqftToSecondRow && (
          <PropertyStat icon={showIcons ? <Icon name="square" /> : undefined} size={statSize}>
            {sqft === undefined || Number(sqft) <= 0
              ? `${t("house.na")} ${t("house.sqft")}`
              : `${Math.round(Number(sqft)).toLocaleString()} ${t("house.sqft")}`}
          </PropertyStat>
        )}
      </div>

      {/* Second row: square footage (only if moved here for spacing) */}
      {shouldMoveSqftToSecondRow && (
        <div className="flex flex-shrink-0 items-center justify-center">
          <PropertyStat icon={showIcons ? <Icon name="square" /> : undefined} size={statSize}>
            {sqft === undefined || Number(sqft) <= 0
              ? `${t("house.na")} ${t("house.sqft")}`
              : `${Math.round(Number(sqft)).toLocaleString()} ${t("house.sqft")}`}
          </PropertyStat>
        </div>
      )}

      {variant === "modal" && hasSqft && (
        <PropertyStat size={statSize}>
          {sqft === undefined || Number(sqft) <= 0
            ? t("house.na")
            : Math.round(Number(sqft)).toLocaleString()}
          {" · "}
          {t("house.sqft")}
        </PropertyStat>
      )}
    </div>
  );
};
export default CardPropertyDetails;
