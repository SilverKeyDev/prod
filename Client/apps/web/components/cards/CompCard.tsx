import { Bed, Bath, Square, MapPin, User } from "lucide-react";

import {
  formatPrice,
  formatAgentName,
  formatLotSize,
} from "../../../../packages/utils/address";

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
    const lotSizeValue =
      typeof rawLotSize === "string" ? parseFloat(rawLotSize) : rawLotSize;

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
      <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
        <img
          src={imageUrl}
          alt={comp.address.streetAddress}
          className="h-full w-full object-cover"
        />

        {/* Price and Status Row */}
        <div className="absolute left-2 right-2 top-2 flex items-center justify-between">
          {/* Price Badge - reduced padding */}
          <div className="rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 backdrop-blur-sm">
            {formatPrice(comp.price, comp.currency)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-3">
        {/* Address */}
        <div className="mb-3 text-left">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <h3 className="text-sm sm:text-base font-medium text-black truncate">
              {comp.address.streetAddress}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-black/60 truncate ml-4">
            {comp.address.city}, {comp.address.state} {comp.address.zipcode}
          </p>
        </div>

        {/* Property Details - Try to fit on same line, wrap if needed */}
        <div className="mb-3 text-left">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {comp.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">
                  {comp.bedrooms} bed{comp.bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {comp.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">
                  {comp.bathrooms} bath{comp.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {comp.livingArea > 0 ? (
              <div className="flex items-center gap-1">
                <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">
                  {Math.round(comp.livingArea).toLocaleString()} sqft
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Square className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-transparent flex-shrink-0" />
                <span className="text-xs sm:text-sm text-transparent">
                  {" ".repeat(8)}sqft
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lot Size - underneath bed/bath/sqft */}
        <div className="flex items-center gap-1 mb-3 text-left">
          {lotSizeDisplay ? (
            <>
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-500">
                Lot: {lotSizeDisplay}
              </span>
            </>
          ) : (
            <>
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-transparent flex-shrink-0" />
              <span className="text-xs sm:text-sm text-transparent">
                Lot: {" ".repeat(6)}
              </span>
            </>
          )}
        </div>

        {/* Agent and Brokerage Info */}
        <div className="space-y-2 text-left mt-auto">
          <div className="flex items-center gap-1">
            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-500">
              Agent:{" "}
              {comp.attributionInfo?.agentName
                ? formatAgentName(comp.attributionInfo.agentName)
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
