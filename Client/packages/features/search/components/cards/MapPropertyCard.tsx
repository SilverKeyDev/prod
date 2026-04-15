import React, { useEffect, useMemo } from "react";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import { PERFECT_CRITERIA_MATCH_CARD_CLASSNAME } from "@/components/cards/perfectMatchCardGlowClasses";
import { SearchResultListingCard } from "@/features/search/components/list/SearchResultListingCard.web";
import type { MapPropertyCardRenderProps } from "@/features/search/hooks/data/useMapMarkers";
import {
  isListingFullCriteriaMatch,
  type SearchResult,
} from "@/features/search/types";

export type MapPropertyCardProps = MapPropertyCardRenderProps & {
  onCardRendered?: (property: MapPropertyCardRenderProps["property"]) => void;
};

function mapCardPropertyToSearchResult(
  p: MapPropertyCardRenderProps["property"],
  normalizedScore: number | undefined,
  showScore: boolean,
): SearchResult {
  const _score =
    showScore && normalizedScore !== undefined && normalizedScore > 0
      ? normalizedScore
      : undefined;
  return {
    id: p.id,
    address: p.address,
    price: p.price,
    bedrooms: p.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? 0,
    sqft: p.sqft ?? 0,
    lat: p.lat,
    lng: p.lng,
    lotSize: p.lotSize,
    propertyType: p.propertyType,
    imageUrl: p.images?.[0],
    images: p.images,
    _score,
  };
}

const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  activeTab,
  property,
  isSaved = false,
  onUnlock: _onUnlock,
  showScore = true,
  onCardRendered,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  onDismissMapPreview,
  onOpenFullDetails,
}) => {
  useEffect(() => {
    if (onCardRendered) {
      onCardRendered(property);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- property identity intentionally not in deps to avoid reposition on every property change
  }, [property.id, isSaved, showScore, onCardRendered]);

  const isDev = getEnv().isDevelopment;

  let normalizedScore = property.calculatedScore;
  if (normalizedScore !== undefined && normalizedScore !== null) {
    if (typeof normalizedScore !== "number" || isNaN(normalizedScore)) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "🗺️ [MAP PROPERTY CARD] Invalid score type detected",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: property.id,
          originalScore: property.calculatedScore,
          scoreType: typeof property.calculatedScore,
        },
      );
      normalizedScore = undefined;
    } else if (normalizedScore < 0 || normalizedScore > 100) {
      log.warn(
        LOG_CATEGORIES.MAP_RENDERING,
        "🗺️ [MAP PROPERTY CARD] Score out of valid range (0-100)",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          propertyId: property.id,
          score: normalizedScore,
        },
      );
      normalizedScore = Math.max(0, Math.min(100, normalizedScore));
    } else if (normalizedScore === 0) {
      normalizedScore = undefined;
    }
  }

  const searchResult = useMemo(
    () => mapCardPropertyToSearchResult(property, normalizedScore, showScore),
    [property, normalizedScore, showScore],
  );

  const fullCriteriaMatch = isListingFullCriteriaMatch(searchResult);

  return (
    <Box
      className={`relative scale-90 transform ${
        fullCriteriaMatch ? PERFECT_CRITERIA_MATCH_CARD_CLASSNAME : ""
      }`}
    >
      <SearchResultListingCard
        property={searchResult}
        activeTab={activeTab}
        isHomeSaved={isHomeSaved}
        saveHome={
          saveHome
            ? async (p) => {
                await saveHome(p);
              }
            : undefined
        }
        removeSavedHome={removeSavedHome}
        isOnMap
        onMapNavigate={onOpenFullDetails}
        onDismissMapPreview={
          onDismissMapPreview
            ? () => {
                onDismissMapPreview(property.id);
              }
            : undefined
        }
        showMatchScore={showScore}
        showNotInterested={false}
      />
    </Box>
  );
};

export default MapPropertyCard;
