import React from "react";

import HomeCard from "./HomeCard";

export type MapPropertyCardProps = {
  property: {
    id: string;
    address: string;
    price: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    lotSize?: string;
    propertyType?: string;
    lat: number;
    lng: number;
    images?: string[];
    calculatedScore?: number;
  };
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  showScore?: boolean;
};

const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  property,
  isSaved = false,
  onSave,
  onUnsave,
  showScore = true,
}) => {
  // Convert property to HomeDescription format
  const homeData = {
    home_id: property.id,
    image_url: property.images?.[0],
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
        <HomeCard
          home={homeData}
          showScore={showScore}
          isOnMap={true}
          isHomeSaved={(_homeId) => isSaved}
          onSave={() => {
            onSave?.();
          }}
          onRemove={(_homeId) => {
            onUnsave?.();
          }}
        />
      </div>

      {/* Pointer triangle at the bottom */}
      <div className="absolute left-1/2 -translate-x-1/2 transform">
        <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white drop-shadow-md"></div>
      </div>
    </div>
  );
};

export default MapPropertyCard;
