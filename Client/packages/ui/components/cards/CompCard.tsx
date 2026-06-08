import { Icon } from "@ui/icons";

import {
  formatAgentName,
  formatLotSizeInAcres,
  formatPrice,
} from "packages/features/search/types/search/formatters/address";
import { Image } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
export type CompData = {
  address: {
    city: string;
    state: string;
    streetAddress: string;
    zipcode: string;
  };
  bathrooms: number;
  bedrooms: number;
  currency: string;
  homeStatus: string;
  homeType: string;
  latitude: number;
  livingArea: number;
  livingAreaUnits: string;
  livingAreaUnitsShort: string;
  longitude: number;
  lotAreaValue?: number;
  lotAreaUnits?: string;
  lotSize?: number;
  miniCardPhotos?: Array<{
    url: string;
  }>;
  parentRegion?: {
    name: string;
  };
  price: number;
  zpid: number;
  attributionInfo?: {
    agentName?: string;
    brokerName?: string;
    trueStatus?: string;
  };
};
type CompCardProps = {
  comp: CompData;
  className?: string;
};
export default function CompCard({ comp, className = "" }: CompCardProps) {
  const imageUrl = comp.miniCardPhotos?.[0]?.url ?? "/defaut-home.jpg";
  // Format lot size for display
  // Try lotAreaValue first, then fall back to lotSize
  const rawLotSize = comp.lotAreaValue ?? comp.lotSize;
  const lotSizeDisplay = (() => {
    if (!rawLotSize) return null;
    const lotSizeValue = typeof rawLotSize === "string" ? parseFloat(rawLotSize) : rawLotSize;
    if (isNaN(lotSizeValue) || lotSizeValue <= 0) return null;
    const unit = comp.lotAreaUnits?.toLowerCase();
    if (unit?.includes("acre")) {
      return formatLotSizeInAcres(`${lotSizeValue} acres`);
    }
    return formatLotSizeInAcres(lotSizeValue);
  })();
  return (
    <Box
      className={`border-border bg-background-surface flex flex-col overflow-hidden rounded-lg border shadow-sm ${className}`}
    >
      {/* Image Section */}
      <Box className="relative h-28 overflow-hidden sm:h-32 md:h-36">
        <Image
          src={imageUrl}
          alt={comp.address.streetAddress}
          className="h-full w-full object-cover"
        />

        {/* Price and Status Row */}
        <Box className="absolute left-2 right-2 top-2 flex items-center justify-between">
          {/* Price Badge - reduced padding */}
          <Box className="text-primary border-border bg-primary-muted rounded-full border px-2 py-1 text-xs font-medium backdrop-blur-sm sm:text-sm">
            {formatPrice(comp.price, comp.currency)}
          </Box>
        </Box>
      </Box>

      {/* Content Section */}
      <Box className="flex flex-1 flex-col p-3">
        {/* Address */}
        <Box className="mb-3 text-left">
          <Box className="mb-1 flex items-center gap-1">
            <Icon name="map-pin" className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <Title as="h3" size="sm" className="truncate font-medium text-black sm:text-base">
              {comp.address.streetAddress}
            </Title>
          </Box>
          <BodyText as="p" size="xs" muted className="ml-4 truncate sm:text-sm">
            {comp.address.city}, {comp.address.state} {comp.address.zipcode}
          </BodyText>
        </Box>

        {/* Property Details - Try to fit on same line, wrap if needed */}
        <Box className="mb-3 text-left">
          <Box className="flex flex-wrap gap-x-4 gap-y-2">
            {comp.bedrooms > 0 && (
              <Box className="flex items-center gap-1">
                <Icon
                  name="bed"
                  className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3"
                />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {comp.bedrooms} bed{comp.bedrooms !== 1 ? "s" : ""}
                </BodyText>
              </Box>
            )}
            {comp.bathrooms > 0 && (
              <Box className="flex items-center gap-1">
                <Icon
                  name="bath"
                  className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3"
                />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {comp.bathrooms} bath{comp.bathrooms !== 1 ? "s" : ""}
                </BodyText>
              </Box>
            )}
            {comp.livingArea > 0 ? (
              <Box className="flex items-center gap-1">
                <Icon
                  name="square"
                  className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3"
                />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {Math.round(comp.livingArea).toLocaleString()} sqft
                </BodyText>
              </Box>
            ) : (
              <Box className="flex items-center gap-1">
                <Icon
                  name="square"
                  className="h-2.5 w-2.5 flex-shrink-0 text-transparent sm:h-3 sm:w-3"
                />
                <BodyText as="span" size="xs" className="text-transparent sm:text-sm">
                  {" ".repeat(8)}sqft
                </BodyText>
              </Box>
            )}
          </Box>
        </Box>

        {/* Lot Size - underneath bed/bath/sqft */}
        <Box className="mb-3 flex items-center gap-1 text-left">
          {lotSizeDisplay ? (
            <>
              <Icon
                name="map-pin"
                className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3"
              />
              <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                Lot: {lotSizeDisplay}
              </BodyText>
            </>
          ) : (
            <>
              <Icon
                name="map-pin"
                className="h-2.5 w-2.5 flex-shrink-0 text-transparent sm:h-3 sm:w-3"
              />
              <BodyText as="span" size="xs" className="text-transparent sm:text-sm">
                Lot: {" ".repeat(6)}
              </BodyText>
            </>
          )}
        </Box>

        {/* Agent and Brokerage Info */}
        <Box className="mt-auto space-y-2 text-left">
          <Box className="flex items-center gap-1">
            <Icon name="user" className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
            <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
              Agent:{" "}
              {comp.attributionInfo?.agentName
                ? formatAgentName(comp.attributionInfo.agentName)
                : "N/A"}
            </BodyText>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
