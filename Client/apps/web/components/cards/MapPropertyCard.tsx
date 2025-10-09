import React, { useEffect, useMemo } from "react";

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
    // Depend on property.id and key props to ensure re-execution when property changes
  }, [property.id, isSaved, showScore, onCardRendered]);

  // Add comprehensive logging for debugging score issues
  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  console.log("🗺️ [MAP PROPERTY CARD] Rendering MapPropertyCard:", {
    environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
    propertyId: property.id,
    address: property.address?.substring(0, 40) + "...",
    calculatedScore: property.calculatedScore,
    scoreType: typeof property.calculatedScore,
    showScore,
    isSaved,
    price: property.price,
    hasValidScore:
      property.calculatedScore !== undefined &&
      property.calculatedScore !== null &&
      property.calculatedScore > 0,
  });

  try {
    // Validate and normalize the calculated score
    let normalizedScore = property.calculatedScore;

    // Check if score is valid (only validate if a score was provided)
    if (normalizedScore !== undefined && normalizedScore !== null) {
      if (typeof normalizedScore !== "number" || isNaN(normalizedScore)) {
        console.warn("🗺️ [MAP PROPERTY CARD] Invalid score type detected:", {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: property.id,
          originalScore: property.calculatedScore,
          scoreType: typeof property.calculatedScore,
        });
        normalizedScore = undefined;
      } else if (normalizedScore < 0 || normalizedScore > 100) {
        console.warn(
          "🗺️ [MAP PROPERTY CARD] Score out of valid range (0-100):",
          {
            environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
            propertyId: property.id,
            score: normalizedScore,
          }
        );
        // Clamp score to valid range
        normalizedScore = Math.max(0, Math.min(100, normalizedScore));
      } else if (normalizedScore === 0) {
        // Treat 0 as "no score" rather than showing a zero score
        console.log(
          "🗺️ [MAP PROPERTY CARD] Score is zero, treating as undefined:",
          {
            environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
            propertyId: property.id,
          }
        );
        normalizedScore = undefined;
      }
    }

    const willShowScore =
      showScore && normalizedScore !== undefined && normalizedScore > 0;
    console.log("🗺️ [MAP PROPERTY CARD] Normalized score:", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      propertyId: property.id,
      address: property.address?.substring(0, 30) + "...",
      originalScore: property.calculatedScore,
      normalizedScore,
      showScore,
      willShowScore,
      isSaved,
      hasScore: normalizedScore !== undefined && normalizedScore !== null,
    });

    // Convert property to HomeDescription format
    // Memoize to prevent unnecessary re-renders
    const homeData = useMemo(
      () => ({
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
      }),
      [
        property.id,
        property.images,
        property.price,
        property.bedrooms,
        property.bathrooms,
        property.sqft,
        property.lotSize,
        property.propertyType,
        property.lat,
        property.lng,
        property.address,
        normalizedScore,
      ]
    );

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
