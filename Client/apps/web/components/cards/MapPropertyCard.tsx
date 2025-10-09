import React, { useEffect } from "react";

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
  onUnlock?: (property: any) => void;
  showScore?: boolean;
  onCardRendered?: (property: MapPropertyCardProps["property"]) => void;
};

const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  property,
  isSaved = false,
  onSave,
  onUnsave,
  onUnlock,
  showScore = true,
  onCardRendered,
}) => {
  // Trigger map repositioning when the card is rendered or updated
  useEffect(() => {
    if (onCardRendered) {
      onCardRendered(property);
    }
  }, [property, onCardRendered]);

  // Add comprehensive logging for debugging score issues
  console.log("🗺️ [MAP PROPERTY CARD] Rendering MapPropertyCard:", {
    propertyId: property.id,
    address: property.address,
    calculatedScore: property.calculatedScore,
    scoreType: typeof property.calculatedScore,
    showScore,
    isSaved,
    price: property.price,
  });

  try {
    // Validate and normalize the calculated score
    let normalizedScore = property.calculatedScore;

    // Check if score is valid
    if (normalizedScore !== undefined && normalizedScore !== null) {
      if (typeof normalizedScore !== "number" || isNaN(normalizedScore)) {
        console.warn("🗺️ [MAP PROPERTY CARD] Invalid score type detected:", {
          propertyId: property.id,
          originalScore: property.calculatedScore,
          scoreType: typeof property.calculatedScore,
        });
        normalizedScore = undefined;
      } else if (normalizedScore < 0 || normalizedScore > 100) {
        console.warn(
          "🗺️ [MAP PROPERTY CARD] Score out of valid range (0-100):",
          {
            propertyId: property.id,
            score: normalizedScore,
          }
        );
        // Clamp score to valid range
        normalizedScore = Math.max(0, Math.min(100, normalizedScore));
      }
    }

    console.log("🗺️ [MAP PROPERTY CARD] Normalized score:", {
      propertyId: property.id,
      originalScore: property.calculatedScore,
      normalizedScore,
      willShowScore: showScore && normalizedScore !== undefined,
    });

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
      calculatedScore: normalizedScore,
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
          onUnlock={(home) => {
            if (onUnlock) {
              // Convert home data back to property format
              const propertyData = {
                id: home.home_id,
                address: home.address,
                price: home.price,
                bedrooms: home.bedrooms,
                bathrooms: home.bathrooms,
                sqft: home.sqft,
                lotSize: home.lot_size,
                propertyType: home.propertyType,
                lat: home.lat,
                lng: home.lng,
                images: home.image_url ? [home.image_url] : undefined,
                calculatedScore: home.calculatedScore,
              };
              onUnlock(propertyData);
            }
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
