import React, { memo } from "react";

import { ErrorBoundary } from "../../app/error";

import MapHomeCard from "./MapHomeCard";

export type MapPropertyCardProps = {
  property: {
    id: string;
    address: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lotSize?: string;
    propertyType?: string;
    lat: number;
    lng: number;
    images?: string[];
    imageUrl?: string;
    calculatedScore?: number;
  };
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onViewDetails?: () => void;
  showScore?: boolean;
  isMobile?: boolean;
  savedAddresses?: Set<string>;
  activeTab?: "results" | "saved";
  isHomeSaved?: (propertyId: string) => boolean;
};

const MapPropertyCard: React.FC<MapPropertyCardProps> = memo(
  ({
    property,
    onSave,
    onUnsave,
    showScore = true,
    isMobile = false,
    savedAddresses,
    activeTab = "results",
    isHomeSaved,
  }) => {
    // Add defensive programming to validate property data
    if (!property) {
      console.error("MapPropertyCard: property prop is undefined or null");
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-700">Error: No property data provided</p>
        </div>
      );
    }

    if (!property.id) {
      console.error("MapPropertyCard: property.id is missing");
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-700">Error: Property ID is missing</p>
        </div>
      );
    }

    // Convert property to HomeDescription format
    const homeData = {
      home_id: property.id,
      image_url:
        (property as any).imageUrl ||
        (property as any).image_url ||
        (property as any).imageSrc ||
        (property as any).imgSrc ||
        (property as any).images?.[0]?.url ||
        (property as any).imgUrl,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      lot_size: property.lotSize,
      propertyType: property.propertyType,
      lat: property.lat,
      lng: property.lng,
      address: property.address,
      calculatedScore: property.calculatedScore,
    };

    return (
      <div className="relative w-48">
        {/* Main card container with border only */}
        <div className="rounded-lg border-white">
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error("MapHomeCard Error:", error);
              console.error("Error Info:", errorInfo);
            }}
          >
            <MapHomeCard
              home={homeData}
              showScore={showScore}
              isOnMap={true}
              isHomeSaved={isHomeSaved || (() => false)}
              onSave={() => {
                onSave?.();
              }}
              onRemove={(_homeId) => {
                onUnsave?.();
              }}
              forceNoImagePlaceholder={isMobile}
              savedAddresses={savedAddresses}
              activeTab={activeTab}
            />
          </ErrorBoundary>
        </div>

        {/* Pointer triangle at the bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 transform">
          <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white drop-shadow-md"></div>
        </div>
      </div>
    );
  }
);

MapPropertyCard.displayName = "MapPropertyCard";

export default MapPropertyCard;
