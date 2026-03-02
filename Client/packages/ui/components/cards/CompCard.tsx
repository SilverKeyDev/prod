import { Bath, Bed, MapPin, Square, User } from "lucide-react";

import {
  formatAgentName,
  formatLotSize,
  formatPrice,
} from "packages/features/search/types/search/address";
import { Image } from "packages/ui/components/primitives/media";
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
  miniCardPhotos?: Array<{ url: string }>;
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

    // Ensure we have a number
    const lotSizeValue = typeof rawLotSize === "string" ? parseFloat(rawLotSize) : rawLotSize;

    if (isNaN(lotSizeValue) || lotSizeValue <= 0) return null;

    // Check if we need to convert from acres to square feet
    const unit = comp.lotAreaUnits?.toLowerCase();
    if (unit?.includes("acre")) {
      // Convert acres to square feet (1 acre = 43,560 sqft)
      const sqft = lotSizeValue * 43560;
      return formatLotSize(sqft);
    }

    // Otherwise, format as-is (assumed to be in square feet)
    return formatLotSize(lotSizeValue);
  })();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {/* Image Section */}
      <div className="relative h-28 overflow-hidden sm:h-32 md:h-36">
        <Image
          src={imageUrl}
          alt={comp.address.streetAddress}
          className="h-full w-full object-cover"
        />

        {/* Price and Status Row */}
        <div className="absolute left-2 right-2 top-2 flex items-center justify-between">
          {/* Price Badge - reduced padding */}
          <div className="text-olive rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 text-xs font-medium backdrop-blur-sm sm:text-sm">
            {formatPrice(comp.price, comp.currency)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-3">
        {/* Address */}
        <div className="mb-3 text-left">
          <div className="mb-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
            <Title as="h3" size="sm" className="truncate font-medium text-black sm:text-base">
              {comp.address.streetAddress}
            </Title>
          </div>
          <BodyText as="p" size="xs" className="ml-4 truncate text-black/60 sm:text-sm">
            {comp.address.city}, {comp.address.state} {comp.address.zipcode}
          </BodyText>
        </div>

        {/* Property Details - Try to fit on same line, wrap if needed */}
        <div className="mb-3 text-left">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {comp.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {comp.bedrooms} bed{comp.bedrooms !== 1 ? "s" : ""}
                </BodyText>
              </div>
            )}
            {comp.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {comp.bathrooms} bath{comp.bathrooms !== 1 ? "s" : ""}
                </BodyText>
              </div>
            )}
            {comp.livingArea > 0 ? (
              <div className="flex items-center gap-1">
                <Square className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
                <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                  {Math.round(comp.livingArea).toLocaleString()} sqft
                </BodyText>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Square className="h-2.5 w-2.5 flex-shrink-0 text-transparent sm:h-3 sm:w-3" />
                <BodyText as="span" size="xs" className="text-transparent sm:text-sm">
                  {" ".repeat(8)}sqft
                </BodyText>
              </div>
            )}
          </div>
        </div>

        {/* Lot Size - underneath bed/bath/sqft */}
        <div className="mb-3 flex items-center gap-1 text-left">
          {lotSizeDisplay ? (
            <>
              <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
              <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
                Lot: {lotSizeDisplay}
              </BodyText>
            </>
          ) : (
            <>
              <MapPin className="h-2.5 w-2.5 flex-shrink-0 text-transparent sm:h-3 sm:w-3" />
              <BodyText as="span" size="xs" className="text-transparent sm:text-sm">
                Lot: {" ".repeat(6)}
              </BodyText>
            </>
          )}
        </div>

        {/* Agent and Brokerage Info */}
        <div className="mt-auto space-y-2 text-left">
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
            <BodyText as="span" size="xs" className="text-gray-500 sm:text-sm">
              Agent:{" "}
              {comp.attributionInfo?.agentName
                ? formatAgentName(comp.attributionInfo.agentName)
                : "N/A"}
            </BodyText>
          </div>
        </div>
      </div>
    </div>
  );
}
