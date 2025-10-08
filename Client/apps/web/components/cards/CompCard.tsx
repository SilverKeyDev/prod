import { Bed, Bath, Square, MapPin, User } from "lucide-react";

import {
  formatPrice,
  getStatusColor,
  formatHomeStatus,
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
  const lotSizeDisplay =
    comp.lotAreaValue && comp.lotAreaValue >= 100
      ? formatLotSize(comp.lotAreaValue)
      : comp.lotAreaValue && comp.lotAreaValue < 100
        ? "N/A"
        : null;

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

          {/* Recently Sold Badge - reduced padding, aligned in same row */}
          <div
            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
              comp.homeStatus
            )}`}
          >
            {formatHomeStatus(comp.homeStatus)}
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
        {comp.attributionInfo?.agentName && (
          <div className="space-y-2 text-left mt-auto">
            <div className="flex items-center gap-1">
              <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-500">
                Agent: {formatAgentName(comp.attributionInfo.agentName)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
