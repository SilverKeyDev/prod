import {
  formatPrice,
  getStatusColor,
  formatHomeStatus,
  formatAgentName,
  formatLotSize,
} from "../../lib/addressFormat";
import { Bed, Bath, Square, MapPin, User, Building } from "lucide-react";

export interface CompData {
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
}

interface CompCardProps {
  comp: CompData;
  className?: string;
}

export default function CompCard({ comp, className = "" }: CompCardProps) {
  const imageUrl = comp.miniCardPhotos?.[0]?.url || "/defaut-home.jpg";

  // Format lot size for display
  const lotSizeDisplay =
    comp.lotAreaValue && comp.lotAreaValue >= 100
      ? formatLotSize(comp.lotAreaValue)
      : comp.lotAreaValue && comp.lotAreaValue < 100
        ? "N/A"
        : null;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}
    >
      {/* Image Section */}
      <div className="relative h-32 sm:h-40 md:h-48">
        <img
          src={imageUrl}
          alt={comp.address.streetAddress}
          className="w-full h-full object-cover"
        />

        {/* Price and Status Row */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {/* Price Badge - reduced padding */}
          <div className="bg-neutral-50/95 backdrop-blur-sm px-2 py-1 rounded-full border border-neutral-200/50">
            <span className="text-xs font-semibold text-brand-primary">
              {formatPrice(comp.price, comp.currency)}
            </span>
          </div>

          {/* Recently Sold Badge - reduced padding, aligned in same row */}
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              comp.homeStatus,
            )}`}
          >
            {formatHomeStatus(comp.homeStatus)}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Address */}
        <div className="mb-3 text-left">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-brown flex-shrink-0" />
            <h3 className="text-sm font-medium text-brown truncate">
              {comp.address.streetAddress}
            </h3>
          </div>
          <p className="text-xs text-brown/80 truncate ml-4">
            {comp.address.city}, {comp.address.state} {comp.address.zipcode}
          </p>
        </div>

        {/* Property Details - Try to fit on same line, wrap if needed */}
        <div className="mb-3 text-left">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {comp.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="w-3 h-3 text-brown flex-shrink-0" />
                <span className="text-xs text-brown whitespace-nowrap">
                  {comp.bedrooms} bed{comp.bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {comp.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-3 h-3 text-brown flex-shrink-0" />
                <span className="text-xs text-brown whitespace-nowrap">
                  {comp.bathrooms} bath{comp.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {comp.livingArea > 0 && (
              <div className="flex items-center gap-1">
                <Square className="w-3 h-3 text-brown flex-shrink-0" />
                <span className="text-xs text-brown whitespace-nowrap">
                  {Math.round(comp.livingArea).toLocaleString()} sqft
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lot Size - underneath bed/bath/sqft */}
        {lotSizeDisplay && (
          <div className="flex items-center gap-1 mb-3 text-left">
            <MapPin className="w-3 h-3 text-brown flex-shrink-0" />
            <span className="text-xs text-brown whitespace-nowrap">
              Lot: {lotSizeDisplay}
            </span>
          </div>
        )}

        {/* Agent and Brokerage Info */}
        {comp.attributionInfo?.agentName && (
          <div className="space-y-2 text-left mt-auto">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-brown flex-shrink-0" />
              <span className="text-xs text-brown whitespace-nowrap">
                Agent: {formatAgentName(comp.attributionInfo.agentName)}
              </span>
            </div>
            {comp.attributionInfo?.brokerName && (
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3 text-brown flex-shrink-0" />
                <span className="text-xs text-brown whitespace-nowrap">
                  {comp.attributionInfo.brokerName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
