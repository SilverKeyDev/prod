import React from "react";

import MapHomeCard from "./MapHomeCard";

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
  try {
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
        <MapHomeCard
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
    );
  } catch (error) {
    console.error(
      "🗺️ [MAP PROPERTY CARD] Error rendering MapPropertyCard:",
      error
    );
    console.error("🗺️ [MAP PROPERTY CARD] Property data:", property);

    // Return a simple fallback card
    return (
      <div className="relative w-48 bg-red-100 border border-red-300 rounded-lg p-2">
        <div className="text-red-600 text-sm">Error loading property card</div>
        <div className="text-xs text-gray-600">{property.address}</div>
      </div>
    );
  }
};

export default MapPropertyCard;
