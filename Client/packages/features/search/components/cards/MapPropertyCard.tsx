import React, { useEffect, useMemo } from "react";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";

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
  onUnlock?: (property: MapPropertyCardProps["property"]) => void | Promise<void>;
  showScore?: boolean;
  onCardRendered?: (property: MapPropertyCardProps["property"]) => void;
  /** Optional save state functions for use outside React context (e.g., map markers) */
  isHomeSaved?: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome?: (property: MapPropertyCardProps["property"]) => Promise<void>;
  removeSavedHome?: (propertyId: string, propertyAddress?: string) => Promise<void>;
  /** Optional context key to force a remount when external context changes (e.g., tab) */
  contextKey?: string;
};

const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  property,
  isSaved = false,
  onUnlock,
  showScore = true,
  onCardRendered,
  isHomeSaved,
  saveHome,
  removeSavedHome,
}) => {
  // Trigger map repositioning when the card is rendered or updated
  useEffect(() => {
    if (onCardRendered) {
      onCardRendered(property);
    }
    // Depend on property.id and key props to ensure re-execution when property changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- property identity intentionally not in deps to avoid reposition on every property change
  }, [property.id, isSaved, showScore, onCardRendered]);

  // Add comprehensive logging for debugging score issues
  const isDev = getEnv().isDevelopment;

  // Validate and normalize the calculated score (must run before hooks)
  let normalizedScore = property.calculatedScore;
  if (normalizedScore !== undefined && normalizedScore !== null) {
    if (typeof normalizedScore !== "number" || isNaN(normalizedScore)) {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "🗺️ [MAP PROPERTY CARD] Invalid score type detected", {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        propertyId: property.id,
        originalScore: property.calculatedScore,
        scoreType: typeof property.calculatedScore,
      });
      normalizedScore = undefined;
    } else if (normalizedScore < 0 || normalizedScore > 100) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "🗺️ [MAP PROPERTY CARD] Score out of valid range (0-100)",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: property.id,
          score: normalizedScore,
        }
      );
      normalizedScore = Math.max(0, Math.min(100, normalizedScore));
    } else if (normalizedScore === 0) {
      normalizedScore = undefined;
    }
  }

  // Convert property to HomeDescription format (hooks must be at top level)
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
    <div className="relative">
      <MapHomeCard
        home={homeData}
        onUnlock={onUnlock}
        showScore={showScore}
        isOnMap
        isSaved={isSaved}
        isHomeSaved={isHomeSaved}
        saveHome={saveHome}
        removeSavedHome={removeSavedHome}
      />
    </div>
  );
};

export default MapPropertyCard;
