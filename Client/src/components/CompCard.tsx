import { MapPin, Bed, Bath, Square } from "lucide-react";

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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: comp.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatAddress = () => {
    return `${comp.address.streetAddress}, ${comp.address.city}, ${comp.address.state} ${comp.address.zipcode}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recently_sold':
        return 'bg-green-100 text-green-800';
      case 'for_sale':
        return 'bg-blue-100 text-blue-800';
      case 'off_market':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatHomeStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAgentName = (name: string) => {
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const imageUrl = comp.miniCardPhotos?.[0]?.url || '/defaut-home.jpg';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-beige/40 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={formatAddress()}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/defaut-home.jpg';
          }}
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comp.homeStatus)}`}>
            {formatHomeStatus(comp.homeStatus)}
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-semibold text-navy">
            {formatPrice(comp.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-brown mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-navy leading-tight">
              {comp.address.streetAddress}
            </p>
            <p className="text-xs text-gray-600">
              {comp.address.city}, {comp.address.state} {comp.address.zipcode}
            </p>
            {comp.parentRegion?.name && (
              <p className="text-xs text-brown font-medium">
                {comp.parentRegion.name}
              </p>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Bed className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {comp.bedrooms} bed{comp.bedrooms !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {comp.bathrooms} bath{comp.bathrooms !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {comp.livingArea?.toLocaleString()} {comp.livingAreaUnitsShort || 'sqft'}
            </span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2">

          {/* Lot Size */}
          {comp.lotAreaValue && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Lot:</span>
              <span className="text-xs font-medium text-navy">
                {comp.lotAreaValue} {comp.lotAreaUnits?.toLowerCase() || 'acres'}
                {comp.lotSize && comp.lotAreaUnits?.toLowerCase().includes('acre') && ` (${comp.lotSize.toLocaleString()} sqft)`}
              </span>
            </div>
          )}

          {/* Agent/Broker */}
          {comp.attributionInfo?.agentName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Agent:</span>
              <span className="text-xs font-medium text-navy">
                {formatAgentName(comp.attributionInfo.agentName)}
              </span>
            </div>
          )}
        </div>

        {/* Price per sqft - always show */}
        {comp.livingArea && comp.price && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Price per sqft:</span>
              <span className="text-xs font-semibold text-brown">
                ${Math.round(comp.price / comp.livingArea).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
