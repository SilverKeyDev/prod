import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import {
  formatListingStatusLabel,
  getMlsListingId,
  hasRenderableListingPrice,
} from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { StatChip } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { formatPrice } from "packages/utils/core/format/property";
import {
  formatLotSize,
  formatStructuredAddress,
} from "packages/utils/core/format/property/addressFormatting";

function getDisplayAddress(addr: unknown, notAvailable: string): string {
  if (!addr) return notAvailable;
  if (typeof addr === "string") return addr;
  if (
    typeof addr === "object" &&
    addr !== null &&
    "streetAddress" in addr &&
    "city" in addr &&
    "state" in addr &&
    "zipcode" in addr
  ) {
    return formatStructuredAddress(
      addr as {
        streetAddress: string;
        city: string;
        state: string;
        zipcode: string;
      }
    );
  }
  try {
    return JSON.stringify(addr);
  } catch {
    return notAvailable;
  }
}

function parsePositiveNumber(value: number | string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

type PropertySummaryProps = PropertyComponentProps & {
  isLoading?: boolean;
};

/** Price, status, and address — listing “header” without quick stats. */
export const PropertyListingHeader: React.FC<PropertySummaryProps> = ({
  property,
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const propertyRecord = property as unknown as Record<string, unknown>;
  const listingStatusCombined =
    propertyRecord.listingStatus ?? propertyRecord.listing_status ?? propertyRecord.homeStatus;
  const listingStatusRaw =
    typeof listingStatusCombined === "string" ? listingStatusCombined.trim() : undefined;
  const listingStatusLabel = formatListingStatusLabel(listingStatusRaw);
  const mlsListingId = getMlsListingId(property);

  const propertyPrice =
    "price" in property ? (property.price as number | string | undefined) : undefined;
  const previousListPrice =
    "previousListPrice" in property
      ? (property.previousListPrice as number | undefined)
      : undefined;
  const daysOnMarket =
    "daysOnMarket" in property ? (property.daysOnMarket as number | undefined) : undefined;

  const addr = (property as unknown as { address?: unknown }).address;
  const notAvailable = t("property_details.address_not_available", {
    defaultValue: "Address not available",
  });
  const displayAddress = getDisplayAddress(addr, notAvailable);
  const showPriceSkeleton = isLoading && !hasRenderableListingPrice(propertyPrice);
  const showAddressSkeleton = isLoading && displayAddress === notAvailable;

  const listPriceLabel = t("property_details.list_price_label", {
    defaultValue: "List price",
  });
  const statusPrefix = t("property_details.listing_status_label", {
    defaultValue: "Status",
  });

  return (
    <Box className="p-6 pb-0">
      <Box className="mb-4">
        <BodyText
          as="p"
          size="xs"
          className="text-text-secondary mb-1 font-medium uppercase tracking-wide"
        >
          {listPriceLabel}
        </BodyText>
        <Title as="h2" size="xl" className="text-text-primary mb-2 font-bold">
          {showPriceSkeleton ? (
            <Box
              className="bg-background-surface h-9 w-40 max-w-[90%] animate-pulse rounded-md"
              aria-hidden
            />
          ) : (
            formatPrice(propertyPrice)
          )}
        </Title>
        {(listingStatusLabel || mlsListingId || previousListPrice || daysOnMarket != null) && (
          <Box className="mb-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
            {listingStatusLabel ? (
              <BodyText as="p" size="sm" className="text-text-secondary">
                <BodyText as="span" size="sm" className="text-text-primary font-medium">
                  {statusPrefix}
                </BodyText>
                {": "}
                {listingStatusLabel}
              </BodyText>
            ) : null}
            {typeof daysOnMarket === "number" && daysOnMarket >= 0 ? (
              <BodyText as="p" size="sm" className="text-text-secondary">
                {t("property_details.days_on_market_line", {
                  count: daysOnMarket,
                  defaultValue: `${daysOnMarket} days on market`,
                })}
              </BodyText>
            ) : null}
            {typeof previousListPrice === "number" &&
            previousListPrice > 0 &&
            typeof propertyPrice === "number" &&
            previousListPrice > propertyPrice ? (
              <BodyText as="p" size="sm" className="text-green-600">
                {t("property_details.price_reduced", {
                  amount: `$${(previousListPrice - (propertyPrice as number)).toLocaleString()}`,
                  defaultValue: `Price reduced $${(
                    previousListPrice - (propertyPrice as number)
                  ).toLocaleString()}`,
                })}
              </BodyText>
            ) : null}
            {mlsListingId ? (
              <BodyText as="p" size="sm" className="text-text-secondary">
                {t("property_details.listing_number_line", {
                  id: mlsListingId,
                  defaultValue: `Listing #${mlsListingId}`,
                })}
              </BodyText>
            ) : null}
          </Box>
        )}
        {showAddressSkeleton ? (
          <Box className="mt-1 space-y-2" aria-hidden>
            <Box className="bg-background-surface h-4 w-64 max-w-[95%] animate-pulse rounded" />
            <Box className="bg-background-surface h-4 w-48 max-w-[80%] animate-pulse rounded" />
          </Box>
        ) : (
          <BodyText as="p" size="sm" className="text-text-secondary">
            {displayAddress}
          </BodyText>
        )}
      </Box>
    </Box>
  );
};

/** Bed / bath / sqft / lot / year built quick-stat row. */
export const PropertyListingQuickStats: React.FC<PropertySummaryProps> = ({ property }) => {
  const { t } = useLocalization();
  const propertyRecord = property as unknown as Record<string, unknown>;

  const propertyPrice =
    "price" in property ? (property.price as number | string | undefined) : undefined;
  const propertySqft =
    "sqft" in property ? (property.sqft as number | string | undefined) : undefined;
  const propertyBedrooms =
    "bedrooms" in property ? (property.bedrooms as number | string | undefined) : undefined;
  const propertyBathrooms =
    "bathrooms" in property ? (property.bathrooms as number | string | undefined) : undefined;
  const listingPricePerSqft =
    "pricePerSquareFoot" in property
      ? (property.pricePerSquareFoot as number | string | undefined)
      : undefined;
  const hasListingPricePerSqft =
    listingPricePerSqft &&
    ((typeof listingPricePerSqft === "number" && listingPricePerSqft > 0) ||
      (typeof listingPricePerSqft === "string" &&
        listingPricePerSqft !== "0" &&
        listingPricePerSqft.trim() !== ""));

  const priceNum = useMemo(() => parsePositiveNumber(propertyPrice), [propertyPrice]);
  const sqftNum = useMemo(() => parsePositiveNumber(propertySqft), [propertySqft]);
  const pricePerSqft =
    priceNum !== null && sqftNum !== null ? Math.round(priceNum / sqftNum) : null;

  const bedsLabel = t("property_details.beds", { defaultValue: "beds" });
  const bathsLabel = t("property_details.baths", { defaultValue: "baths" });
  const sqftLabel = t("property_details.sqft", { defaultValue: "sqft" });
  const perSqftLabel = t("property_details.per_sqft_abbr", {
    defaultValue: "per sq ft",
  });

  return (
    <Box className="px-6 pb-6">
      <Box className="flex flex-row flex-wrap gap-2 sm:gap-3">
        {propertyBedrooms && Number(propertyBedrooms) > 0 ? (
          <StatChip iconName="bed" value={String(propertyBedrooms)} label={bedsLabel} />
        ) : null}
        {propertyBathrooms && Number(propertyBathrooms) > 0 ? (
          <StatChip iconName="bath" value={String(propertyBathrooms)} label={bathsLabel} />
        ) : null}
        {propertySqft && Number(propertySqft) > 0 ? (
          <StatChip
            iconName="grid-3x3"
            value={Math.round(Number(propertySqft)).toLocaleString()}
            label={sqftLabel}
          />
        ) : null}
        {pricePerSqft !== null && !hasListingPricePerSqft ? (
          <StatChip
            iconName="dollar-sign"
            value={`$${pricePerSqft.toLocaleString()}`}
            label={perSqftLabel}
            emphasized
          />
        ) : null}
        {propertyRecord.yearBuilt && Number(propertyRecord.yearBuilt) > 0 ? (
          <StatChip
            iconName="calendar"
            value={String(propertyRecord.yearBuilt)}
            label={t("property_details.built", { defaultValue: "built" })}
          />
        ) : null}
        {(() => {
          const raw = propertyRecord.lotSize;
          if (raw === undefined || raw === null) return null;
          if (typeof raw === "string" && !raw.trim()) return null;
          if (typeof raw === "number" && !(raw > 0)) return null;
          const formatted = formatLotSize(typeof raw === "number" ? raw : String(raw));
          if (formatted === "N/A") return null;
          return (
            <StatChip
              iconName="map-pin"
              value={formatted}
              label={t("property_details.lot", { defaultValue: "lot" })}
            />
          );
        })()}
      </Box>
    </Box>
  );
};
