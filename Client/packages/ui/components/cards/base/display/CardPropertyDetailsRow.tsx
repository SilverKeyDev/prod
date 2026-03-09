import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { formatLotSizeInAcres } from "packages/features/search/types/search/address";

import { PropertyStat } from "@/components/ui";

import {
  CARD_PROPERTY_SIZE_STYLES,
  type CardPropertySizeStyles,
} from "./CardPropertyDetailsStyles";
function formatSqftDisplay(sqft: number | undefined, t: (key: string) => string): string {
  if (sqft === undefined || Number(sqft) <= 0) return t("house.na_sqft");
  return `${Math.round(Number(sqft)).toLocaleString()} ${t("house.sqft")}`;
}
function formatLotDisplay(lotSize: string | undefined, t: (key: string) => string): string {
  if (!lotSize || lotSize === "N/A" || lotSize.trim() === "") return t("house.no_data");
  const formatted = formatLotSizeInAcres(lotSize);
  return formatted ?? t("house.no_data");
}
export function CardPropertyDetailsFirstRow({
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  variant,
  showIcons,
  hasSqft,
  shouldMoveSqftToSecondRow,
  isApartmentOrCondo,
  sizeStyles,
}: {
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  variant: "horizontal" | "vertical" | "grid" | "modal";
  showIcons: boolean;
  hasSqft: boolean;
  shouldMoveSqftToSecondRow: boolean;
  isApartmentOrCondo: boolean;
  sizeStyles: CardPropertySizeStyles;
}) {
  const { t } = useLocalization();
  const statSize = sizeStyles === CARD_PROPERTY_SIZE_STYLES.sm ? "sm" : "md";
  return (
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
        <>
          <PropertyStat icon={showIcons ? <Icon name="home" /> : undefined} size={statSize}>
            {formatSqftDisplay(sqft, t)}
          </PropertyStat>
          {!isApartmentOrCondo && (
            <PropertyStat icon={showIcons ? <Icon name="square" /> : undefined} size={statSize}>
              {formatLotDisplay(lotSize, t)}
            </PropertyStat>
          )}
        </>
      )}
    </div>
  );
}
export function CardPropertyDetailsSecondRow({
  sqft,
  lotSize,
  showIcons,
  isApartmentOrCondo,
  sizeStyles,
}: {
  sqft?: number;
  lotSize?: string;
  showIcons: boolean;
  isApartmentOrCondo: boolean;
  sizeStyles: CardPropertySizeStyles;
}) {
  const { t } = useLocalization();
  const statSize = sizeStyles === CARD_PROPERTY_SIZE_STYLES.sm ? "sm" : "md";
  return (
    <div className="flex flex-shrink-0 flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <PropertyStat icon={showIcons ? <Icon name="home" /> : undefined} size={statSize}>
        {formatSqftDisplay(sqft, t)}
      </PropertyStat>
      {!isApartmentOrCondo && (
        <PropertyStat icon={showIcons ? <Icon name="square" /> : undefined} size={statSize}>
          {formatLotDisplay(lotSize, t)}
        </PropertyStat>
      )}
    </div>
  );
}
export function CardPropertyDetailsModalSqft({
  sqft,
  t,
}: {
  sqft?: number;
  t: (key: string) => string;
}) {
  const value =
    sqft === undefined || Number(sqft) <= 0
      ? t("house.na")
      : Math.round(Number(sqft)).toLocaleString();
  return (
    <PropertyStat size="md">
      {value} · {t("property_details.sq_ft_label")}
    </PropertyStat>
  );
}
