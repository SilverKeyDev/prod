import React, { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { StatChip } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { formatPrice } from "packages/utils/format/property";
import { formatStructuredAddress } from "packages/utils/format/property/addressFormatting";

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
      },
    );
  }
  try {
    return JSON.stringify(addr);
  } catch {
    return notAvailable;
  }
}

function parsePositiveNumber(
  value: number | string | undefined,
): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n =
    typeof value === "number"
      ? value
      : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export const PropertyInfo: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const propertyPrice =
    "price" in property
      ? (property.price as number | string | undefined)
      : undefined;
  const propertySqft =
    "sqft" in property
      ? (property.sqft as number | string | undefined)
      : undefined;
  const propertyBedrooms =
    "bedrooms" in property
      ? (property.bedrooms as number | string | undefined)
      : undefined;
  const propertyBathrooms =
    "bathrooms" in property
      ? (property.bathrooms as number | string | undefined)
      : undefined;
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

  const addr = (property as unknown as { address?: unknown }).address;
  const notAvailable = t("property_details.address_not_available", {
    defaultValue: "Address not available",
  });
  const displayAddress = getDisplayAddress(addr, notAvailable);

  const priceNum = useMemo(
    () => parsePositiveNumber(propertyPrice),
    [propertyPrice],
  );
  const sqftNum = useMemo(
    () => parsePositiveNumber(propertySqft),
    [propertySqft],
  );
  const pricePerSqft =
    priceNum !== null && sqftNum !== null
      ? Math.round(priceNum / sqftNum)
      : null;

  const bedsLabel = t("property_details.beds", { defaultValue: "beds" });
  const bathsLabel = t("property_details.baths", { defaultValue: "baths" });
  const sqftLabel = t("property_details.sqft", { defaultValue: "sqft" });
  const perSqftLabel = t("property_details.per_sqft_abbr", {
    defaultValue: "per sq ft",
  });

  return (
    <Box className="p-6">
      <Box className="mb-4">
        <Title as="h2" size="xl" className="text-text-primary mb-2 font-bold">
          {formatPrice(propertyPrice)}
        </Title>
        <BodyText as="p" size="sm" className="text-text-secondary">
          {displayAddress}
        </BodyText>
      </Box>

      <Box className="flex flex-row flex-wrap gap-2 sm:gap-3">
        {propertyBedrooms && Number(propertyBedrooms) > 0 ? (
          <StatChip
            iconName="bed"
            value={String(propertyBedrooms)}
            label={bedsLabel}
          />
        ) : null}
        {propertyBathrooms && Number(propertyBathrooms) > 0 ? (
          <StatChip
            iconName="bath"
            value={String(propertyBathrooms)}
            label={bathsLabel}
          />
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
      </Box>
    </Box>
  );
};
