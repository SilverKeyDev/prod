import React from "react";

import { useLocalization } from "packages/contexts";

import {
  CardPropertyDetailsFirstRow,
  CardPropertyDetailsModalSqft,
  CardPropertyDetailsSecondRow,
} from "./CardPropertyDetailsRow";
import { CARD_PROPERTY_SIZE_STYLES } from "./CardPropertyDetailsStyles";

export type CardPropertyDetailsProps = {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  variant?: "horizontal" | "vertical" | "grid" | "modal";
  showIcons?: boolean;
  hideSquareFootage?: boolean;
  className?: string;
};

const LAYOUT_STYLES: Record<string, string> = {
  horizontal: "flex flex-col items-center justify-center",
  vertical: "flex flex-col items-center justify-center",
  grid: "flex flex-col items-center justify-center",
  modal: "flex flex-col items-center justify-center",
};

function getOptimalSize(contentCount: number): "sm" | "md" {
  return contentCount >= 2 ? "sm" : "md";
}

function getIsApartmentOrCondo(propertyType?: string): boolean {
  if (!propertyType) return false;
  const lower = propertyType.toLowerCase();
  return lower.includes("condo") || lower.includes("apartment");
}

const CardPropertyDetails: React.FC<CardPropertyDetailsProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  propertyType,
  variant = "horizontal",
  showIcons = true,
  hideSquareFootage = false,
  className = "",
}) => {
  const { t } = useLocalization();
  const hasSqft = !hideSquareFootage;
  const contentCount = [bedrooms, bathrooms].filter(
    (val) => val !== undefined && Number(val) > 0,
  ).length;
  const shouldMoveSqftToSecondRow = hasSqft && contentCount >= 2;
  const optimalSize = getOptimalSize(contentCount);
  const isApartmentOrCondo = getIsApartmentOrCondo(propertyType);
  const sizeStyles =
    CARD_PROPERTY_SIZE_STYLES[optimalSize] ?? CARD_PROPERTY_SIZE_STYLES.md;
  const layoutStyles = LAYOUT_STYLES[variant] ?? LAYOUT_STYLES.horizontal;

  const containerClasses = [
    layoutStyles,
    sizeStyles.gap,
    sizeStyles.spacing,
    "w-full min-w-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    bedrooms === undefined &&
    bathrooms === undefined &&
    sqft === undefined &&
    !lotSize
  ) {
    return null;
  }

  return (
    <div className={containerClasses}>
      <CardPropertyDetailsFirstRow
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        sqft={sqft}
        lotSize={lotSize}
        variant={variant}
        showIcons={showIcons}
        hasSqft={hasSqft}
        shouldMoveSqftToSecondRow={shouldMoveSqftToSecondRow}
        isApartmentOrCondo={isApartmentOrCondo}
        sizeStyles={sizeStyles}
      />
      {shouldMoveSqftToSecondRow && (
        <CardPropertyDetailsSecondRow
          sqft={sqft}
          lotSize={lotSize}
          showIcons={showIcons}
          isApartmentOrCondo={isApartmentOrCondo}
          sizeStyles={sizeStyles}
        />
      )}
      {variant === "modal" && hasSqft && (
        <CardPropertyDetailsModalSqft sqft={sqft} t={t} />
      )}
    </div>
  );
};

export default CardPropertyDetails;
